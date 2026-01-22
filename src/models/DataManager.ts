import { Ticket, TicketSettings, Form, FormQuestion } from '../types';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';

const SETTINGS_PATH = join(process.cwd(), 'settings.json');
const TICKETS_PATH = join(__dirname, '../../data/tickets.json');

export class DataManager {
  private settings: TicketSettings;
  private ticketsData: { tickets: Ticket[], transcripts: any[], forms: Form[] };

  constructor() {
    this.settings = this.loadSettings();
    this.ticketsData = this.loadTicketsData();
  }

  private loadSettings(): TicketSettings {
    const oldSettingsPath = join(__dirname, '../../data/settings.json');
    const defaultSettings: TicketSettings = {
      categoryId: '',
      channelId: '',
      messageId: '',
      tags: [],
      adminRoles: [],
      supportRoles: [],
      autoCloseHours: 24,
      userCanClose: true
    };

    try {
      if (!existsSync(SETTINGS_PATH)) {
        if (existsSync(oldSettingsPath)) {
          console.log('Migrating settings from data/settings.json to root settings.json');
          copyFileSync(oldSettingsPath, SETTINGS_PATH);
        } else {
          console.log('Creating new settings.json file with default values');
          writeFileSync(SETTINGS_PATH, JSON.stringify({ settings: defaultSettings }, null, 2));
        }
      }

      const file = readFileSync(SETTINGS_PATH, 'utf-8');
      const data = JSON.parse(file);
      return data.settings;
    } catch (error) {
      console.error('Failed to load settings file:', error);
      return defaultSettings;
    }
  }

  private loadTicketsData(): { tickets: Ticket[], transcripts: any[], forms: Form[] } {
    try {
      const file = readFileSync(TICKETS_PATH, 'utf-8');
      const data = JSON.parse(file);
      return {
        tickets: data.tickets || [],
        transcripts: data.transcripts || [],
        forms: data.forms || []
      };
    } catch (error) {
      console.error('Failed to load tickets file:', error);
      return {
        tickets: [],
        transcripts: [],
        forms: []
      };
    }
  }

  private saveSettings(): void {
    try {
      writeFileSync(SETTINGS_PATH, JSON.stringify({ settings: this.settings }, null, 2));
    } catch (error) {
      console.error('Failed to save settings file:', error);
    }
  }

  private saveTicketsData(): void {
    try {
      writeFileSync(TICKETS_PATH, JSON.stringify(this.ticketsData, null, 2));
    } catch (error) {
      console.error('Failed to save tickets file:', error);
    }
  }

  getSettings(): TicketSettings {
    return this.settings;
  }

  updateSettings(settings: Partial<TicketSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
  }

  getTickets(): Ticket[] {
    return this.ticketsData.tickets;
  }

  getTicketById(ticketId: string): Ticket | undefined {
    return this.ticketsData.tickets.find(t => t.id === ticketId);
  }

  getTicketByChannelId(channelId: string): Ticket | undefined {
    return this.ticketsData.tickets.find(t => t.channelId === channelId);
  }

  getTicketsByUser(userId: string): Ticket[] {
    return this.ticketsData.tickets.filter(t => t.userId === userId);
  }

  createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'lastActivity'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: `ticket-${Date.now()}`,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    this.ticketsData.tickets.push(newTicket);
    this.saveTicketsData();
    return newTicket;
  }

  updateTicket(ticketId: string, updates: Partial<Ticket>): void {
    const index = this.ticketsData.tickets.findIndex(t => t.id === ticketId);
    if (index !== -1) {
      this.ticketsData.tickets[index] = { ...this.ticketsData.tickets[index], ...updates, lastActivity: Date.now() };
      this.saveTicketsData();
    }
  }

  updateTicketActivity(channelId: string): void {
    const ticket = this.getTicketByChannelId(channelId);
    if (ticket) {
      this.updateTicket(ticket.id, { lastActivity: Date.now() });
    }
  }

  deleteTicket(ticketId: string): void {
    this.ticketsData.tickets = this.ticketsData.tickets.filter(t => t.id !== ticketId);
    this.saveTicketsData();
  }

  getInactiveTickets(hours: number): Ticket[] {
    const threshold = Date.now() - (hours * 60 * 60 * 1000);
    return this.ticketsData.tickets.filter(t => 
      t.status === 'open' && t.lastActivity < threshold
    );
  }

  getTranscript(ticketId: string): any | undefined {
    return this.ticketsData.transcripts.find(t => t.ticketId === ticketId);
  }

  addTranscript(transcript: any): void {
    this.ticketsData.transcripts.push(transcript);
    this.saveTicketsData();
  }

  getForms(): Form[] {
    return this.ticketsData.forms;
  }

  getFormById(formId: string): Form | undefined {
    return this.ticketsData.forms.find(f => f.id === formId);
  }

  getFormByMessageId(messageId: string): Form | undefined {
    return this.ticketsData.forms.find(f => f.messageId === messageId);
  }

  createForm(name: string, description: string, questions: string[], channelId: string, creatorId: string): Form {
    const parsedQuestions: FormQuestion[] = questions.map(q => ({
      label: q.trim(),
      type: q.length > 50 ? 'long' : 'short'
    }));

    const newForm: Form = {
      id: `form-${Date.now()}`,
      name,
      description,
      questions: parsedQuestions,
      channelId,
      creatorId,
      createdAt: Date.now(),
      submittedBy: []
    };

    this.ticketsData.forms.push(newForm);
    this.saveTicketsData();
    return newForm;
  }

  updateFormMessage(formId: string, messageId: string): void {
    const form = this.getFormById(formId);
    if (form) {
      form.messageId = messageId;
      this.saveTicketsData();
    }
  }

  hasUserSubmitted(formId: string, userId: string): boolean {
    const form = this.getFormById(formId);
    return form ? form.submittedBy.includes(userId) : false;
  }

  addFormSubmission(formId: string, userId: string): void {
    const form = this.getFormById(formId);
    if (form) {
      form.submittedBy.push(userId);
      this.saveTicketsData();
    }
  }

  deleteForm(formId: string): void {
    this.ticketsData.forms = this.ticketsData.forms.filter(f => f.id !== formId);
    this.saveTicketsData();
  }
}

export const dataManager = new DataManager();
