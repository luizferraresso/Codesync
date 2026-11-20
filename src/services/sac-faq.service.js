
'use strict';

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function responderFAQ(mensagem) {
  const texto = normalizar(mensagem);

  if (/\b(cancelar|cancelamento|desistir)\b/.test(texto)) {
    return {
      resposta: 'Para solicitar o cancelamento, acesse suas reservas no HospedJá e consulte as opções disponíveis. As condições dependem das regras aplicáveis à reserva.',
      assunto: 'CANCELAMENTO',
      modo: 'faq'
    };
  }

  if (/\b(reembolso|estorno|devolucao)\b/.test(texto)) {
    return {
      resposta: 'Para verificar um reembolso, consulte os detalhes da sua reserva ou solicite atendimento ao suporte. O prazo depende das condições aplicáveis e do meio de pagamento.',
      assunto: 'REEMBOLSO',
      modo: 'faq'
    };
  }

  if (/\b(pagamento|pagar|pix|cartao|boleto)\b/.test(texto)) {
    return {
      resposta: 'Você pode consultar as formas de pagamento disponíveis durante a finalização da reserva. Caso tenha ocorrido algum problema com a cobrança, solicite atendimento ao suporte.',
      assunto: 'PAGAMENTO',
      modo: 'faq'
    };
  }

  if (/\b(atendente|humano|suporte|ajuda|sac)\b/.test(texto)) {
    return {
      resposta: 'Entendi! Você deseja falar com o suporte do HospedJá. Nesta versão, o encaminhamento para um atendente ainda será implementado.',
      assunto: 'ATENDIMENTO',
      modo: 'faq'
    };
  }

  return null;
}

module.exports = { responderFAQ };
