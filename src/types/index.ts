export interface Ticket {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  tag: string;
  status: 'open' | 'closed' | 'claimed';
  claimedBy?: string;
  createdAt: number;
  lastActivity: number;
  transcript?: string;
  embedMessageId?: string;
}

export interface TicketSettings {
  categoryId?: string;
  channelId?: string;
  messageId?: string;
  tags: string[];
  adminRoles: string[];
  supportRoles: string[];
  autoCloseHours: number;
  userCanClose: boolean;
  formChannelId?: string;
}

export interface BotData {
  settings: TicketSettings;
  tickets: Ticket[];
  transcripts: Transcript[];
  forms: Form[];
}

export interface Transcript {
  ticketId: string;
  channelId: string;
  userId: string;
  createdAt: number;
  messages: Message[];
}

export interface Message {
  author: string;
  authorId: string;
  content: string;
  timestamp: number;
  isBot: boolean;
}

export interface ButtonInteraction {
  customId: string;
  userId: string;
  guildId?: string;
}

export interface CommandOptions {
  [key: string]: any;
}

export interface FormQuestion {
  label: string;
  type: 'short' | 'long';
}

export interface Form {
  id: string;
  name: string;
  description: string;
  questions: FormQuestion[];
  channelId: string;
  messageId?: string;
  creatorId: string;
  createdAt: number;
  submittedBy: string[];
}

export interface FormSubmission {
  formId: string;
  formName: string;
  userId: string;
  userName: string;
  responses: Record<string, string>;
  submittedAt: number;
}
