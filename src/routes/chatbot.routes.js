
'use strict';

const express = require('express');
const { enviarMensagem } = require('../services/deepseek.service');
const { buscarHoteis } = require('../services/chatbot-database.service');
const { responderFAQ } = require('../services/sac-faq.service');
const { requireAuth } = require('../middlewares/auth');
const {
  registrarConversa,
  buscarHistorico
} = require('../services/sac-atendimento.service');

const router = express.Router();

// Atendimento automático do SAC
router.post('/mensagem', requireAuth, async (req, res) => {
  try {
    const { mensagem, id_atendimento = null } = req.body || {};

    if (typeof mensagem !== 'string' || !mensagem.trim()) {
      return res.status(400).json({
        erro: 'Informe uma mensagem válida.'
      });
    }

    if (
      id_atendimento !== null &&
      (!Number.isSafeInteger(id_atendimento) || id_atendimento <= 0)
    ) {
      return res.status(400).json({
        erro: 'ID de atendimento inválido.'
      });
    }

    const idUsuario = req.user.id_usuario;

    let resultado = responderFAQ(mensagem);

    if (!resultado) {
      resultado = await enviarMensagem(mensagem);
    }

    const idAtendimento = await registrarConversa(
      idUsuario,
      mensagem,
      resultado,
      id_atendimento
    );

    return res.status(200).json({
      id_atendimento: idAtendimento,
      ...resultado
    });

  } catch (erro) {
    console.error('Erro no chatbot:', erro.message);

    if (erro.status === 404) {
      return res.status(404).json({
        erro: erro.message
      });
    }

    return res.status(500).json({
      erro: 'Não foi possível processar sua mensagem.'
    });
  }
});

// Consultar histórico de um atendimento do cliente
router.get('/atendimentos/:id/historico', requireAuth, async (req, res) => {
  try {
    const idAtendimento = Number(req.params.id);

    if (!Number.isSafeInteger(idAtendimento) || idAtendimento <= 0) {
      return res.status(400).json({
        erro: 'ID de atendimento inválido.'
      });
    }

    const historico = await buscarHistorico(
      req.user.id_usuario,
      idAtendimento
    );

    if (!historico) {
      return res.status(404).json({
        erro: 'Atendimento não encontrado.'
      });
    }

    return res.status(200).json(historico);

  } catch (erro) {
    console.error('Erro ao consultar histórico:', erro.message);

    return res.status(500).json({
      erro: 'Não foi possível consultar o histórico.'
    });
  }
});

// Consulta de hotéis no MySQL
router.get('/hoteis', async (req, res, next) => {
  try {
    const cidade = req.query.cidade || null;
    const hoteis = await buscarHoteis(cidade);

    return res.status(200).json({
      total: hoteis.length,
      hoteis
    });
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
