"""Build the consolidated PDF from reviewed Markdown and diagram sources.

Run in the image defined in scripts/pdf/Dockerfile; no runtime/network access
is needed. Markdown support deliberately matches this repository's documents.
"""
from pathlib import Path
from html import escape
from urllib.parse import quote
import argparse
import json
import re
import textwrap

from PIL import Image as PILImage
from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak,
    LongTable, TableStyle, Image, Preformatted,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'entrega/HospedJa_Checkpoint3_Documento_Unico.pdf'
REVISION = '28/10/2026'
BACKEND = '0c4aa05efc104d59288c25d2fbb971bf760a9a7c'
REPOSITORY = 'https://github.com/luizferraresso/Codesync'
SOURCE_URL = REPOSITORY + '/blob/fix/seguranca-testes-docker-aws/'
WIDTH, HEIGHT = A4
MARGIN = 45
CONTENT_WIDTH = WIDTH - 2 * MARGIN
NAVY = colors.HexColor('#18334B')
TEAL = colors.HexColor('#087F8C')
MUTED = colors.HexColor('#526579')
PALE = colors.HexColor('#F0F5F8')


def register_fonts():
    fonts = Path('/usr/share/fonts/truetype/dejavu')
    for name, file in [('Body', 'DejaVuSans.ttf'), ('Body-Bold', 'DejaVuSans-Bold.ttf'),
                       ('Mono', 'DejaVuSansMono.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(fonts / file)))
    pdfmetrics.registerFontFamily('Body', normal='Body', bold='Body-Bold',
                                  italic='Body', boldItalic='Body-Bold')


def styles():
    base = ParagraphStyle('Body', fontName='Body', fontSize=9.5, leading=14,
                          textColor=NAVY, spaceAfter=8, splitLongWords=True)
    return {
        'body': base,
        'title': ParagraphStyle('Title', parent=base, fontName='Body-Bold',
                                fontSize=39, leading=47, spaceAfter=18),
        'subtitle': ParagraphStyle('Subtitle', parent=base, fontSize=20, leading=27),
        'h1': ParagraphStyle('Heading1', parent=base, fontName='Body-Bold',
                             fontSize=19, leading=24, spaceAfter=15, keepWithNext=True),
        'h2': ParagraphStyle('Heading2', parent=base, fontName='Body-Bold',
                             fontSize=12, leading=17, spaceBefore=13,
                             spaceAfter=7, keepWithNext=True),
        'h3': ParagraphStyle('Heading3', parent=base, fontName='Body-Bold',
                             fontSize=10, leading=15, spaceBefore=9, keepWithNext=True),
        'small': ParagraphStyle('Small', parent=base, fontSize=8, leading=11,
                                textColor=MUTED),
        'cell': ParagraphStyle('Cell', parent=base, fontSize=8, leading=11,
                               spaceAfter=0),
        'th': ParagraphStyle('TableHeader', parent=base, fontName='Body-Bold',
                             fontSize=8, leading=11, textColor=colors.white, spaceAfter=0),
        'code': ParagraphStyle('Code', fontName='Mono', fontSize=7.2, leading=10.5,
                               textColor=NAVY, backColor=PALE, borderPadding=7,
                               spaceBefore=5, spaceAfter=12),
        'bullet': ParagraphStyle('Bullet', parent=base, leftIndent=13,
                                 firstLineIndent=-9, spaceAfter=5),
    }


def inline(text, source):
    # Protect links/code before escaping prose, including literal < and &.
    tokens = []

    def hold(value):
        tokens.append(value)
        return f'ZZINLINE{len(tokens)-1}ZZ'

    def link(match):
        label, href = match.groups()
        if not href.startswith(('https://', 'http://')):
            target = (source.parent / href.split('#')[0]).resolve()
            href = SOURCE_URL + quote(target.relative_to(ROOT).as_posix())
        return hold(f'<link href="{escape(href, quote=True)}" color="#087F8C">'
                    f'{escape(label)}</link>')

    text = re.sub(r'`([^`]+)`', lambda m: hold(
        '<font name="Mono" size="8">' + escape(m[1]) + '</font>'), text)
    text = re.sub(r'\[([^\]]+)\]\(([^\n]+?)\)', link, text)
    text = escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Nested tokens may occur inside the label of a link.
    for _ in range(2):
        text = re.sub(r'ZZINLINE(\d+)ZZ', lambda m: tokens[int(m[1])], text)
    return text


class DeliveryDoc(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(str(path), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=53, bottomMargin=44, title='HospedJá — Checkpoint 3',
                         author='CodeSync — Grupo 3',
                         subject='Consolidação técnica revisada em ' + REVISION,
                         pageCompression=1)
        frame = Frame(MARGIN, 44, CONTENT_WIDTH, HEIGHT-97,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='main', frames=frame, onPage=self.decorate))
        self.bookmark_index = 0

    def beforeDocument(self):
        self.bookmark_index = 0

    def decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(TEAL)
        canvas.rect(0, HEIGHT-9, WIDTH, 9, fill=1, stroke=0)
        if doc.page > 1:
            canvas.setFont('Body-Bold', 8)
            canvas.setFillColor(NAVY)
            canvas.drawString(MARGIN, HEIGHT-32, 'HOSPEDJÁ / CHECKPOINT 3')
            canvas.setFont('Body', 8)
            canvas.setFillColor(MUTED)
            canvas.drawRightString(WIDTH-MARGIN, HEIGHT-32, 'Revisão ' + REVISION)
        canvas.setStrokeColor(colors.HexColor('#D7E1E9'))
        canvas.line(MARGIN, 34, WIDTH-MARGIN, 34)
        canvas.setFont('Body', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN, 22, 'CodeSync · Grupo 3 · UNIUBE · Documento técnico')
        canvas.drawRightString(WIDTH-MARGIN, 22, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and hasattr(flowable, 'outline_level'):
            level = flowable.outline_level
            key = f'section-{self.bookmark_index}'
            self.bookmark_index += 1
            self.canv.bookmarkPage(key)
            label = flowable.getPlainText()
            self.canv.addOutlineEntry(label, key, level=level)
            self.notify('TOCEntry', (level, label, self.page, key))


def heading(text, style, level=0):
    item = Paragraph(escape(text), style)
    item.outline_level = level
    return item


def table(rows, source, st):
    count = len(rows[0])
    first = rows[0][0].strip()
    if first == 'ID' and count == 4:
        ratios = [0.085, 0.34, 0.15, 0.425]
    elif first == 'ID' and count == 2:
        ratios = [0.13, 0.87]
    elif count == 2:
        ratios = [0.29, 0.71]
    elif count == 3:
        ratios = [0.20, 0.38, 0.42]
    elif first == 'Método' and count == 4:
        ratios = [0.12, 0.28, 0.20, 0.40]
    else:
        ratios = [1/count]*count
    cells = [[Paragraph(inline(cell, source), st['th' if i == 0 else 'cell'])
              for cell in row] for i, row in enumerate(rows)]
    result = LongTable(cells, colWidths=[CONTENT_WIDTH*r for r in ratios],
                       repeatRows=1, hAlign='LEFT', spaceBefore=4, spaceAfter=13)
    result.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PALE]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 1, TEAL),
    ]))
    return result


