'use strict';

// Somente mensagens controladas pelo servidor. Nunca copiar err.message ou o payload.
const reasons = {
  CREDENCIAIS_INVALIDAS: 'Credenciais invalidas',
  USUARIO_NAO_ENCONTRADO: 'Usuario nao encontrado',
  SENHA_INCORRETA: 'Senha incorreta',
  EMAIL_CADASTRADO: 'Email ja cadastrado',
  CPF_CADASTRADO: 'CPF ja cadastrado',
  CPF_INVALIDO: 'CPF invalido ou ausente',
  CNPJ_INVALIDO: 'CNPJ invalido',
  SENHA_ATUAL_INVALIDA: 'Senha atual invalida',
  SENHA_ALTERADA: 'Senha alterada em outra sessao',
  NAO_AUTENTICADO: 'Autenticacao necessaria',
  TOKEN_INVALIDO: 'Token invalido ou expirado',
  SESSAO_REVOGADA: 'Sessao revogada',
  SEM_PERMISSAO: 'Permissao insuficiente',
  ACESSO_NEGADO: 'Perfil sem permissao para o recurso',
  USUARIO_INATIVO: 'Conta indisponivel',
  STATUS_INVALIDO: 'Status invalido',
  DATA_INVALIDA: 'Check-in precisa ser futuro',
  ESTADO_INVALIDO: 'Estado atual da reserva impede a operacao',
  CANCELAMENTO_INDISPONIVEL: 'Cancelamento indisponivel para reserva com pagamento ou confirmada',
  USUARIO_OBRIGATORIO: 'Guia interno exige usuario vinculado',
  PERFIL_INVALIDO: 'Perfil do usuario incompativel com o vinculo',
  CAMPO_PROTEGIDO: 'Campo reservado a administradores',
  ALVO_INVALIDO: 'Alvo da ocorrencia nao encontrado',
  VINCULO_INVALIDO: 'Vinculo informado nao corresponde ao recurso',
  OCORRENCIA_ENCERRADA: 'Ocorrencia encerrada',
  DADOS_INVALIDOS: 'Dados invalidos',
  DUPLICADO: 'Registro duplicado',
  REFERENCIA_INVALIDA: 'Relacionamento inexistente',
  VINCULO_EXISTENTE: 'Registro vinculado a outro',
  RESTRICAO_BANCO: 'Dados incompativeis com restricao do banco',
  JSON_INVALIDO: 'Corpo JSON invalido',
  CORPO_MUITO_GRANDE: 'Corpo da requisicao excede 100kb',
  NAO_ENCONTRADO: 'Registro nao encontrado',
  ROTA_NAO_ENCONTRADA: 'Endpoint nao encontrado',
  GESTOR_INVALIDO: 'Usuario informado nao e gestor ativo',
  VINCULO_NAO_ENCONTRADO: 'Vinculo ativo nao encontrado'
};

function auditReason(action, status, { code, invalidDocument } = {}) {
  const operation = {
    AUTENTICACAO: 'no login', CADASTRO: 'no cadastro', ALTERACAO_SENHA: 'na alteracao de senha',
    VINCULO_GESTOR: 'no vinculo de gestor', DESVINCULO_GESTOR: 'no desvinculo de gestor'
  }[action] || 'na operacao';
  if (status < 400) return `Sucesso ${operation}`;
  const reason = invalidDocument === 'cpf' ? 'CPF invalido ou ausente'
    : invalidDocument === 'cnpj' ? 'CNPJ invalido'
    : reasons[code] || ({ 401: 'Autenticacao necessaria', 403: 'Permissao insuficiente',
      404: 'Registro nao encontrado', 409: 'Conflito com o estado atual',
      422: 'Dados invalidos', 429: 'Limite de requisicoes excedido' }[status])
      || (status >= 500 ? 'Erro interno do servidor' : 'Requisicao recusada');
  return `Falha ${operation}: ${reason}`;
}

module.exports = auditReason;
