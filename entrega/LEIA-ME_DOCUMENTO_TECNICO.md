# Documento técnico — HospedJá / Checkpoint 3

Data de referência: 16/11/2026.

Commit de referência das alterações na main: `66fab2540930cf7152715798a3c7362b6cdf3a31` — https://github.com/luizferraresso/Codesync/commit/66fab2540930cf7152715798a3c7362b6cdf3a31 . A capa e a seção de hospedagem/versionamento do PDF identificam esse commit; a regeneração do documento é registrada em um commit posterior, pois altera os próprios arquivos de entrega.

- `HospedJa_Documento_Tecnico_Checkpoint3_2026-11-16.pdf`: versão final com identificação acadêmica preenchida e dez capturas reais.
- `HospedJa_Documento_Tecnico_Checkpoint3_2026-11-16.docx`: versão editável com o mesmo conteúdo e as imagens incorporadas.
- `HospedJa_Documento_Tecnico_Checkpoint3_2026-11-16.html`: versão de leitura no navegador e origem da impressão em PDF.
- `Inventario_Dependencias_2026-11-16.csv`: versões exatas das 419 entradas do lockfile, com separador ponto e vírgula.
- `evidencias/inventario_aws_2026-11-16.json`: inventário sanitizado de versões, metadados e amostras de motivos de log consultados na AWS.

O relatório final possui 14 seções. O passo a passo anterior e os quadros vazios foram retirados. A seção 14 apresenta dez capturas reais, cada uma com legenda, data 16/11/2026, responsável Luiz Felipe Ferraressso e identificação de ambiente. No PDF, as páginas das imagens estão em A4 horizontal para melhorar a leitura; o conteúdo técnico permanece em A4 vertical.

Integrantes: Luiz Felipe Ferraresso; Joao Lucas; Vitor; Enzo; Igor. Matéria: Projeto de Software 2. Turma: 11. Professor: MARCUS ARTIAGA COLANTONI. A grafia do responsável pelas evidências foi preservada conforme a indicação do autor.

O arquivo histórico `HospedJa_Checkpoint3_Documento_Unico.pdf` foi preservado. Para esta edição atualizada, use o PDF datado de 16/11/2026, identificado acima, com a seção de evidências ao final.

Fonte editável de texto: `docs/DOCUMENTO_TECNICO_CHECKPOINT3_2026-11-16.md`. O roteiro separado em `docs/ROTEIRO_PRINTS_CHECKPOINT3.md` permanece como referência da etapa de produção das capturas e não integra o PDF final.

Para regenerar HTML e Word, execute `python scripts/generate-technical-document.py` na raiz do projeto. Para gerar também PDF, utilize `python scripts/generate-technical-document.py --pdf`, com Chrome instalado, ou `--browser CAMINHO_DO_EXECUTAVEL`. Não há dependência Python adicional para a geração; a ferramenta usa a biblioteca padrão e o navegador para impressão. As imagens PNG são incorporadas aos arquivos. A inspeção de PDF foi realizada com ferramentas temporárias, sem alterar as dependências npm do backend.