def markdown(source, st, story):
    lines = source.read_text(encoding='utf-8').splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith('# '):
            i += 1
            continue
        if line.startswith('```'):
            block = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                block.extend(textwrap.wrap(lines[i], width=105, replace_whitespace=False,
                                           drop_whitespace=False) or [''])
                i += 1
            story.append(Preformatted('\n'.join(block), st['code']))
            i += 1
            continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', c) for c in row):
                    rows.append(row)
                i += 1
            if len({len(row) for row in rows}) != 1:
                raise ValueError(f'Invalid table in {source}')
            story.append(table(rows, source, st))
            continue
        if line.startswith('##'):
            level = len(line) - len(line.lstrip('#'))
            story.append(Paragraph(inline(line.lstrip('#').strip(), source),
                                   st['h2' if level == 2 else 'h3']))
        elif re.match(r'^(- |\d+\. )', line):
            if line.startswith('- '):
                content = line[2:].replace('[x]', '✓').replace('[ ]', '□')
                line = '• ' + content
            story.append(Paragraph(inline(line, source), st['bullet']))
        else:
            # Documents use explicit one-line paragraphs; join soft wraps.
            chunk = [line.lstrip('> ')]
            while i+1 < len(lines) and lines[i+1].strip() and not re.match(
                    r'^(#|\||```|- |\d+\. |>)', lines[i+1].strip()):
                i += 1
                chunk.append(lines[i].strip())
            story.append(Paragraph(inline(' '.join(chunk), source), st['body']))
        i += 1


