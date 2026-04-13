import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  categoryId: text('category_id').notNull().default(''),
  channelId: text('channel_id').notNull().default(''),
  messageId: text('message_id').notNull().default(''),
  tagsJson: text('tags_json').notNull().default('[]'),
  adminRolesJson: text('admin_roles_json').notNull().default('[]'),
  supportRolesJson: text('support_roles_json').notNull().default('[]'),
  autoCloseHours: integer('auto_close_hours').notNull().default(24),
  userCanClose: integer('user_can_close', { mode: 'boolean' }).notNull().default(true)
});

export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(),
  channelId: text('channel_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  tag: text('tag').notNull(),
  status: text('status').notNull(),
  claimedBy: text('claimed_by'),
  createdAt: integer('created_at').notNull(),
  lastActivity: integer('last_activity').notNull(),
  transcriptFilePath: text('transcript_file_path'),
  embedMessageId: text('embed_message_id')
}, table => ({
  channelIdUnique: uniqueIndex('tickets_channel_id_unique').on(table.channelId),
  userIdIdx: index('tickets_user_id_idx').on(table.userId),
  lastActivityIdx: index('tickets_last_activity_idx').on(table.lastActivity),
  statusIdx: index('tickets_status_idx').on(table.status)
}));

export const transcripts = sqliteTable('transcripts', {
  ticketId: text('ticket_id').primaryKey(),
  channelId: text('channel_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: integer('created_at').notNull(),
  messagesJson: text('messages_json').notNull()
});
