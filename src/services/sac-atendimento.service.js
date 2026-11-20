
'use strict';

const pool = require('../config/database');

async function registrarConversa(
  idUsuario,
  mensagemCliente,
  resultadoBot,
  idAtendimentoExistente = null
) {
  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();

    let idAtendimento;

    if (idAtendimentoExistente !== null) {
      // Bloqueia o registro enquanto verificamos a conversa
      const [atendimentos] = await conexao.execute(
        `SELECT id_atendimento
         FROM tb_atendimento
         WHERE id_atendimento = ?
           AND id_usuario = ?
           AND tipo = 'CHATBOT'
           AND status = 'ABERTO'
         FOR UPDATE`,
        [idAtendimentoExistente, idUsuario]
      );

      if (atendimentos.length === 0) {
        const erro = new Error(
          'Atendimento não encontrado ou indisponível.'
        );
        erro.status = 404;
        throw erro;
      }

      idAtendimento = idAtendimentoExistente;

    } else {
      // Primeira mensagem: cria um atendimento
      const [resultado] = await conexao.execute(
        `INSERT INTO tb_atendimento
         (id_usuario, tipo, assunto, status)
         VALUES (?, 'CHATBOT', ?, 'ABERTO')`,
        [idUsuario, resultadoBot.assunto || 'OUTROS']
      );

      idAtendimento = resultado.insertId;
    }

    // Registra a mensagem do cliente
    await conexao.execute(
      `INSERT INTO tb_mensagem
       (id_atendimento, id_status_mensagem, remetente,
        id_usuario_remetente, conteudo, origem)
       VALUES (?, 1, 'CLIENTE', ?, ?, 'WEB')`,
      [idAtendimento, idUsuario, mensagemCliente]
    );

    // Registra a resposta do chatbot
    await conexao.execute(
      `INSERT INTO tb_mensagem
       (id_atendimento, id_status_mensagem, remetente,
        id_usuario_remetente, conteudo, origem)
       VALUES (?, 1, 'BOT', NULL, ?, ?)`,
      [
        idAtendimento,
        resultadoBot.resposta,
        resultadoBot.modo === 'deepseek' ? 'DEEPSEEK' : 'SAC'
      ]
    );

    await conexao.commit();

    return idAtendimento;

  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}


async function buscarHistorico(idUsuario, idAtendimento) {
  // Verifica se o atendimento pertence ao usuário autenticado
  const [atendimentos] = await pool.execute(
    `SELECT id_atendimento, assunto, status, data_inicio
     FROM tb_atendimento
     WHERE id_atendimento = ?
       AND id_usuario = ?`,
    [idAtendimento, idUsuario]
  );

  if (atendimentos.length === 0) {
    return null;
  }

  // Busca todas as mensagens do atendimento
  const [mensagens] = await pool.execute(
    `SELECT id_mensagem, remetente, conteudo, origem, data_hora
     FROM tb_mensagem
     WHERE id_atendimento = ?
     ORDER BY data_hora ASC, id_mensagem ASC`,
    [idAtendimento]
  );

  return {
    atendimento: atendimentos[0],
    mensagens
  };
}

module.exports = { registrarConversa, buscarHistorico };
