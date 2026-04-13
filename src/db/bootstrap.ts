import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { count } from 'drizzle-orm';
import { db } from './client';
import { settings, tickets, transcripts } from './schema';
import { runMigrations } from './migrate';
import { Ticket, TicketSettings, Transcript } from '../types';

const LEGACY_SETTINGS_PATH = join(process.cwd(), 'settings.json');
const LEGACY_TICKETS_PATH = join(process.cwd(), 'data', 'tickets.json');

const DEFAULT_SETTINGS: TicketSettings = {
  categoryId: '',
  channelId: '',
  messageId: '',
  tags: [],
  adminRoles: [],
  supportRoles: [],
  autoCloseHours: 24,
  userCanClose: true
};

interface LegacySettingsFile {
  settings?: Partial<TicketSettings>;
}

interface LegacyTicketsFile {
  tickets?: Ticket[];
  transcripts?: Transcript[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function sanitizeSettings(settingsInput?: Partial<TicketSettings>): TicketSettings {
  return {
    categoryId: settingsInput?.categoryId ?? '',
    channelId: settingsInput?.channelId ?? '',
    messageId: settingsInput?.messageId ?? '',
    tags: isStringArray(settingsInput?.tags) ? settingsInput.tags : [],
    adminRoles: isStringArray(settingsInput?.adminRoles) ? settingsInput.adminRoles : [],
    supportRoles: isStringArray(settingsInput?.supportRoles) ? settingsInput.supportRoles : [],
    autoCloseHours: typeof settingsInput?.autoCloseHours === 'number' ? settingsInput.autoCloseHours : 24,
    userCanClose: typeof settingsInput?.userCanClose === 'boolean' ? settingsInput.userCanClose : true
  };
}

function settingsMatchDefault(currentSettings: typeof settings.$inferSelect | undefined): boolean {
  if (!currentSettings) {
    return true;
  }

  return currentSettings.categoryId === DEFAULT_SETTINGS.categoryId
    && currentSettings.channelId === DEFAULT_SETTINGS.channelId
    && currentSettings.messageId === DEFAULT_SETTINGS.messageId
    && currentSettings.tagsJson === JSON.stringify(DEFAULT_SETTINGS.tags)
    && currentSettings.adminRolesJson === JSON.stringify(DEFAULT_SETTINGS.adminRoles)
    && currentSettings.supportRolesJson === JSON.stringify(DEFAULT_SETTINGS.supportRoles)
    && currentSettings.autoCloseHours === DEFAULT_SETTINGS.autoCloseHours
    && currentSettings.userCanClose === DEFAULT_SETTINGS.userCanClose;
}

async function ensureDefaultSettingsRow(): Promise<void> {
  db.insert(settings).values({
    id: 1,
    categoryId: DEFAULT_SETTINGS.categoryId,
    channelId: DEFAULT_SETTINGS.channelId,
    messageId: DEFAULT_SETTINGS.messageId,
    tagsJson: JSON.stringify(DEFAULT_SETTINGS.tags),
    adminRolesJson: JSON.stringify(DEFAULT_SETTINGS.adminRoles),
    supportRolesJson: JSON.stringify(DEFAULT_SETTINGS.supportRoles),
    autoCloseHours: DEFAULT_SETTINGS.autoCloseHours,
    userCanClose: DEFAULT_SETTINGS.userCanClose
  }).onConflictDoNothing().run();
}

function readLegacyJson<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function importLegacyDataIfNeeded(): Promise<void> {
  const currentSettings = db.select().from(settings).get();
  const ticketCount = db.select({ value: count() }).from(tickets).get()?.value ?? 0;
  const transcriptCount = db.select({ value: count() }).from(transcripts).get()?.value ?? 0;

  if (ticketCount > 0 || transcriptCount > 0 || !settingsMatchDefault(currentSettings)) {
    return;
  }

  const legacySettings = readLegacyJson<LegacySettingsFile>(LEGACY_SETTINGS_PATH);
  const legacyTickets = readLegacyJson<LegacyTicketsFile>(LEGACY_TICKETS_PATH);

  if (!legacySettings && !legacyTickets) {
    return;
  }

  if (legacySettings?.settings) {
    const importedSettings = sanitizeSettings(legacySettings.settings);

    db.insert(settings).values({
      id: 1,
      categoryId: importedSettings.categoryId ?? '',
      channelId: importedSettings.channelId ?? '',
      messageId: importedSettings.messageId ?? '',
      tagsJson: JSON.stringify(importedSettings.tags),
      adminRolesJson: JSON.stringify(importedSettings.adminRoles),
      supportRolesJson: JSON.stringify(importedSettings.supportRoles),
      autoCloseHours: importedSettings.autoCloseHours,
      userCanClose: importedSettings.userCanClose
    }).onConflictDoUpdate({
      target: settings.id,
      set: {
        categoryId: importedSettings.categoryId ?? '',
        channelId: importedSettings.channelId ?? '',
        messageId: importedSettings.messageId ?? '',
        tagsJson: JSON.stringify(importedSettings.tags),
        adminRolesJson: JSON.stringify(importedSettings.adminRoles),
        supportRolesJson: JSON.stringify(importedSettings.supportRoles),
        autoCloseHours: importedSettings.autoCloseHours,
        userCanClose: importedSettings.userCanClose
      }
    }).run();

    console.log(`Imported legacy settings from ${LEGACY_SETTINGS_PATH}`);
  }

  if (legacyTickets?.tickets?.length) {
    db.insert(tickets).values(legacyTickets.tickets.map(ticket => ({
      id: ticket.id,
      channelId: ticket.channelId,
      userId: ticket.userId,
      userName: ticket.userName,
      tag: ticket.tag,
      status: ticket.status,
      claimedBy: ticket.claimedBy ?? null,
      createdAt: ticket.createdAt,
      lastActivity: ticket.lastActivity,
      transcriptFilePath: ticket.transcript ?? null,
      embedMessageId: ticket.embedMessageId ?? null
    }))).onConflictDoNothing().run();

    console.log(`Imported ${legacyTickets.tickets.length} legacy tickets from ${LEGACY_TICKETS_PATH}`);
  }

  if (legacyTickets?.transcripts?.length) {
    db.insert(transcripts).values(legacyTickets.transcripts.map(transcript => ({
      ticketId: transcript.ticketId,
      channelId: transcript.channelId,
      userId: transcript.userId,
      createdAt: transcript.createdAt,
      messagesJson: JSON.stringify(transcript.messages)
    }))).onConflictDoNothing().run();

    console.log(`Imported ${legacyTickets.transcripts.length} legacy transcripts from ${LEGACY_TICKETS_PATH}`);
  }
}

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) {
    return;
  }

  runMigrations();
  await ensureDefaultSettingsRow();
  await importLegacyDataIfNeeded();
  initialized = true;
}

export { DEFAULT_SETTINGS };