def build(output):
    register_fonts()
    rl_config.invariant = True
    st = styles()
    story = [Spacer(1, 67), Paragraph('HOSPEDJÁ', st['title']),
             Paragraph('Checkpoint 3<br/>Documento consolidado', st['subtitle']),
             Spacer(1, 22), Paragraph('Projeto de Software 2 · UNIUBE<br/>'
                                     'CodeSync · Grupo 3 · Equipe de cinco integrantes', st['body']),
             Spacer(1, 24), Paragraph('Revisão técnica · 28 de outubro de 2026', st['h2']),
             Paragraph('Backend, banco, segurança, testes, diagramas e operação. '
                       'Esta edição substitui as informações desatualizadas do PDF de 24/10/2026.', st['body']),
             Spacer(1, 15), Paragraph('<b>149 testes do backend aprovados</b><br/>'
                                     '90,09% de cobertura de linhas em todo src<br/>'
                                     'Docker local e CI verificados · AWS remota pendente', st['body']),
             Spacer(1, 20), Paragraph('Nomes dos integrantes, turma e professor: '
                                     'preenchimento e conferência pela equipe antes da submissão.', st['small']),
             Paragraph(f'<link href="{REPOSITORY}" color="#087F8C">{REPOSITORY}</link>', st['small']),
             Paragraph('Backend de referência: ' + BACKEND, st['small']), PageBreak(),
             Paragraph('Sumário', st['h1'])]
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle('TOC0', fontName='Body', fontSize=10,
                                     leading=15, spaceBefore=7),
                       ParagraphStyle('TOC1', fontName='Body', fontSize=9,
                                      leading=13, leftIndent=15, spaceBefore=4)]
    story.extend([toc, Spacer(1, 22), Paragraph(
        'Os links do sumário e os marcadores permitem navegar pelo PDF. Links de fontes '
        'abrem o repositório; resultados da CI apontam para execuções específicas. '
        'Históricos de 24/10 e diagnósticos anteriores às correções permanecem no Git '
        'e não são usados como descrição do estado atual.', st['small'])])

    sections = [
        ('1. Escopo e resumo executivo', 'docs/RESUMO_EXECUTIVO.md'),
        ('2. Revisão técnica e pendências', 'docs/REVISAO_GERAL.md'),
        ('3. Arquitetura efetiva', 'docs/arquitetura/ARQUITETURA.md'),
        ('4. Banco e decisões de modelagem', 'docs/arquitetura/MODELAGEM_E_DECISOES.md'),
        ('5. Requisitos e rastreabilidade', 'docs/MATRIZ_REQUISITOS_CP2.md'),
        ('6. API REST, permissões e contratos', 'docs/ROTAS_E_PERMISSOES.md'),
        ('7. Validação e limitações', 'docs/VERIFICACAO_E_LIMITACOES.md'),
        ('8. Evidências registradas', 'docs/EVIDENCIAS_CONSOLIDADAS_2026-10-28.md'),
        ('9. TDD e reprodução dos testes', 'docs/TDD_PLANO_E_EVIDENCIAS.md'),
    ]
    sources = []
    for title, relative in sections:
        source = ROOT / relative
        sources.append(relative)
        story.extend([PageBreak(), heading(title, st['h1']),
                      Paragraph('Fonte: ' + inline(f'[{relative}]({source.name})', source), st['small'])])
        markdown(source, st, story)

    story.extend([PageBreak(), heading('10. Diagramas atualizados', st['h1'])])
    models = json.loads((ROOT / 'diagramas/modelos.json').read_text(encoding='utf-8'))['diagrams']
    for index, model in enumerate(models):
        if index:
            story.append(PageBreak())
        story.append(heading(f"10.{index+1}. {model['title']}", st['h2'], level=1))
        path = ROOT / 'diagramas/previews' / (model['file'] + '.png')
        with PILImage.open(path) as im:
            width, height = im.size
        scale = min(CONTENT_WIDTH / width, (580 if index == 0 else 620) / height)
        story.extend([Spacer(1, 8), Image(str(path), width=width*scale, height=height*scale),
                      Spacer(1, 12), Paragraph('Fonte editável: diagramas/' + model['file'] +
                                               '.drawio. PNG e DOT derivados de modelos.json; '
                                               'relações e rótulos verificados contra o modelo.', st['small'])])

    for title, relative in [
        ('11. Equipe e backlog', 'docs/DIVISAO_EQUIPE_E_BACKLOG.md'),
        ('12. Apresentação de seis minutos', 'docs/ROTEIRO_APRESENTACAO_6_MINUTOS.md'),
        ('13. Entrega, fontes e reprodução do PDF', 'docs/PDF_UNICO_E_ENTREGA.md'),
    ]:
        sources.append(relative)
        story.extend([PageBreak(), heading(title, st['h1'])])
        markdown(ROOT / relative, st, story)

    story.append(Paragraph('Referências complementares', st['h2']))
    for relative in ['docs/TESTES_E_EVIDENCIAS.md', 'docs/SWAGGER.md', 'aws/DEPLOY_AWS.md',
                     'database/01_schema.sql', 'database/03_verificacao.sql',
                     'database/migrations/001_token_version.sql', 'src/docs/openapi.yaml',
                     'referencias/checkpoint2/HospedJa_Documento_Tecnico_Completo (1).docx',
                     'referencias/checkpoint2/HospedJa_DER_v4.drawio']:
        story.append(Paragraph(f'<link href="{SOURCE_URL+quote(relative)}" color="#087F8C">'
                               + escape(relative) + '</link>', st['small']))
    output.parent.mkdir(parents=True, exist_ok=True)
    DeliveryDoc(output).multiBuild(story)
    print(f'PDF gerado: {output.name}; {len(sources)} documentos e {len(models)} diagramas.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    build(parser.parse_args().output)
