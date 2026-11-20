
'use strict';

require('dotenv').config();

function respostaSimulada(mensagem) {
  const texto = mensagem.toLowerCase();

  if (texto.includes('reserva')) {
    return 'Olá! Para realizar uma reserva no HospedJá, escolha o destino, as datas da viagem e a quantidade de hóspedes.';
  }

  if (texto.includes('hotel') || texto.includes('hospedagem')) {
    return 'Posso ajudar você a encontrar uma hospedagem! Qual destino você deseja visitar?';
  }

  if (texto.includes('pagamento')) {
    return 'No HospedJá, os pagamentos são realizados pelo Mercado Pago, conforme as condições da reserva.';
  }

  if (texto.includes('atendente') || texto.includes('humano')) {
    return 'Entendi! Você deseja falar com nossa equipe de atendimento. Vou encaminhar sua solicitação.';
  }

  return 'Olá! Sou o assistente virtual do HospedJá. Posso ajudar com hotéis, reservas, pagamentos e atendimento. Como posso ajudar?';
}

async function enviarMensagem(mensagem) {
  if (typeof mensagem !== 'string' || !mensagem.trim()) {
    throw new Error('A mensagem precisa ser um texto não vazio.');
  }

  if (process.env.DEEPSEEK_MOCK === 'true') {
    return {
      resposta: respostaSimulada(mensagem),
      modo: 'simulacao'
    };
  }

  throw new Error(
    'Modo real ainda não implementado neste serviço. Ative DEEPSEEK_MOCK=true.'
  );
}

module.exports = { enviarMensagem };
