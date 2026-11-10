-- Apenas para bancos existentes criados antes de token_version.
-- Para aplicar de forma idempotente, execute npm run db:migrate.
ALTER TABLE tb_usuario ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER senha_hash;
