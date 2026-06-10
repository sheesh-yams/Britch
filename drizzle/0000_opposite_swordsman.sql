CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`idToken` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `addOn` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`description` text,
	`priceCents` integer DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `analyticsSnapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`socialAccountId` text NOT NULL,
	`accountId` text NOT NULL,
	`followers` integer NOT NULL,
	`engagementRateBps` integer NOT NULL,
	`avgViews` integer NOT NULL,
	`audience` text DEFAULT '{}' NOT NULL,
	`source` text NOT NULL,
	`capturedAt` integer NOT NULL,
	FOREIGN KEY (`socialAccountId`) REFERENCES `socialAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `brand` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`name` text NOT NULL,
	`contactName` text,
	`contactEmail` text,
	`logoKey` text,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bundle` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`name` text NOT NULL,
	`deliverableIds` text DEFAULT '[]' NOT NULL,
	`discountBps` integer DEFAULT 0 NOT NULL,
	`computedCents` integer DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cpmBenchmark` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`nicheId` text,
	`followerTier` text NOT NULL,
	`cpmCents` integer NOT NULL,
	`source` text,
	`effectiveDate` integer NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`nicheId`) REFERENCES `niche`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cpmBenchmark_platform_niche_tier_unique` ON `cpmBenchmark` (`platform`,`nicheId`,`followerTier`);--> statement-breakpoint
CREATE TABLE `creatorAccount` (
	`id` text PRIMARY KEY NOT NULL,
	`ownerUserId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`ownerUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creatorAccount_ownerUserId_unique` ON `creatorAccount` (`ownerUserId`);--> statement-breakpoint
CREATE TABLE `creatorProfile` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`displayName` text NOT NULL,
	`bio` text,
	`avatarKey` text,
	`niches` text DEFAULT '[]' NOT NULL,
	`availabilityStatus` text DEFAULT 'AVAILABLE' NOT NULL,
	`branding` text DEFAULT '{}' NOT NULL,
	`location` text,
	`website` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creatorProfile_accountId_unique` ON `creatorProfile` (`accountId`);--> statement-breakpoint
CREATE TABLE `deliverable` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`platform` text NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`description` text,
	`isActive` integer DEFAULT true NOT NULL,
	`reachUsed` integer DEFAULT 0 NOT NULL,
	`suggestedRateCents` integer DEFAULT 0 NOT NULL,
	`finalRateCents` integer DEFAULT 0 NOT NULL,
	`floorCents` integer DEFAULT 0 NOT NULL,
	`stretchCents` integer DEFAULT 0 NOT NULL,
	`breakdown` text DEFAULT '{}' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deliverable_account_platform_type_unique` ON `deliverable` (`accountId`,`platform`,`type`);--> statement-breakpoint
CREATE TABLE `engineParams` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`label` text,
	`reachWeightBps` integer DEFAULT 8500 NOT NULL,
	`followerWeightBps` integer DEFAULT 1500 NOT NULL,
	`benchmarkEngagementBps` integer DEFAULT 300 NOT NULL,
	`engAdjMinBps` integer DEFAULT 7000 NOT NULL,
	`engAdjMaxBps` integer DEFAULT 13000 NOT NULL,
	`roundingCents` integer DEFAULT 5000 NOT NULL,
	`floorSpreadBps` integer DEFAULT 2000 NOT NULL,
	`stretchSpreadBps` integer DEFAULT 2000 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `formatMultiplier` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`deliverableType` text NOT NULL,
	`multiplierBps` integer NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `formatMultiplier_platform_type_unique` ON `formatMultiplier` (`platform`,`deliverableType`);--> statement-breakpoint
