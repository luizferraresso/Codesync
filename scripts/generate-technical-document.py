"""Gera HTML e DOCX editavel a partir do relatorio tecnico, sem dependencias externas.

Para PDF, use --pdf; um Chrome/Edge instalado e executado em modo headless,
com perfil temporario exclusivo dentro do workspace. Nao acessa banco ou rede.
"""
from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
from html import escape
import os
from pathlib import Path
import re
import struct
import subprocess
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/DOCUMENTO_TECNICO_CHECKPOINT3_2026-11-16.md'
OUTPUT = ROOT / 'entrega/HospedJa_Documento_Tecnico_Checkpoint3_2026-11-16'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
XML = 'http://www.w3.org/XML/1998/namespace'
ET.register_namespace('w', W)
ET.register_namespace('r', R)
WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture'
ET.register_namespace('wp', WP)
ET.register_namespace('a', A)
ET.register_namespace('pic', PIC)


def image_file(reference):
    path = (SOURCE.parent / reference).resolve()
    if not path.is_relative_to(ROOT.resolve()) or not path.is_file():
        raise ValueError('Imagem inexistente ou fora do projeto: ' + reference)
    if path.suffix.lower() != '.png':
        raise ValueError('Formato de imagem nao suportado: ' + reference)
    return path


def png_dimensions(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Imagem PNG invalida')
    return struct.unpack('>II', data[16:24])


def element(tag, attrs=None, text=None, namespace=W):
    node = ET.Element(f'{{{namespace}}}{tag}', {f'{{{namespace}}}{k}': str(v) for k, v in (attrs or {}).items()})
    if text is not None:
        node.text = str(text)
    return node


def blocks(text):
    lines, out, i = text.splitlines(), [], 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i])
                i += 1
            out.append(('code', '\n'.join(code)))
        elif re.match(r'^#{1,3} ', line):
            level = len(line) - len(line.lstrip('#'))
            out.append(('heading', (level, line[level:].strip())))
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', c) for c in row):
                    rows.append(row)
                i += 1
            if len({len(row) for row in rows}) != 1:
                raise ValueError('Tabela Markdown irregular')
            out.append(('table', rows))
            continue
        elif line.startswith('!['):
            match = re.fullmatch(r'!\[([^\]]*)\]\(([^)]+)\)', line)
            if not match:
                raise ValueError('Referencia de imagem invalida')
            out.append(('image', match.groups()))
        elif line.startswith('[[PRINT:'):
            match = re.fullmatch(r'\[\[PRINT:(\d+)\|(.+)\]\]', line)
            if not match:
                raise ValueError('Marcador de print invalido')
            out.append(('print', match.groups()))
        elif re.match(r'^(\d+\. |[-] )', line):
            out.append(('list', line))
        else:
            paragraph = [line]
            while i + 1 < len(lines) and lines[i+1].strip() and not re.match(r'^(#|\||```|!\[|\[\[PRINT:|\d+\. |[-] )', lines[i+1].strip()):
                i += 1
                paragraph.append(lines[i].strip())
            out.append(('paragraph', ' '.join(paragraph)))
        i += 1
    return out


INLINE = re.compile(r'(`[^`]+`|\*\*.+?\*\*|\[[^\]]+\]\([^\s)]+\)|https?://[^\s<>]+)')


def chunks(text):
    for piece in INLINE.split(text):
        if not piece:
            continue
        if piece.startswith('`') and piece.endswith('`'):
            yield 'code', piece[1:-1], None
        elif piece.startswith('**') and piece.endswith('**'):
            yield 'bold', piece[2:-2], None
        elif piece.startswith('['):
            match = re.fullmatch(r'\[([^\]]+)\]\(([^)]+)\)', piece)
            if match:
                yield 'link', match[1], match[2]
            else:
                yield 'text', piece, None
        elif piece.startswith(('http://', 'https://')):
            url = piece.rstrip('.;,')
            yield 'link', url, url
            if len(url) < len(piece):
                yield 'text', piece[len(url):], None
        else:
            yield 'text', piece, None


def inline_html(text):
    result = []
    for kind, value, href in chunks(text):
        value = escape(value)
        if kind == 'code':
            result.append(f'<code>{value}</code>')
        elif kind == 'bold':
            result.append(f'<strong>{value}</strong>')
        elif kind == 'link':
            result.append(f'<a href="{escape(href, quote=True)}">{value}</a>')
        else:
            result.append(value)
    return ''.join(result)


