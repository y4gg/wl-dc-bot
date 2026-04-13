CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`category_id` text DEFAULT '' NOT NULL,
	`channel_id` text DEFAULT '' NOT NULL,
	`message_id` text DEFAULT '' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`admin_roles_json` text DEFAULT '[]' NOT NULL,
	`support_roles_json` text DEFAULT '[]' NOT NULL,
	`auto_close_hours` integer DEFAULT 24 NOT NULL,
	`user_can_close` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`tag` text NOT NULL,
	`status` text NOT NULL,
	`claimed_by` text,
	`created_at` integer NOT NULL,
	`last_activity` integer NOT NULL,
	`transcript_file_path` text,
	`embed_message_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_channel_id_unique` ON `tickets` (`channel_id`);--> statement-breakpoint
CREATE INDEX `tickets_user_id_idx` ON `tickets` (`user_id`);--> statement-breakpoint
CREATE INDEX `tickets_last_activity_idx` ON `tickets` (`last_activity`);--> statement-breakpoint
CREATE INDEX `tickets_status_idx` ON `tickets` (`status`);--> statement-breakpoint
CREATE TABLE `transcripts` (
	`ticket_id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`messages_json` text NOT NULL
);