CREATE TABLE `niche` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `niche_slug_unique` ON `niche` (`slug`);--> statement-breakpoint
CREATE TABLE `postSample` (
	`id` text PRIMARY KEY NOT NULL,
	`socialAccountId` text NOT NULL,
	`accountId` text NOT NULL,
	`platform` text NOT NULL,
	`url` text,
	`views` integer NOT NULL,
	`isPaid` integer DEFAULT false NOT NULL,
	`postedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`socialAccountId`) REFERENCES `socialAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pricingModelVersion` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`paramsSnapshot` text NOT NULL,
	`benchmarkSnapshot` text NOT NULL,
	`publishedAt` integer NOT NULL,
	`publishedBy` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proposal` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`brandId` text NOT NULL,
	`token` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`title` text,
	`lineItems` text DEFAULT '[]' NOT NULL,
	`milestones` text DEFAULT '[]' NOT NULL,
	`totalCents` integer DEFAULT 0 NOT NULL,
	`signatureName` text,
	`signatureIp` text,
	`approvedAt` integer,
	`approvedTotalCents` integer,
	`expiresAt` integer,
	`notes` text,
	`sentAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brandId`) REFERENCES `brand`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposal_token_unique` ON `proposal` (`token`);--> statement-breakpoint
CREATE TABLE `proposalView` (
	`id` text PRIMARY KEY NOT NULL,
	`proposalId` text NOT NULL,
	`accountId` text NOT NULL,
	`ip` text,
	`userAgent` text,
	`viewedAt` integer NOT NULL,
	FOREIGN KEY (`proposalId`) REFERENCES `proposal`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proposalWorkItem` (
	`id` text PRIMARY KEY NOT NULL,
	`proposalId` text NOT NULL,
	`workItemId` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`proposalId`) REFERENCES `proposal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workItemId`) REFERENCES `workItem`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposalWorkItem_proposal_workItem_unique` ON `proposalWorkItem` (`proposalId`,`workItemId`);--> statement-breakpoint
CREATE TABLE `providerConfig` (
	`id` text PRIMARY KEY NOT NULL,
	`activeAnalyticsProvider` text DEFAULT 'SEEDED' NOT NULL,
	`oembedTokens` text DEFAULT '{}' NOT NULL,
	`updatedAt` integer NOT NULL,
	`updatedBy` text
);
--> statement-breakpoint
CREATE TABLE `ratePage` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`theme` text DEFAULT '{}' NOT NULL,
	`preparedForBrandId` text,
	`frozenRates` text DEFAULT '{}' NOT NULL,
	`publishedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`preparedForBrandId`) REFERENCES `brand`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ratePage_token_unique` ON `ratePage` (`token`);--> statement-breakpoint
CREATE TABLE `ratePageView` (
	`id` text PRIMARY KEY NOT NULL,
	`ratePageId` text NOT NULL,
	`accountId` text NOT NULL,
	`ip` text,
	`userAgent` text,
	`referrer` text,
	`viewedAt` integer NOT NULL,
	FOREIGN KEY (`ratePageId`) REFERENCES `ratePage`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `seedCreator` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`platform` text NOT NULL,
	`displayName` text NOT NULL,
	`snapshot` text NOT NULL,
	`postSample` text DEFAULT '[]' NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seedCreator_handle_platform_unique` ON `seedCreator` (`handle`,`platform`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `socialAccount` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`platform` text NOT NULL,
	`handle` text NOT NULL,
	`followers` integer DEFAULT 0 NOT NULL,
	`engagementRateBps` integer DEFAULT 0 NOT NULL,
	`avgViews` integer DEFAULT 0 NOT NULL,
	`audience` text DEFAULT '{}' NOT NULL,
	`source` text DEFAULT 'SELF_REPORTED' NOT NULL,
	`consentGrantedAt` integer,
	`disconnectedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `socialAccount_account_platform_unique` ON `socialAccount` (`accountId`,`platform`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workItem` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`platform` text NOT NULL,
	`sourceUrl` text NOT NULL,
	`embedHtml` text,
	`thumbnailKey` text,
	`caption` text,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `creatorAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