CSS = '''
@page { size:A4; margin:19mm 18mm 18mm;
 @bottom-left {content:"HOSPEDJÁ · CHECKPOINT 3 · 16/11/2026";font:8px Arial;color:#516477;}
 @bottom-right {content:counter(page) " / " counter(pages);font:9px Arial;color:#516477;}
}
@page:first { @bottom-left {content:"CODESYNC · GRUPO 3 · UNIUBE";} }
@page evidence {size:A4 landscape;margin:15mm 16mm;}
* {box-sizing:border-box} body {font:10.2pt/1.5 Arial,sans-serif;color:#193246;margin:0}
main {margin:0} .cover {padding-top:20mm;min-height:245mm}
.brand {font-size:42pt;letter-spacing:-2px;font-weight:700;color:#087f8c;margin:8mm 0 3mm}
.kicker {font-size:9pt;letter-spacing:2px;font-weight:bold;color:#087f8c}
.subtitle {font-size:25pt;line-height:1.12;font-weight:700;margin:0 0 9mm;color:#17324a}
.cover p {font-size:10.5pt} .cover .meta {margin-bottom:12mm;color:#516477}
h1 {font-size:20pt;line-height:1.15;margin:0 0 7mm;break-before:page;color:#17324a}
h2 {font-size:13pt;line-height:1.25;margin:7mm 0 3mm;color:#087f8c}
h1,h2,h3 {break-after:avoid} p {margin:0 0 3.2mm;orphans:3;widows:3}
a {color:#087f8c;text-decoration:none;overflow-wrap:anywhere} strong {font-weight:700}
code {font:8.5pt Consolas,'Courier New',monospace;background:#edf3f6;overflow-wrap:anywhere}
pre {font:8pt/1.42 Consolas,'Courier New',monospace;background:#edf3f6;border-left:3px solid #087f8c;padding:3mm;white-space:pre-wrap;overflow-wrap:anywhere;margin:3mm 0 5mm;break-inside:avoid}
pre code {font:inherit;background:none} table {width:100%;border-collapse:collapse;margin:3mm 0 5mm;font-size:8.5pt;line-height:1.38;table-layout:fixed}
th {background:#17324a;color:white;text-align:left;font-weight:bold;padding:2.5mm 2mm}
td {border-bottom:1px solid #dce5ec;vertical-align:top;padding:2.5mm 2mm;overflow-wrap:anywhere}
tr:nth-child(even) td {background:#f0f5f8} tr {break-inside:avoid} thead {display:table-header-group}
td:first-child,th:first-child {width:25%} .list {padding-left:3mm;margin-bottom:2.5mm}
.toc {break-before:page} .toc h1 {break-before:auto} .toc a {display:block;padding:2.3mm 0;border-bottom:1px solid #e0e8ed}
.evidence {break-before:page;margin-top:0} .evidence.first {break-before:auto}
.figure-page {page:evidence;break-before:page;break-after:page;width:265mm;}
.figure-page h2 {margin:0 0 3mm;font-size:14pt;}
.figure-page p {font-size:9pt;line-height:1.35;margin:2mm 0;}
.evidence-image {margin:2mm 0;text-align:center;break-inside:avoid;}
.evidence-image img {display:block;margin:0 auto;max-width:265mm;max-height:135mm;width:auto;height:auto;border:1px solid #cbd8e2;}
.placeholder {height:120mm;border:1.4px dashed #7f9cae;background:#f6f9fb;color:#526b7d;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10mm;margin:5mm 0;break-inside:avoid}
.placeholder b {font-size:15pt;letter-spacing:2px;display:block;margin-bottom:4mm}
.placeholder span {max-width:120mm} .note {font-size:9pt;color:#526579}
@media screen {body{background:#e6edf2;padding:25px}main{background:white;padding:22mm;max-width:315mm;margin:auto;box-shadow:0 5px 30px #10243620}.cover{min-height:auto;padding-bottom:30mm}.placeholder{height:105mm}.figure-page{width:auto;margin:10mm 0 20mm}.evidence-image img{max-width:100%;}}
'''


