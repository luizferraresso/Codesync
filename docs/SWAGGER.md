# Swagger / OpenAPI

Fonte: `src/docs/openapi.yaml`, OpenAPI 3.0.3. Rotas executáveis e validações devem ser conferidas em `src/routes/` e `src/validators/schemas.js`; a documentação ainda tem respostas genéricas que precisam de testes de contrato completos.

- Interface: http://localhost:3000/api-docs/
- Especificação JSON: http://localhost:3000/openapi.json
- Saúde: http://localhost:3000/health

Cadastre o cliente em `POST /api/v1/auth/register`, autentique em `POST /api/v1/auth/login` e copie `data.token` para **Authorize** (sem acrescentar Bearer manualmente na UI). Após `PATCH /api/v1/auth/password`, o token anterior é revogado; autentique novamente e substitua-o no Swagger.

Cadastro/troca exigem pelo menos 10 caracteres e no máximo 72 bytes UTF-8 para a senha nova. O catálogo aceita `limit` entre 1 e 100 (padrão 100) e `offset` entre 0 e 1000000 (padrão 0), depois de filtrar visibilidade. Exemplo: `/api/v1/hoteis?limit=10&offset=20`.

Os schemas `HotelPatch`, `QuartoPatch`, `GuiaPatch` e `ReservaEditar` descrevem entradas parciais próprias; não usar automaticamente o schema de criação para PATCH. Referências e YAML são verificados estruturalmente; a abertura do Swagger foi testada localmente.

Respostas padrão usam `{data: ...}`; troca de senha retorna 204 sem corpo. Health responde `{status:"ok",service:"hospedja-api"}` diretamente, e `/openapi.json` retorna a própria especificação. Erros têm `{error:{code,message}}`, incluindo 413 para corpo excessivo e 422 para campos inválidos.

O Swagger documenta rascunhos e operações preliminares; não cria integração externa, disponibilidade por período ou penalidade automática. Consulte [rotas/permissões](ROTAS_E_PERMISSOES.md), [testes](TESTES_E_EVIDENCIAS.md) e [limites da validação](VERIFICACAO_E_LIMITACOES.md).
