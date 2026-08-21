-- ==========================================================
-- Porn Gabar - Production MySQL Database Schema
-- Standard MySQL 8.0+ / MariaDB 10.5+
-- ==========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `avatar_url` VARCHAR(500) NULL,
  `bio` TEXT NULL,
  `role` ENUM('user', 'vip', 'admin') NOT NULL DEFAULT 'user',
  `is_suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `suspension_reason` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `icon_name` VARCHAR(50) NOT NULL DEFAULT 'Film',
  `color` VARCHAR(20) NOT NULL DEFAULT '#1769FF',
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cat_slug` (`slug`),
  INDEX `idx_cat_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Videos Table
CREATE TABLE IF NOT EXISTS `videos` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` VARCHAR(36) NOT NULL,
  `category_name` VARCHAR(100) NOT NULL,
  `video_url` VARCHAR(1000) NOT NULL,
  `thumbnail_url` VARCHAR(1000) NOT NULL,
  `duration` INT NOT NULL DEFAULT 0,
  `duration_formatted` VARCHAR(20) NOT NULL DEFAULT '00:00',
  `views` BIGINT NOT NULL DEFAULT 0,
  `likes` INT NOT NULL DEFAULT 0,
  `shares` INT NOT NULL DEFAULT 0,
  `is_premium` TINYINT(1) NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `is_age_restricted` TINYINT(1) NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `content_owner` VARCHAR(200) NOT NULL DEFAULT 'Porn Gabar Media Group',
  `license_info` VARCHAR(255) NOT NULL DEFAULT 'Creative Commons / Commercial Distribution License',
  `copyright_status` VARCHAR(100) NOT NULL DEFAULT 'Original & Licensed Content Verified',
  `published_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_videos_category` (`category_id`),
  INDEX `idx_videos_published` (`is_published`, `published_at`),
  INDEX `idx_videos_views` (`views`),
  INDEX `idx_videos_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Video Tags Table
CREATE TABLE IF NOT EXISTS `video_tags` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `video_id` VARCHAR(36) NOT NULL,
  `tag` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE,
  INDEX `idx_video_tag` (`tag`),
  INDEX `idx_video_id_tag` (`video_id`, `tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Favorites Table
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `video_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_user_video_fav` (`user_id`, `video_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE,
  INDEX `idx_fav_user` (`user_id`),
  INDEX `idx_fav_video` (`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Watch History Table
CREATE TABLE IF NOT EXISTS `watch_history` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `video_id` VARCHAR(36) NOT NULL,
  `progress_seconds` INT NOT NULL DEFAULT 0,
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `completion_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `last_watched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_user_video_history` (`user_id`, `video_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE,
  INDEX `idx_history_user_time` (`user_id`, `last_watched_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS `comments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `video_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_avatar` VARCHAR(500) NULL,
  `content` TEXT NOT NULL,
  `likes` INT NOT NULL DEFAULT 0,
  `is_moderated` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_comments_video` (`video_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Content Reports Table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `video_id` VARCHAR(36) NOT NULL,
  `video_title` VARCHAR(255) NULL,
  `reporter_user_id` VARCHAR(36) NULL,
  `reporter_email` VARCHAR(255) NULL,
  `reason` ENUM('copyright', 'illegal', 'spam', 'abuse', 'inappropriate', 'other') NOT NULL,
  `notes` TEXT NOT NULL,
  `status` ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  `action_taken` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE,
  INDEX `idx_reports_status` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'system',
  `link_url` VARCHAR(500) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Admin Users Table
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `role` ENUM('superadmin', 'admin', 'moderator') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `failed_login_attempts` INT NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Admin Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(36) NOT NULL,
  `admin_email` VARCHAR(255) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(36) NULL,
  `details` TEXT NOT NULL,
  `ip_hash` VARCHAR(64) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_time` (`timestamp`),
  INDEX `idx_audit_admin` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Advertisements Table
CREATE TABLE IF NOT EXISTS `advertisements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `ad_type` ENUM('banner', 'rich_text', 'sponsored_card') NOT NULL DEFAULT 'banner',
  `title` VARCHAR(255) NULL,
  `tagline` VARCHAR(255) NULL,
  `banner_image` VARCHAR(1000) NOT NULL,
  `target_url` VARCHAR(1000) NOT NULL,
  `placement` ENUM('top_banner', 'home_feed', 'video_detail', 'before_video', 'after_video', 'sidebar', 'bottom_banner') NOT NULL,
  `priority` INT NOT NULL DEFAULT 5,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `start_date` DATETIME NULL,
  `end_date` DATETIME NULL,
  `mobile_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `desktop_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `impressions` BIGINT NOT NULL DEFAULT 0,
  `clicks` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ads_placement_active` (`placement`, `is_active`, `priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Visitor Sessions Table
CREATE TABLE IF NOT EXISTS `visitor_sessions` (
  `session_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NULL,
  `ip_hash` VARCHAR(64) NOT NULL,
  `current_page` VARCHAR(255) NOT NULL,
  `device` ENUM('mobile', 'tablet', 'desktop') NOT NULL,
  `browser` VARCHAR(100) NOT NULL,
  `os` VARCHAR(100) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'United States',
  `city` VARCHAR(100) NOT NULL DEFAULT 'San Francisco',
  `referrer` VARCHAR(500) NULL,
  `traffic_source` ENUM('direct', 'organic_search', 'social_media', 'referral', 'advertisement', 'other') NOT NULL,
  `utm_source` VARCHAR(100) NULL,
  `utm_medium` VARCHAR(100) NULL,
  `utm_campaign` VARCHAR(100) NULL,
  `utm_term` VARCHAR(100) NULL,
  `utm_content` VARCHAR(100) NULL,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `page_views_count` INT NOT NULL DEFAULT 1,
  INDEX `idx_session_active` (`last_active_at`),
  INDEX `idx_session_source` (`traffic_source`),
  INDEX `idx_session_device` (`device`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Page Views Table
CREATE TABLE IF NOT EXISTS `page_views` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  `video_id` VARCHAR(36) NULL,
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `visitor_sessions`(`session_id`) ON DELETE CASCADE,
  INDEX `idx_pageview_time` (`timestamp`),
  INDEX `idx_pageview_path` (`path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Platform Settings
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `site_name` VARCHAR(100) NOT NULL DEFAULT 'Porn Gabar',
  `tagline` VARCHAR(255) NOT NULL DEFAULT 'Premium Video Experience',
  `contact_email` VARCHAR(255) NOT NULL DEFAULT 'support@bluewave.video',
  `enable_age_gate` TINYINT(1) NOT NULL DEFAULT 0,
  `allow_public_comments` TINYINT(1) NOT NULL DEFAULT 1,
  `default_video_quality` VARCHAR(20) NOT NULL DEFAULT '1080p',
  `ad_rotation_frequency` INT NOT NULL DEFAULT 3,
  `maintenance_mode` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
