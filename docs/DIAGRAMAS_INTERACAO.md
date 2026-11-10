# Diagramas de interação e componentes — item 4.9

**Revisão: 28/10/2026.** Os seis arquivos em `diagramas/` são visões simplificadas dos módulos implementados, editáveis no diagrams.net, com fundo branco e página vertical. Os nomes em formato de classe representam módulos CommonJS/fábricas de controllers, não necessariamente classes JavaScript.

| Arquivo | Conteúdo alinhado ao código |
|---|---|
| `01_camadas_controller_service_repository` | Rotas/controllers/services, repositórios e acessos diretos ao pool; a arquitetura não é uma cadeia estrita exclusivamente por repositories |
| `02_autenticacao_jwt_bcrypt` | Zod 4, limite UTF-8, métodos de troca de senha, JWT `sub`/`sv`, conferência de `token_version` e atualização atômica |
| `03_auditoria_logs` | Evento `finish`, `originalUrl`, ação de troca de senha, sanitização, Winston e persistência best-effort em `tb_log` |
| `04_reservas_pagamentos` | Rascunhos e lançamentos administrativos; ambos acessam `ReservationRepository` e bloqueiam a mesma reserva em transação; sem cobrança externa |
| `05_ocorrencias_analise` | Propriedade/coerência de vínculos, consultas reais e análise humana; `tb_penalidade` foi retirado desse fluxo porque a API não o utiliza |
| `06_componentes_atualizado_node` | Node.js 22, Express/Zod, serviços, repositórios, pool e Winston; auditoria acessa pool diretamente; MySQL 8.0/8.4 locais testados |

Cada nome possui `.drawio`, `.dot` e `.png` em `diagramas/previews/`. O layout do PNG é calculado pelo Graphviz; o draw.io mantém caixas editáveis e outra distribuição. Ambos representam os mesmos nós, rótulos e relações.

## Fonte e regeneração

`diagramas/modelos.json` é a fonte única das legendas e relações. Para alterar um diagrama, editar seu modelo e regenerar os dois formatos:

```bash
python scripts/generate-diagrams.py
dot -Tpng -Gdpi=120 diagramas/02_autenticacao_jwt_bcrypt.dot -o diagramas/previews/02_autenticacao_jwt_bcrypt.png
python scripts/verify-artifacts.py
npm run checksums:update
npm run checksums
```

Repetir o comando `dot` para cada fonte alterada. Graphviz pode ser instalado em contêiner para renderização, sem mudar o host. Não editar somente o PNG ou somente uma das fontes: isso voltaria a produzir versões divergentes. As representações XML e DOT são verificadas contra o modelo; previews são conferidos como PNGs válidos.

Com Graphviz disponível no ambiente, `python scripts/generate-diagrams.py --render` regenera os seis PNGs junto com as fontes.

## Interpretação e entrega

Os fluxos essenciais foram exercitados em testes locais, inclusive com banco real; isso não comprova todos os cenários de negócio. Os desenhos não representam disponibilidade por período, reserva confirmada, Mercado Pago, SAC/DeepSeek ou aplicação de penalidades como implementados. Também não são prova de implantação AWS.

O PDF consolidado já incorpora estes seis previews e evidências reais conforme [PDF_UNICO_E_ENTREGA.md](PDF_UNICO_E_ENTREGA.md). Os modelos originais do CP2 em `referencias/` permanecem como fontes históricas, sem alteração retroativa.
