CREATE TABLE `completed_missions` (
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `mission_id`)
);
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`last_mission` text NOT NULL,
	`updated_at` integer NOT NULL
);
