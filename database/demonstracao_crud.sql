-- DEMONSTRACAO DIRETA NO MYSQL LOCAL. Execute um bloco por vez, nao o arquivo inteiro.
-- Terminal do VS Code: npm run demo:mysql
-- Usamos um hotel ficticio sem reservas/quartos, sem alterar registros do roteiro HTTP.

-- 1. SELECT: identificar o banco e consultar os dados existentes.
SELECT DATABASE() AS banco, VERSION() AS versao, CONNECTION_ID() AS conexao;
SELECT id_hotel, nome, categoria, status FROM tb_hotel ORDER BY id_hotel DESC LIMIT 10;

-- 2. INSERT + COMMIT: criar um registro real e confirmar a transacao.
START TRANSACTION;
INSERT INTO tb_hotel (nome, descricao, categoria, classificacao, status)
VALUES ('Hotel Demo SQL Professor', 'DEMO_SQL_LOCAL_PROFESSOR', 'HOTEL', 3, 'ATIVO');
SET @demo_id = LAST_INSERT_ID();
COMMIT;
SELECT @demo_id AS ANOTE_ESTE_ID;
SELECT id_hotel, nome, descricao, classificacao, status FROM tb_hotel WHERE id_hotel = @demo_id;

-- 3. PERSISTENCIA: digite exit; no prompt mysql para fechar a conexao.
-- No PowerShell, execute novamente: npm run demo:mysql
-- ATENCAO: @demo_id e uma variavel de sessao, nao sobrevive a reconexao.
-- Substitua o ZERO abaixo pelo ID anotado no passo 2 antes de executar.
SET @demo_id = 0;
SELECT CONNECTION_ID() AS nova_conexao;
SELECT id_hotel, nome, descricao, classificacao, status FROM tb_hotel
WHERE id_hotel = @demo_id AND descricao = 'DEMO_SQL_LOCAL_PROFESSOR';
-- Deve aparecer o mesmo hotel em outra conexao: a linha foi persistida apos COMMIT.

-- 4. UPDATE: alterar somente o registro da demonstracao.
START TRANSACTION;
UPDATE tb_hotel SET nome = 'Hotel Demo SQL Atualizado', classificacao = 4
WHERE id_hotel = @demo_id AND descricao = 'DEMO_SQL_LOCAL_PROFESSOR';
SELECT ROW_COUNT() AS linhas_alteradas;
COMMIT;
SELECT id_hotel, nome, classificacao FROM tb_hotel WHERE id_hotel = @demo_id;

-- 5. ROLLBACK: mostrar uma exclusao desfeita antes de confirmar.
START TRANSACTION;
DELETE FROM tb_hotel WHERE id_hotel = @demo_id AND descricao = 'DEMO_SQL_LOCAL_PROFESSOR';
SELECT COUNT(*) AS dentro_da_transacao_deve_ser_zero FROM tb_hotel WHERE id_hotel = @demo_id;
ROLLBACK;
SELECT COUNT(*) AS apos_rollback_deve_ser_um FROM tb_hotel WHERE id_hotel = @demo_id;

-- 6. DELETE + COMMIT: excluir definitivamente apenas o hotel criado neste roteiro.
START TRANSACTION;
DELETE FROM tb_hotel WHERE id_hotel = @demo_id AND descricao = 'DEMO_SQL_LOCAL_PROFESSOR';
SELECT ROW_COUNT() AS linhas_excluidas;
COMMIT;
SELECT COUNT(*) AS apos_commit_deve_ser_zero FROM tb_hotel WHERE id_hotel = @demo_id;
-- Opcional: reconecte novamente, redefina @demo_id e repita o COUNT para confirmar.
-- Nunca remova o WHERE. Se uma FK impedir a exclusao, use ROLLBACK e confira os vinculos.
