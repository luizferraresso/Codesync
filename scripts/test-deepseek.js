
'use strict';

const env = require('../src/config/env');

async function testDeepSeek() {
  if (!env.DEEPSEEK_API_KEY) {
    console.error('ERRO: DEEPSEEK_API_KEY não configurada.');
    process.exitCode = 1;
    return;
  }

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    env.DEEPSEEK_TIMEOUT_MS
  );

  try {
    console.log('Conectando à DeepSeek...');

    const response = await fetch(
      `${env.DEEPSEEK_BASE_URL.replace(/\/+$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: env.DEEPSEEK_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Você é o assistente virtual do HospedJá. Responda em português brasileiro.'
            },
            {
              role: 'user',
              content: 'Olá! Apresente-se e explique brevemente o que você pode fazer no HospedJá.'
            }
          ],
          thinking: {
            type: 'disabled'
          },
          max_tokens: 100,
          stream: false
        }),
        signal: controller.signal
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || 'Resposta inválida do provedor';

      console.error(`Falha na DeepSeek: HTTP ${response.status}`);
      console.error(message);

      process.exitCode = 1;
      return;
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (typeof answer !== 'string' || !answer.trim()) {
      throw new Error('A API respondeu, mas não retornou conteúdo válido.');
    }

    console.log('\nCONEXÃO REALIZADA COM SUCESSO!');
    console.log('Modelo:', data.model || env.DEEPSEEK_MODEL);
    console.log('Resposta da IA:', answer);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Tempo limite excedido ao consultar a DeepSeek.');
    } else {
      console.error('Erro de conexão:', error.message);
    }

    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

testDeepSeek();
