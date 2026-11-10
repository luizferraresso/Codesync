# PDF único e entrega acadêmica

O [PDF consolidado](../entrega/HospedJa_Checkpoint3_Documento_Unico.pdf) foi regenerado em **28/10/2026** a partir dos documentos atuais e dos seis diagramas revisados. Substitui o relatório de 24/10, que ainda tratava testes e Docker como não executados. O conteúdo técnico foi atualizado; a identificação completa e a conferência da rubrica acadêmica cabem à equipe.

## Conteúdo consolidado

- Resumo executivo, correções, arquitetura efetiva e decisões do banco de 40 tabelas.
- Matriz completa RF01–RF35 e RNF01–RNF14, com evidências e limites de implementação.
- Rotas/permissões, sessão JWT revogável, migração `token_version`, testes e laboratório TDD.
- 142 testes unitários/HTTP e 7 de integração; cobertura global de linhas de 90,09%.
- Seis diagramas atuais, sumário navegável e links para as fontes e execuções da CI.
- Transcrições reais de testes, Docker e HTTP; resultados de CI vinculados ao commit testado. Não são capturas de tela.
- Estado AWS explicitamente pendente de validação remota, backlog, divisão de trabalho e apresentação.

Os diagnósticos históricos permanecem em seus documentos originais e no Git; não são apresentados como a situação atual. Não há segredos, `.env` ou credenciais reais no PDF.

## Geração reproduzível

Executar na raiz do projeto, com Docker disponível. As dependências Python ficam no contêiner de documentação e não alteram a imagem da API.

```bash
docker build -f scripts/pdf/Dockerfile -t hospedja-docs:local scripts/pdf
docker run --rm --network none -v "${PWD}:/repo" hospedja-docs:local
docker run --rm --network none -v "${PWD}:/repo:ro" hospedja-docs:local python scripts/verify-delivery.py
python scripts/verify-artifacts.py
npm run checksums:update
npm run checksums
```

No PowerShell com scripts bloqueados, usar `npm.cmd`. Para renderizar todas as páginas, montar uma pasta externa como `/validation` e acrescentar `--render-dir /validation/pdf-review` ao comando `verify-delivery.py`. Isso gera PNGs, miniaturas e relatório JSON fora do repositório.

Fontes: `scripts/build-delivery.py` seleciona 12 documentos atuais e lê `diagramas/modelos.json` e os previews. `scripts/pdf/requirements.txt` fixa as versões Python; a geração não acessa a rede. A imagem base e os pacotes do sistema podem variar em futuras reconstruções, embora o conteúdo seja derivado das mesmas fontes. A data e o commit de referência são explícitos no gerador e devem acompanhar novas consolidações.

## Verificação e submissão

- [x] Conteúdo e diagramas atualizados, com resultados vinculados às execuções registradas.
- [x] Conferência automática de texto, requisitos, imagens embutidas, marcadores, links internos e limites da página.
- [x] Páginas renderizadas e conferidas visualmente quanto a legibilidade, cortes e paginação.
- [ ] Preencher nomes dos cinco integrantes, turma e professor; revisar atribuições com a equipe.
- [ ] Confirmar se o professor exige capturas de tela adicionais e fontes dos diagramas além do PDF único.
- [ ] Conferir exigência de cronograma/ProjectLibre e histórico semanal; não fabricar registros passados.
- [ ] Validar AWS real e acrescentar evidências remotas somente após acesso e execução.
- [ ] Ensaiar o [roteiro de seis minutos](ROTEIRO_APRESENTACAO_6_MINUTOS.md) e aprovar a entrega acadêmica.

Fontes atuais: [índice](README.md), [evidências](EVIDENCIAS_CONSOLIDADAS_2026-10-28.md), [verificação](VERIFICACAO_E_LIMITACOES.md) e [diagramas](DIAGRAMAS_INTERACAO.md). O [relatório de 24/10](RELATORIO_VALIDACAO_CONSOLIDACAO.md) é histórico.
