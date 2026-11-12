-- Consultas somente de leitura, exceto variavel da sessao. Mesmo email do .http.
SET @email = 'apresentacao-01@example.test';

-- 1. Identificar a conexao REAL.
SELECT DATABASE() AS banco, VERSION() AS versao_mysql, NOW() AS horario_banco;

-- 2. Usuario e bcrypt: nao exibir hash completo nem senha.
SELECT id_usuario, nome, email, tipo_usuario, status,
       LEFT(senha_hash, 7) AS prefixo_bcrypt, LENGTH(senha_hash) AS tamanho_hash
FROM tb_usuario WHERE email = @email;

-- 3. Reserva criada pela API: compare id_reserva e codigo com a resposta HTTP.
SELECT r.id_reserva, r.codigo_confirmacao, s.codigo AS status,
       r.checkin, r.checkout, r.valor_total, r.observacoes
FROM tb_reserva r
JOIN tb_usuario u ON u.id_usuario = r.id_usuario
JOIN tb_status_reserva s ON s.id_status_reserva = r.id_status_reserva
WHERE u.email = @email ORDER BY r.id_reserva DESC;

-- 4. Rascunho nao tem itens/cotacao: LEFT JOIN preserva a reserva sem itens.
SELECT r.id_reserva, COUNT(i.id_item_reserva) AS quantidade_itens
FROM tb_reserva r JOIN tb_usuario u ON u.id_usuario = r.id_usuario
LEFT JOIN tb_item_reserva i ON i.id_reserva = r.id_reserva
WHERE u.email = @email GROUP BY r.id_reserva ORDER BY r.id_reserva DESC;

-- 5. Historico de status persistido na transacao.
SELECT h.id_reserva, s.codigo, h.observacao, h.data_hora
FROM tb_reserva_status h
JOIN tb_reserva r ON r.id_reserva = h.id_reserva
JOIN tb_usuario u ON u.id_usuario = r.id_usuario
JOIN tb_status_reserva s ON s.id_status_reserva = h.id_status_reserva
WHERE u.email = @email ORDER BY h.data_hora DESC;

-- 6. Ocorrencia e decisao humana persistidas.
SELECT o.id_ocorrencia, o.tipo_alvo, o.status, o.analise,
       o.id_usuario_analista, o.data_analise
FROM tb_ocorrencia o JOIN tb_usuario u ON u.id_usuario = o.id_usuario
WHERE u.email = @email ORDER BY o.id_ocorrencia DESC;

-- 7. Eventos associados ao usuario (falhas anonimas nao possuem este vinculo).
SELECT l.id_log, l.acao, l.entidade, l.resultado, l.data_hora, l.detalhes
FROM tb_log l JOIN tb_usuario u ON u.id_usuario = l.id_usuario
WHERE u.email = @email ORDER BY l.id_log DESC LIMIT 20;

-- 8. Eventos recentes, incluindo falhas anonimas e revisao pelo ADMIN.
SELECT id_log, id_usuario, acao, resultado, data_hora FROM tb_log
ORDER BY id_log DESC LIMIT 20;

-- 9. Verificacao limitada a estas senhas ficticias; zero nao prova seguranca total.
SELECT COUNT(*) AS logs_com_senhas_da_demo FROM tb_log
WHERE CAST(detalhes AS CHAR) LIKE '%DemoLocal#2026!%'
   OR CAST(detalhes AS CHAR) LIKE '%SenhaErrada123%';
