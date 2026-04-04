-- ================================================================
--  Migration 001 — Índices compostos para performance
--  Aplicar na base de dados de produção uma única vez.
--
--  Estas queries usam IF NOT EXISTS equivalente via IGNORE
--  para que possam ser re-executadas em segurança.
-- ================================================================

SET NAMES utf8mb4;

-- ── news: query principal do dashboard (status + featured + date) ──
-- WHERE status='published' ORDER BY is_featured DESC, published_at DESC
ALTER TABLE `news`
  ADD KEY IF NOT EXISTS `idx_news_status_featured_date` (`status`, `is_featured`, `published_at`);

-- ── announcements: query principal do dashboard ───────────────────
-- WHERE is_active=1 AND (expires_at IS NULL OR expires_at > NOW())
ALTER TABLE `announcements`
  ADD KEY IF NOT EXISTS `idx_ann_active_expires` (`is_active`, `expires_at`);

-- ── announcements: visibilidade + empresa ────────────────────────
-- WHERE visibility='company' AND company_id = :cid
ALTER TABLE `announcements`
  ADD KEY IF NOT EXISTS `idx_ann_visibility_company` (`visibility`, `company_id`);

-- ── login_attempts: rate limiting (identifier + tempo) ───────────
-- WHERE identifier=:email AND attempted_at >= :window
ALTER TABLE `login_attempts`
  ADD KEY IF NOT EXISTS `idx_attempts_ident_time` (`identifier`, `attempted_at`);

-- ── login_attempts: rate limiting por IP ─────────────────────────
ALTER TABLE `login_attempts`
  ADD KEY IF NOT EXISTS `idx_attempts_ip_time` (`ip_address`, `attempted_at`);

-- ── activity_logs: feed por data (query mais frequente) ──────────
-- ORDER BY created_at DESC LIMIT :n
-- O índice simples idx_logs_date já existe; garantir que está presente
-- (schema.sql já tem KEY idx_logs_date — esta linha é defensiva)
ALTER TABLE `activity_logs`
  ADD KEY IF NOT EXISTS `idx_logs_date_id` (`created_at`, `id`);

-- ── password_resets: lookup token + email + não usado ────────────
ALTER TABLE `password_resets`
  ADD KEY IF NOT EXISTS `idx_resets_token_email` (`token`, `email`);

-- ── documents: listagem activa + confidencialidade ───────────────
ALTER TABLE `documents`
  ADD KEY IF NOT EXISTS `idx_docs_active_conf` (`is_active`, `is_confidential`);

-- ── gallery_items: álbum ordenado ────────────────────────────────
ALTER TABLE `gallery_items`
  ADD KEY IF NOT EXISTS `idx_items_album_order` (`album_id`, `sort_order`);