def html_document(items, chapters):
    first = next(i for i, block in enumerate(items) if block[0] == 'heading' and block[1][0] == 2)
    cover = ['<div class="cover"><div class="kicker">CHECKPOINT 3 · DOCUMENTAÇÃO TÉCNICA</div><div class="brand">HOSPEDJÁ</div><div class="subtitle">Documento técnico<br>consolidado</div>']
    for kind, value in items[1:first]:
        if kind in ('paragraph', 'list'):
            cover.append(f'<p>{inline_html(value)}</p>')
    cover.append('</div><nav class="toc"><h1>Sumário</h1>')
    for n, name in chapters:
        cover.append(f'<a href="#sec-{n}">{escape(name)}</a>')
    cover.append('<p class="note">Versões e resultados conferidos em 16/11/2026. Evidências reais, com legendas e identificação do responsável, na seção 14.</p></nav>')
    contents = []
    evidence = 0
    figure_open = False
    for kind, value in items[first:]:
        if kind == 'heading':
            level, title = value
            if level == 2:
                if figure_open:
                    contents.append('</section>')
                    figure_open = False
                n = title.split('.',1)[0]
                contents.append(f'<h1 id="sec-{escape(n)}">{escape(title)}</h1>')
            else:
                if title.startswith('Figura '):
                    if figure_open:
                        contents.append('</section>')
                    contents.append('<section class="figure-page">')
                    figure_open = True
                extra = ''
                if title.startswith('Evidência '):
                    evidence += 1
                    extra = ' class="evidence' + (' first' if evidence == 1 else '') + '"'
                contents.append(f'<h2{extra}>{escape(title)}</h2>')
        elif kind in ('paragraph', 'list'):
            extra = ' class="list"' if kind == 'list' else ''
            contents.append(f'<p{extra}>{inline_html(value)}</p>')
        elif kind == 'code':
            contents.append(f'<pre><code>{escape(value)}</code></pre>')
        elif kind == 'image':
            label, reference = value
            encoded = base64.b64encode(image_file(reference).read_bytes()).decode('ascii')
            contents.append(f'<figure class="evidence-image"><img alt="{escape(label,quote=True)}" src="data:image/png;base64,{encoded}"></figure>')
        elif kind == 'table':
            rows = ['<table><thead><tr>' + ''.join(f'<th>{inline_html(c)}</th>' for c in value[0]) + '</tr></thead><tbody>']
            for row in value[1:]:
                rows.append('<tr>' + ''.join(f'<td>{inline_html(c)}</td>' for c in row) + '</tr>')
            rows.append('</tbody></table>')
            contents.append(''.join(rows))
        elif kind == 'print':
            number, label = value
            contents.append(f'<div class="placeholder"><b>PRINT {number}</b><span>{escape(label)}</span><small>Espaço reservado · preenchimento pelo aluno</small></div>')
    if figure_open:
        contents.append('</section>')
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>HospedJá — Documento técnico CP3</title><style>'+CSS+'</style></head><body><main>'+''.join(cover+contents)+'</main></body></html>'


