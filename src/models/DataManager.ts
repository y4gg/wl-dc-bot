import { BotData, Ticket, TicketSettings } from '../types';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_PATH = join(__dirname, '../../data/tickets.json');

export class DataManager {
  private data: BotData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): BotData {
    try {
      const file = readFileSync(DATA_PATH, 'utf-8');
      return JSON.parse(file);
    } catch (error) {
      console.error('Failed to load data file:', error);
      return {
        settings: {
          tags: [],
          adminRoles: [],
          supportRoles: [],
          autoCloseHours: 24
        },
        tickets: [],
        transcripts: []
      };
    }
  }

  private saveData(): void {
    try {
      writeFileSync(DATA_PATH, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save data file:', error);
    }
  }

  getSettings(): TicketSettings {
    return this.data.settings;
  }

  updateSettings(settings: Partial<TicketSettings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData();
  }

  getTickets(): Ticket[] {
    return this.data.tickets;
  }

  getTicketById(ticketId: string): Ticket | undefined {
    return this.data.tickets.find(t => t.id === ticketId);
  }

  getTicketByChannelId(channelId: string): Ticket | undefined {
    return this.data.tickets.find(t => t.channelId === channelId);
  }

  getTicketsByUser(userId: string): Ticket[] {
    return this.data.tickets.filter(t => t.userId === userId);
  }

  createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'lastActivity'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: `ticket-${Date.now()}`,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    this.data.tickets.push(newTicket);
    this.saveData();
    return newTicket;
  }

  updateTicket(ticketId: string, updates: Partial<Ticket>): void {
    const index = this.data.tickets.findIndex(t => t.id === ticketId);
    if (index !== -1) {
      this.data.tickets[index] = { ...this.data.tickets[index], ...updates, lastActivity: Date.now() };
      this.saveData();
    }
  }

  updateTicketActivity(channelId: string): void {
    const ticket = this.getTicketByChannelId(channelId);
    if (ticket) {
      this.updateTicket(ticket.id, { lastActivity: Date.now() });
    }
  }

  deleteTicket(ticketId: string): void {
    this.data.tickets = this.data.tickets.filter(t => t.id !== ticketId);
    this.saveData();
  }

  getInactiveTickets(hours: number): Ticket[] {
    const threshold = Date.now() - (hours * 60 * 60 * 1000);
    return this.data.tickets.filter(t => 
      t.status === 'open' && t.lastActivity < threshold
    );
  }

  getTranscript(ticketId: string): any | undefined {
    return this.data.transcripts.find(t => t.ticketId === ticketId);
  }

  addTranscript(transcript: any): void {
    this.data.transcripts.push(transcript);
    this.saveData();
  }
}

export const dataManager = new DataManager();
