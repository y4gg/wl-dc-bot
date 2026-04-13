ALTER TABLE `settings` ADD `max_open_tickets_per_user` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `banned_user_ids_json` text DEFAULT '[]' NOT NULL;