class WordDocument:
    def __init__(self):
        self.root = element('document')
        self.body = ET.SubElement(self.root, f'{{{W}}}body')
        self.links = []
        self.bookmarks = 0
        self.images = []

    def run(self, value, bold=False, code=False, color=None):
        run = element('r')
        if bold or code or color:
            props = ET.SubElement(run,f'{{{W}}}rPr')
            if bold:
                props.append(element('b'))
            if code:
                props.append(element('rFonts',{'ascii':'Consolas','hAnsi':'Consolas'}))
                props.append(element('sz',{'val':17}))
            if color:
                props.append(element('color',{'val':color}))
        for i, line in enumerate(value.split('\n')):
            if i:
                run.append(element('br'))
            text = element('t',text=line)
            text.set(f'{{{XML}}}space','preserve')
            run.append(text)
        return run

    def paragraph(self, text='', style='Normal', parent=None, page_before=False, bookmark=None):
        paragraph = element('p')
        props = ET.SubElement(paragraph,f'{{{W}}}pPr')
        props.append(element('pStyle',{'val':style}))
        if page_before:
            props.append(element('pageBreakBefore'))
        if bookmark:
            paragraph.append(element('bookmarkStart',{'id':self.bookmarks,'name':bookmark}))
        for kind, value, href in chunks(text):
            if kind == 'link':
                rel_id = f'rIdLink{len(self.links)+1}'
                self.links.append((rel_id,href))
                link = element('hyperlink')
                link.set(f'{{{R}}}id',rel_id)
                link.append(self.run(value,color='087F8C'))
                paragraph.append(link)
            else:
                paragraph.append(self.run(value,bold=kind=='bold',code=kind=='code'))
        if bookmark:
            paragraph.append(element('bookmarkEnd',{'id':self.bookmarks}))
            self.bookmarks += 1
        (parent if parent is not None else self.body).append(paragraph)
        return paragraph

    def toc(self, chapters):
        self.paragraph('Sumário',style='TOCTitle',page_before=True)
        for n,title in chapters:
            paragraph = element('p')
            props = ET.SubElement(paragraph,f'{{{W}}}pPr')
            props.append(element('pStyle',{'val':'TOCItem'}))
            link = element('hyperlink',{'anchor':f'sec_{n}'})
            link.append(self.run(title,color='087F8C'))
            paragraph.append(link)
            self.body.append(paragraph)
        self.paragraph('Versões e resultados conferidos em 16/11/2026. Evidências reais com legendas na seção 14.',style='Small')

    def table(self, rows, placeholder=False):
        table = element('tbl')
        props = ET.SubElement(table,f'{{{W}}}tblPr')
        props.append(element('tblW',{'w':9766,'type':'dxa'}))
        borders = ET.SubElement(props,f'{{{W}}}tblBorders')
        for side in ['top','left','bottom','right','insideH','insideV']:
            borders.append(element(side,{'val':'dashed' if placeholder else 'single','sz':5,'color':'9BB0BF' if placeholder else 'DCE5EC'}))
        props.append(element('tblLayout',{'type':'fixed'}))
        margins = ET.SubElement(props,f'{{{W}}}tblCellMar')
        for side in ['top','left','bottom','right']:
            margins.append(element(side,{'w':100,'type':'dxa'}))
        count = len(rows[0])
        widths = [9766] if count == 1 else [2441]+[(9766-2441)//(count-1)]*(count-1)
        grid = ET.SubElement(table,f'{{{W}}}tblGrid')
        for width in widths:
            grid.append(element('gridCol',{'w':width}))
        for i,row in enumerate(rows):
            tr = ET.SubElement(table,f'{{{W}}}tr')
            tr_props = ET.SubElement(tr,f'{{{W}}}trPr')
            tr_props.append(element('cantSplit'))
            if i == 0 and not placeholder:
                tr_props.append(element('tblHeader'))
            if placeholder:
                tr_props.append(element('trHeight',{'val':6800,'hRule':'atLeast'}))
            for j,value in enumerate(row):
                cell = ET.SubElement(tr,f'{{{W}}}tc')
                cell_props = ET.SubElement(cell,f'{{{W}}}tcPr')
                cell_props.append(element('tcW',{'w':widths[j],'type':'dxa'}))
                cell_props.append(element('shd',{'fill':'F4F8FA' if placeholder else '17324A' if i == 0 else 'F0F5F8' if i%2 else 'FFFFFF'}))
                if placeholder:
                    cell_props.append(element('vAlign',{'val':'center'}))
                self.paragraph(value,style='Placeholder' if placeholder else 'TableHeader' if i==0 else 'TableText',parent=cell)
        self.body.append(table)
        self.paragraph('',style='Small')

    def image(self, label, reference):
        data = image_file(reference).read_bytes()
        width, height = png_dimensions(data)
        scale = min(6200000 / width, 4680000 / height)
        cx, cy = int(width * scale), int(height * scale)
        number = len(self.images) + 1
        rel_id = f'rIdImage{number}'
        name = f'evidence-{number:02}.png'
        self.images.append((rel_id,name,data))
        paragraph = self.paragraph('',style='Image')
        props = paragraph.find(f'{{{W}}}pPr')
        props.append(element('jc',{'val':'center'}))
        run = ET.SubElement(paragraph,f'{{{W}}}r')
        drawing = ET.SubElement(run,f'{{{W}}}drawing')
        inline = ET.SubElement(drawing,f'{{{WP}}}inline',distT='0',distB='0',distL='0',distR='0')
        ET.SubElement(inline,f'{{{WP}}}extent',cx=str(cx),cy=str(cy))
        ET.SubElement(inline,f'{{{WP}}}docPr',id=str(number),name=name,descr=label)
        locks = ET.SubElement(inline,f'{{{WP}}}cNvGraphicFramePr')
        ET.SubElement(locks,f'{{{A}}}graphicFrameLocks',noChangeAspect='1')
        graphic = ET.SubElement(inline,f'{{{A}}}graphic')
        graphic_data = ET.SubElement(graphic,f'{{{A}}}graphicData',uri=PIC)
        pic = ET.SubElement(graphic_data,f'{{{PIC}}}pic')
        nonvisual = ET.SubElement(pic,f'{{{PIC}}}nvPicPr')
        ET.SubElement(nonvisual,f'{{{PIC}}}cNvPr',id='0',name=name,descr=label)
        ET.SubElement(nonvisual,f'{{{PIC}}}cNvPicPr')
        fill = ET.SubElement(pic,f'{{{PIC}}}blipFill')
        blip = ET.SubElement(fill,f'{{{A}}}blip')
        blip.set(f'{{{R}}}embed',rel_id)
        stretch = ET.SubElement(fill,f'{{{A}}}stretch')
        ET.SubElement(stretch,f'{{{A}}}fillRect')
        shape = ET.SubElement(pic,f'{{{PIC}}}spPr')
        transform = ET.SubElement(shape,f'{{{A}}}xfrm')
        ET.SubElement(transform,f'{{{A}}}off',x='0',y='0')
        ET.SubElement(transform,f'{{{A}}}ext',cx=str(cx),cy=str(cy))
        geometry = ET.SubElement(shape,f'{{{A}}}prstGeom',prst='rect')
        ET.SubElement(geometry,f'{{{A}}}avLst')

    def save(self, target):
        section = ET.SubElement(self.body,f'{{{W}}}sectPr')
        footer_ref = element('footerReference',{'type':'default'})
        footer_ref.set(f'{{{R}}}id','rIdFooter')
        section.append(footer_ref)
        section.append(element('pgSz',{'w':11906,'h':16838}))
        section.append(element('pgMar',{'top':1077,'right':1070,'bottom':1020,'left':1070,'header':400,'footer':450,'gutter':0}))
        footer = element('ftr')
        paragraph = ET.SubElement(footer,f'{{{W}}}p')
        props = ET.SubElement(paragraph,f'{{{W}}}pPr')
        props.append(element('pStyle',{'val':'Small'}))
        paragraph.append(self.run('HOSPEDJÁ · CP3 · 16/11/2026                                      Página '))
        field = element('fldSimple',{'instr':'PAGE'})
        field.append(self.run('1'))
        paragraph.append(field)
        relationships = ET.Element('Relationships',xmlns=REL)
        ET.SubElement(relationships,'Relationship',Id='rIdStyles',Type=R+'/styles',Target='styles.xml')
        ET.SubElement(relationships,'Relationship',Id='rIdSettings',Type=R+'/settings',Target='settings.xml')
        ET.SubElement(relationships,'Relationship',Id='rIdFooter',Type=R+'/footer',Target='footer1.xml')
        for rel_id,url in self.links:
            ET.SubElement(relationships,'Relationship',Id=rel_id,Type=R+'/hyperlink',Target=url,TargetMode='External')
        for rel_id,name,data in self.images:
            ET.SubElement(relationships,'Relationship',Id=rel_id,Type=R+'/image',Target='media/'+name)
        styles = f'''<w:styles xmlns:w="{W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/><w:color w:val="193246"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:widowControl/><w:spacing w:after="130" w:line="285" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="1000" w:after="180"/></w:pPr><w:rPr><w:b/><w:sz w:val="70"/><w:color w:val="087F8C"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="450"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:pageBreakBefore/><w:spacing w:after="260"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/><w:color w:val="087F8C"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="16"/><w:color w:val="526579"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="180"/><w:spacing w:after="90"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:fill="EDF3F6"/><w:spacing w:after="150" w:line="220" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="16"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="35" w:line="235" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="17"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:basedOn w:val="TableText"/><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Placeholder"><w:name w:val="Placeholder"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="526579"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TOCTitle"><w:name w:val="TOC Title"/><w:basedOn w:val="Heading1"/></w:style>
<w:style w:type="paragraph" w:styleId="TOCItem"><w:name w:val="TOC Item"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="165"/></w:pPr></w:style></w:styles>'''
        content_types = '''<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'''
        root_rels = f'''<Relationships xmlns="{REL}"><Relationship Id="rId1" Type="{R}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'''
        now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        core = f'''<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>HospedJá — Documento técnico Checkpoint 3</dc:title><dc:creator>Luiz Felipe Ferraresso; Joao Lucas; Vitor; Enzo; Igor</dc:creator><dc:language>pt-BR</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dc:description>Estado técnico em 16/11/2026, tecnologias, persistência, regras, evolução e evidências reais com legendas.</dc:description></cp:coreProperties>'''
        content_types = content_types.replace('</Types>','<Default Extension="png" ContentType="image/png"/></Types>')
        with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
            parts = {'[Content_Types].xml':content_types,'_rels/.rels':root_rels,'word/document.xml':ET.tostring(self.root,encoding='utf-8',xml_declaration=True),'word/styles.xml':styles,
                'word/_rels/document.xml.rels':ET.tostring(relationships,encoding='utf-8',xml_declaration=True),'word/footer1.xml':ET.tostring(footer,encoding='utf-8',xml_declaration=True),
                'word/settings.xml':f'<w:settings xmlns:w="{W}"><w:defaultTabStop w:val="360"/><w:compat/><w:proofState w:spelling="clean" w:grammar="clean"/></w:settings>', 'docProps/core.xml':core}
            for name,value in parts.items():
                if isinstance(value,str):
                    value=value.encode('utf-8')
                ET.fromstring(value)
                archive.writestr(name,value)
            for rel_id,name,data in self.images:
                archive.writestr('word/media/'+name,data)


def word_document(items,chapters):
    doc = WordDocument()
    doc.paragraph('HOSPEDJÁ',style='Title')
    doc.paragraph('Documento técnico consolidado\nCheckpoint 3',style='Subtitle')
    started = False
    evidence = 0
    for kind,value in items[1:]:
        if kind == 'heading':
            level,title=value
            if level == 2 and not started:
                doc.toc(chapters)
                started = True
            if level == 2:
                doc.paragraph(title,style='Heading1',bookmark='sec_'+title.split('.',1)[0])
            else:
                new_page = False
                if title.startswith('Evidência '):
                    evidence += 1
                    new_page = evidence > 1
                if title.startswith('Figura '):
                    new_page = True
                doc.paragraph(title,style='Heading2',page_before=new_page)
        elif kind in ('paragraph','list'):
            doc.paragraph(value,style='ListParagraph' if kind=='list' else 'Normal')
        elif kind == 'code':
            # Nao interpretar marcadores inline dentro de codigo.
            paragraph=doc.paragraph('',style='Code')
            paragraph.append(doc.run(value))
        elif kind == 'table':
            doc.table(value)
        elif kind == 'image':
            doc.image(*value)
        elif kind == 'print':
            number,label=value
            doc.table([[f'PRINT {number}\n\n{label}\n\nEspaço reservado · preenchimento pelo aluno']],placeholder=True)
    doc.save(OUTPUT.with_suffix('.docx'))


def print_pdf(browser):
    profile=ROOT.parent/'atualizacao-2026-11-16'/'document-browser-profile'
    profile.mkdir(parents=True,exist_ok=True)
    args=[str(browser),'--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-extensions',
          '--disable-background-networking','--disable-crash-reporter','--no-pdf-header-footer',
          '--user-data-dir='+str(profile),'--print-to-pdf='+str(OUTPUT.with_suffix('.pdf')),OUTPUT.with_suffix('.html').as_uri()]
    result=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
    pdf=OUTPUT.with_suffix('.pdf')
    if result.returncode or not pdf.exists() or pdf.stat().st_size<10000:
        raise RuntimeError('Falha ao gerar PDF: '+result.stderr[-1800:])
    print('PDF:',pdf,'bytes=',pdf.stat().st_size)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--pdf',action='store_true')
    parser.add_argument('--browser',type=Path,default=Path('C:/Program Files/Google/Chrome/Application/chrome.exe'))
    args=parser.parse_args()
    text=SOURCE.read_text(encoding='utf-8')
    items=blocks(text)
    chapters=[(value[1].split('.',1)[0],value[1]) for kind,value in items if kind=='heading' and value[0]==2]
    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.with_suffix('.html').write_text(html_document(items,chapters),encoding='utf-8')
    word_document(items,chapters)
    if '## 14. Passo a passo para produzir os prints\n' in text:
        guide=text.split('## 14. Passo a passo para produzir os prints\n',1)[1].split('## 15. Espaços reservados',1)[0]
        (ROOT/'docs/ROTEIRO_PRINTS_CHECKPOINT3.md').write_text('# Roteiro de prints — Checkpoint 3\n\nAtualização de 16/11/2026. Extraído do documento técnico consolidado.\n\n'+guide,encoding='utf-8')
    print('HTML:',OUTPUT.with_suffix('.html'))
    print('DOCX:',OUTPUT.with_suffix('.docx'))
    print('Secoes:',len(chapters),'imagens:',sum(kind=='image' for kind,_ in items),'espacos vazios:',sum(kind=='print' for kind,_ in items))
    if args.pdf:
        print_pdf(args.browser)


if __name__=='__main__':
    main()
