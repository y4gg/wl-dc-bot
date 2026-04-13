import { and, eq, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { initializeDatabase, DEFAULT_SETTINGS } from '../db/bootstrap';
import { settings, tickets, transcripts } from '../db/schema';
import { Ticket, TicketSettings, Transcript, Message } from '../types';

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

function parseMessages(value: string): Message[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is Message => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const candidate = item as Record<string, unknown>;
      return typeof candidate.author === 'string'
        && typeof candidate.authorId === 'string'
        && typeof candidate.content === 'string'
        && typeof candidate.timestamp === 'number'
        && typeof candidate.isBot === 'boolean';
    });
  } catch {
    return [];
  }
}

function mapSettingsRow(row: typeof settings.$inferSelect | undefined): TicketSettings {
  if (!row) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    categoryId: row.categoryId,
    channelId: row.channelId,
    messageId: row.messageId,
    tags: parseStringArray(row.tagsJson),
    adminRoles: parseStringArray(row.adminRolesJson),
    supportRoles: parseStringArray(row.supportRolesJson),
    autoCloseHours: row.autoCloseHours,
    userCanClose: row.userCanClose
  };
}

function mapTicketRow(row: typeof tickets.$inferSelect): Ticket {
  return {
    id: row.id,
    channelId: row.channelId,
    userId: row.userId,
    userName: row.userName,
    tag: row.tag,
    status: row.status as Ticket['status'],
    claimedBy: row.claimedBy ?? undefined,
    createdAt: row.createdAt,
    lastActivity: row.lastActivity,
    transcript: row.transcriptFilePath ?? undefined,
    embedMessageId: row.embedMessageId ?? undefined
  };
}

function mapTranscriptRow(row: typeof transcripts.$inferSelect): Transcript {
  return {
    ticketId: row.ticketId,
    channelId: row.channelId,
    userId: row.userId,
    createdAt: row.createdAt,
    messages: parseMessages(row.messagesJson)
  };
}

export class DataManager {
  async init(): Promise<void> {
    await initializeDatabase();
  }

  async getSettings(): Promise<TicketSettings> {
    const row = db.select().from(settings).where(eq(settings.id, 1)).get();
    return mapSettingsRow(row);
  }

  async updateSettings(nextSettings: Partial<TicketSettings>): Promise<void> {
    const current = await this.getSettings();
    const merged: TicketSettings = { ...current, ...nextSettings };

    db.insert(settings).values({
      id: 1,
      categoryId: merged.categoryId ?? '',
      channelId: merged.channelId ?? '',
      messageId: merged.messageId ?? '',
      tagsJson: JSON.stringify(merged.tags),
      adminRolesJson: JSON.stringify(merged.adminRoles),
      supportRolesJson: JSON.stringify(merged.supportRoles),
      autoCloseHours: merged.autoCloseHours,
      userCanClose: merged.userCanClose
    }).onConflictDoUpdate({
      target: settings.id,
      set: {
        categoryId: merged.categoryId ?? '',
        channelId: merged.channelId ?? '',
        messageId: merged.messageId ?? '',
        tagsJson: JSON.stringify(merged.tags),
        adminRolesJson: JSON.stringify(merged.adminRoles),
        supportRolesJson: JSON.stringify(merged.supportRoles),
        autoCloseHours: merged.autoCloseHours,
        userCanClose: merged.userCanClose
      }
    }).run();
  }

  async getTickets(): Promise<Ticket[]> {
    const rows = db.select().from(tickets).all();
    return rows.map(mapTicketRow);
  }

  async getTicketById(ticketId: string): Promise<Ticket | undefined> {
    const row = db.select().from(tickets).where(eq(tickets.id, ticketId)).get();
    return row ? mapTicketRow(row) : undefined;
  }

  async getTicketByChannelId(channelId: string): Promise<Ticket | undefined> {
    const row = db.select().from(tickets).where(eq(tickets.channelId, channelId)).get();
    return row ? mapTicketRow(row) : undefined;
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    const rows = db.select().from(tickets).where(eq(tickets.userId, userId)).all();
    return rows.map(mapTicketRow);
  }

  async createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'lastActivity'>): Promise<Ticket> {
    const now = Date.now();
    const newTicket: Ticket = {
      ...ticket,
      id: `ticket-${now}`,
      createdAt: now,
      lastActivity: now
    };

    db.insert(tickets).values({
      id: newTicket.id,
      channelId: newTicket.channelId,
      userId: newTicket.userId,
      userName: newTicket.userName,
      tag: newTicket.tag,
      status: newTicket.status,
      claimedBy: newTicket.claimedBy ?? null,
      createdAt: newTicket.createdAt,
      lastActivity: newTicket.lastActivity,
      transcriptFilePath: newTicket.transcript ?? null,
      embedMessageId: newTicket.embedMessageId ?? null
    }).run();

    return newTicket;
  }

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<void> {
    const updateValues: Partial<typeof tickets.$inferInsert> = {
      lastActivity: Date.now()
    };

    if (updates.channelId !== undefined) updateValues.channelId = updates.channelId;
    if (updates.userId !== undefined) updateValues.userId = updates.userId;
    if (updates.userName !== undefined) updateValues.userName = updates.userName;
    if (updates.tag !== undefined) updateValues.tag = updates.tag;
    if (updates.status !== undefined) updateValues.status = updates.status;
    if (updates.claimedBy !== undefined) updateValues.claimedBy = updates.claimedBy;
    if (updates.createdAt !== undefined) updateValues.createdAt = updates.createdAt;
    if (updates.lastActivity !== undefined) updateValues.lastActivity = updates.lastActivity;
    if (updates.transcript !== undefined) updateValues.transcriptFilePath = updates.transcript;
    if (updates.embedMessageId !== undefined) updateValues.embedMessageId = updates.embedMessageId;

    db.update(tickets).set(updateValues).where(eq(tickets.id, ticketId)).run();
  }

  async updateTicketActivity(channelId: string): Promise<void> {
    db.update(tickets)
      .set({ lastActivity: Date.now() })
      .where(eq(tickets.channelId, channelId))
      .run();
  }

  async deleteTicket(ticketId: string): Promise<void> {
    db.delete(tickets).where(eq(tickets.id, ticketId)).run();
  }

  async getInactiveTickets(hours: number): Promise<Ticket[]> {
    const threshold = Date.now() - (hours * 60 * 60 * 1000);
    const rows = db.select()
      .from(tickets)
      .where(and(eq(tickets.status, 'open'), lt(tickets.lastActivity, threshold)))
      .all();

    return rows.map(mapTicketRow);
  }

  async getTranscript(ticketId: string): Promise<Transcript | undefined> {
    const row = db.select().from(transcripts).where(eq(transcripts.ticketId, ticketId)).get();
    return row ? mapTranscriptRow(row) : undefined;
  }

  async addTranscript(transcript: Transcript): Promise<void> {
    db.insert(transcripts).values({
      ticketId: transcript.ticketId,
      channelId: transcript.channelId,
      userId: transcript.userId,
      createdAt: transcript.createdAt,
      messagesJson: JSON.stringify(transcript.messages)
    }).onConflictDoUpdate({
      target: transcripts.ticketId,
      set: {
        channelId: transcript.channelId,
        userId: transcript.userId,
        createdAt: transcript.createdAt,
        messagesJson: JSON.stringify(transcript.messages)
      }
    }).run();
  }
}

export const dataManager = new DataManager();
