export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type Options = { baseUrl: string; getToken: () => string | null; onUnauthorized: (token: string) => void };

export function createClient({ baseUrl, getToken, onUnauthorized }: Options) {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    let response: Response;
    try {
      response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        ...init, headers, signal: init.signal ?? AbortSignal.timeout(15000),
        credentials: 'omit', redirect: 'error',
      });
    } catch (error) {
      if (init.signal?.aborted) throw error;
      throw new ApiError(0, 'CONEXAO_INDISPONIVEL', 'Não foi possível conectar. Verifique sua conexão e tente novamente.');
    }
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const authErrors = ['NAO_AUTENTICADO', 'TOKEN_INVALIDO', 'USUARIO_INATIVO', 'SESSAO_REVOGADA'];
      if (response.status === 401 && token && authErrors.includes(body?.error?.code)) onUnauthorized(token);
      throw new ApiError(response.status, body?.error?.code || 'FALHA_REQUISICAO',
        body?.error?.message || 'Não foi possível concluir a operação. Tente novamente.');
    }
    if (response.status !== 204 && (!body || !Object.hasOwn(body, 'data'))) {
      throw new ApiError(response.status, 'RESPOSTA_INVALIDA', 'O serviço retornou uma resposta inesperada.');
    }
    return body?.data as T;
  };
}

export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
}
