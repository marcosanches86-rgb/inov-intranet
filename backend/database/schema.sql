-- ================================================================
--  INOV INTRANET — Database Schema
--  Engine:  InnoDB
--  Charset: utf8mb4 / utf8mb4_unicode_ci
--
--  Tables:
--    01. companies
--    02. users
--    03. news
--    04. announcements
--    05. documents
--    06. brand_assets
--    07. gallery_albums
--    08. gallery_items
--    09. activity_logs
--    10. password_resets
--    11. login_attempts
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- ================================================================
-- 01. COMPANIES
-- ================================================================
CREATE TABLE IF NOT EXISTS `companies` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `slug`            VARCHAR(120)    NOT NULL,
  `name`            VARCHAR(200)    NOT NULL,
  `short_name`      VARCHAR(50)     NOT NULL,
  `tagline`         VARCHAR(350)    DEFAULT NULL,
  `description`     TEXT            DEFAULT NULL,
  `sector`          VARCHAR(200)    DEFAULT NULL,
  `founded_year`    YEAR            DEFAULT NULL,
  `location`        VARCHAR(200)    DEFAULT NULL,
  `employees`       VARCHAR(50)     DEFAULT NULL,
  `color`           VARCHAR(7)      NOT NULL DEFAULT '#111827',
  `accent_color`    VARCHAR(7)      NOT NULL DEFAULT '#C9A24C',
  `cover_gradient`  TEXT            DEFAULT NULL,
  `logo_path`       VARCHAR(500)    DEFAULT NULL,
  `cover_path`      VARCHAR(500)    DEFAULT NULL,
  `email`           VARCHAR(200)    DEFAULT NULL,
  `phone`           VARCHAR(50)     DEFAULT NULL,
  `website`         VARCHAR(300)    DEFAULT NULL,
  `services`        JSON            DEFAULT NULL,
  `values_list`     JSON            DEFAULT NULL,
  `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
  `sort_order`      SMALLINT        NOT NULL DEFAULT 0,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_companies_slug`   (`slug`),
  KEY        `idx_companies_active` (`is_active`),
  KEY        `idx_companies_sort`   (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='INOV group companies';


-- ================================================================
-- 02. USERS
-- ================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`                VARCHAR(200)    NOT NULL,
  `email`               VARCHAR(200)    NOT NULL,
  `password`            VARCHAR(255)    NOT NULL,
  `avatar`              VARCHAR(10)     DEFAULT NULL   COMMENT 'Initials, e.g. MS',
  `avatar_path`         VARCHAR(500)    DEFAULT NULL   COMMENT 'Path to profile photo',
  `role`                ENUM('colaborador','editor','admin','super_admin')
                                        NOT NULL DEFAULT 'colaborador',
  `status`              ENUM('active','inactive','pending')
                                        NOT NULL DEFAULT 'pending',
  `company_id`          INT UNSIGNED    DEFAULT NULL,
  `department`          VARCHAR(200)    DEFAULT NULL,
  `job_title`           VARCHAR(200)    DEFAULT NULL,
  `phone`               VARCHAR(50)     DEFAULT NULL,
  `bio`                 TEXT            DEFAULT NULL,
  `last_login_at`       DATETIME        DEFAULT NULL,
  `email_verified_at`   DATETIME        DEFAULT NULL,
  `joined_date`         DATE            DEFAULT NULL,
  `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email`     (`email`),
  KEY        `idx_users_role`     (`role`),
  KEY        `idx_users_status`   (`status`),
  KEY        `idx_users_company`  (`company_id`),

  CONSTRAINT `fk_users_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Platform users (all roles)';


-- ================================================================
-- 03. NEWS
-- ================================================================
CREATE TABLE IF NOT EXISTS `news` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `slug`          VARCHAR(400)    NOT NULL,
  `company_id`    INT UNSIGNED    NOT NULL,
  `author_id`     INT UNSIGNED    DEFAULT NULL,
  `category`      VARCHAR(100)    DEFAULT NULL,
  `title`         VARCHAR(600)    NOT NULL,
  `summary`       TEXT            DEFAULT NULL,
  `body`          LONGTEXT        DEFAULT NULL,
  `cover_path`    VARCHAR(500)    DEFAULT NULL,
  `status`        ENUM('draft','published')
                                  NOT NULL DEFAULT 'draft',
  `is_featured`   TINYINT(1)      NOT NULL DEFAULT 0,
  `read_time`     VARCHAR(20)     DEFAULT NULL   COMMENT 'e.g. 4 min',
  `views`         INT UNSIGNED    NOT NULL DEFAULT 0,
  `published_at`  DATETIME        DEFAULT NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_news_slug`       (`slug`),
  KEY        `idx_news_company`   (`company_id`),
  KEY        `idx_news_author`    (`author_id`),
  KEY        `idx_news_status`    (`status`),
  KEY        `idx_news_featured`  (`is_featured`),
  KEY        `idx_news_published` (`published_at`),
  FULLTEXT   `ft_news_search`     (`title`, `summary`),

  CONSTRAINT `fk_news_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_news_author`
    FOREIGN KEY (`author_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='News articles (draft / published)';


-- ================================================================
-- 04. ANNOUNCEMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS `announcements` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `company_id`   INT UNSIGNED    DEFAULT NULL   COMMENT 'NULL = global, applies to all',
  `author_id`    INT UNSIGNED    DEFAULT NULL,
  `title`        VARCHAR(500)    NOT NULL,
  `body`         LONGTEXT        NOT NULL,
  `priority`     ENUM('low','medium','high')
                                 NOT NULL DEFAULT 'medium',
  `visibility`   ENUM('global','company')
                                 NOT NULL DEFAULT 'global',
  `is_pinned`    TINYINT(1)      NOT NULL DEFAULT 0,
  `is_active`    TINYINT(1)      NOT NULL DEFAULT 1,
  `expires_at`   DATETIME        DEFAULT NULL,
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_ann_company`    (`company_id`),
  KEY `idx_ann_priority`   (`priority`),
  KEY `idx_ann_active`     (`is_active`),
  KEY `idx_ann_visibility` (`visibility`),
  KEY `idx_ann_pinned`     (`is_pinned`),

  CONSTRAINT `fk_ann_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ann_author`
    FOREIGN KEY (`author_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Internal announcements / communications';


-- ================================================================
-- 05. DOCUMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS `documents` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `company_id`      INT UNSIGNED    NOT NULL,
  `uploaded_by`     INT UNSIGNED    DEFAULT NULL,
  `title`           VARCHAR(500)    NOT NULL,
  `description`     TEXT            DEFAULT NULL,
  `category`        VARCHAR(100)    DEFAULT NULL,
  `file_path`       VARCHAR(500)    NOT NULL   COMMENT 'Relative path under /storage/uploads/',
  `original_name`   VARCHAR(300)    NOT NULL,
  `file_type`       VARCHAR(20)     DEFAULT NULL  COMMENT 'pdf, doc, xls, ppt, zip...',
  `file_size`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `file_size_human` VARCHAR(20)     DEFAULT NULL,
  `download_count`  INT UNSIGNED    NOT NULL DEFAULT 0,
  `is_confidential` TINYINT(1)      NOT NULL DEFAULT 0,
  `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_docs_company`       (`company_id`),
  KEY `idx_docs_category`      (`category`),
  KEY `idx_docs_confidential`  (`is_confidential`),
  KEY `idx_docs_active`        (`is_active`),
  FULLTEXT `ft_docs_search`    (`title`, `description`),

  CONSTRAINT `fk_docs_company`
    FOREIGN KEY (`company_id`)  REFERENCES `companies`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_docs_uploader`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Document library (PDFs, Word, Excel, etc.)';


-- ================================================================
-- 06. BRAND ASSETS
-- ================================================================
CREATE TABLE IF NOT EXISTS `brand_assets` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `company_id`    INT UNSIGNED    NOT NULL,
  `uploaded_by`   INT UNSIGNED    DEFAULT NULL,
  `name`          VARCHAR(300)    NOT NULL,
  `asset_type`    VARCHAR(100)    DEFAULT NULL  COMMENT 'logo-primary, logo-white, icon, guideline...',
  `format`        VARCHAR(100)    DEFAULT NULL  COMMENT 'SVG + PNG, PDF, AI...',
  `version`       VARCHAR(20)     DEFAULT NULL  COMMENT 'v2.0',
  `file_path`     VARCHAR(500)    NOT NULL,
  `original_name` VARCHAR(300)    DEFAULT NULL,
  `file_size`     INT UNSIGNED    NOT NULL DEFAULT 0,
  `color`         VARCHAR(7)      DEFAULT NULL  COMMENT 'Foreground hex',
  `color_bg`      VARCHAR(7)      DEFAULT NULL  COMMENT 'Background hex',
  `initials`      VARCHAR(10)     DEFAULT NULL,
  `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
  `sort_order`    SMALLINT        NOT NULL DEFAULT 0,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_brands_company`  (`company_id`),
  KEY `idx_brands_active`   (`is_active`),

  CONSTRAINT `fk_brands_company`
    FOREIGN KEY (`company_id`)  REFERENCES `companies`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_brands_uploader`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Brand identity assets (logos, guidelines)';


-- ================================================================
-- 07. GALLERY ALBUMS
-- ================================================================
CREATE TABLE IF NOT EXISTS `gallery_albums` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `company_id`  INT UNSIGNED    NOT NULL,
  `created_by`  INT UNSIGNED    DEFAULT NULL,
  `title`       VARCHAR(300)    NOT NULL,
  `slug`        VARCHAR(350)    NOT NULL,
  `description` TEXT            DEFAULT NULL,
  `category`    VARCHAR(100)    DEFAULT NULL  COMMENT 'Evento, Stand, Campanha...',
  `cover_path`  VARCHAR(500)    DEFAULT NULL,
  `cover_color` VARCHAR(7)      NOT NULL DEFAULT '#111827',
  `item_count`  INT UNSIGNED    NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
  `sort_order`  SMALLINT        NOT NULL DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gallery_slug`       (`slug`),
  KEY        `idx_gallery_company`   (`company_id`),
  KEY        `idx_gallery_active`    (`is_active`),

  CONSTRAINT `fk_gallery_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_gallery_creator`
    FOREIGN KEY (`created_by`)  REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Photo / portfolio albums';


-- ================================================================
-- 08. GALLERY ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS `gallery_items` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `album_id`      INT UNSIGNED    NOT NULL,
  `uploaded_by`   INT UNSIGNED    DEFAULT NULL,
  `title`         VARCHAR(300)    DEFAULT NULL,
  `description`   TEXT            DEFAULT NULL,
  `file_path`     VARCHAR(500)    NOT NULL,
  `original_name` VARCHAR(300)    DEFAULT NULL,
  `file_size`     INT UNSIGNED    NOT NULL DEFAULT 0,
  `width`         SMALLINT UNSIGNED DEFAULT NULL,
  `height`        SMALLINT UNSIGNED DEFAULT NULL,
  `sort_order`    SMALLINT        NOT NULL DEFAULT 0,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_items_album`  (`album_id`),
  KEY `idx_items_order`  (`sort_order`),

  CONSTRAINT `fk_items_album`
    FOREIGN KEY (`album_id`)    REFERENCES `gallery_albums`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_items_uploader`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Individual images within gallery albums';


-- ================================================================
-- 09. ACTIVITY LOGS
-- ================================================================
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED    DEFAULT NULL,
  `user_name`   VARCHAR(200)    DEFAULT NULL  COMMENT 'Denormalised for history',
  `action`      VARCHAR(100)    NOT NULL      COMMENT 'login, create_news, delete_doc...',
  `entity_type` VARCHAR(100)    DEFAULT NULL  COMMENT 'news, user, document...',
  `entity_id`   INT UNSIGNED    DEFAULT NULL,
  `entity_name` VARCHAR(400)    DEFAULT NULL  COMMENT 'Denormalised label',
  `details`     JSON            DEFAULT NULL  COMMENT 'Extra context (changes, before/after)',
  `ip_address`  VARCHAR(45)     DEFAULT NULL,
  `user_agent`  VARCHAR(600)    DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_logs_user`   (`user_id`),
  KEY `idx_logs_action` (`action`),
  KEY `idx_logs_entity` (`entity_type`, `entity_id`),
  KEY `idx_logs_date`   (`created_at`),

  CONSTRAINT `fk_logs_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail — all critical platform events';


-- ================================================================
-- 10. PASSWORD RESETS
-- ================================================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(200)    NOT NULL,
  `token`      VARCHAR(64)     NOT NULL  COMMENT 'SHA-256 hash of the raw token',
  `expires_at` DATETIME        NOT NULL,
  `used_at`    DATETIME        DEFAULT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_resets_email`   (`email`),
  KEY `idx_resets_token`   (`token`),
  KEY `idx_resets_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Password reset token registry';


-- ================================================================
-- 11. LOGIN ATTEMPTS  (rate limiting)
-- ================================================================
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id`           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `identifier`   VARCHAR(200)    NOT NULL  COMMENT 'Email or IP address',
  `ip_address`   VARCHAR(45)     NOT NULL,
  `success`      TINYINT(1)      NOT NULL DEFAULT 0,
  `attempted_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_attempts_identifier` (`identifier`),
  KEY `idx_attempts_ip`         (`ip_address`),
  KEY `idx_attempts_time`       (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Login attempt log for rate limiting';


SET FOREIGN_KEY_CHECKS = 1;
