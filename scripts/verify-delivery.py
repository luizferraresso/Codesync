"""Check PDF content/layout and optionally render every page for visual review."""
from pathlib import Path
import argparse
import json
import re
import sys

import pymupdf
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]


def verify(pdf_path, render_dir=None):
    errors = []
    pdf = pymupdf.open(pdf_path)
    texts, images, thumbs = [], set(), []
    if render_dir:
        render_dir.mkdir(parents=True, exist_ok=True)
    for number, page in enumerate(pdf, start=1):
        text = page.get_text()
        texts.append(text)
        if len(text.strip()) < 50:
            errors.append(f'Página {number}: conteúdo textual insuficiente')
        if '\ufffd' in text:
            errors.append(f'Página {number}: caractere de substituição')
        for block in page.get_text('dict')['blocks']:
            if block['type'] != 0:
                continue
            for line in block['lines']:
                for span in line['spans']:
                    if not (page.rect + (-1, -1, 1, 1)).contains(pymupdf.Rect(span['bbox'])):
                        errors.append(f'Página {number}: texto fora da página')
        for link in page.get_links():
            if link['kind'] == pymupdf.LINK_GOTO and not 0 <= link['page'] < len(pdf):
                errors.append(f'Página {number}: destino interno inválido')
            if link['kind'] == pymupdf.LINK_URI and not link['uri'].startswith(('http://', 'https://')):
                errors.append(f'Página {number}: link externo não portável')
        images.update(item[0] for item in page.get_images())
        if render_dir:
            pix = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
            pix.save(render_dir / f'page-{number:02}.png')
            thumb = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
            thumb.thumbnail((300, 425))
            thumbs.append((number, thumb))

    combined = '\n'.join(texts)
    normalized = re.sub(r'\s+', ' ', combined)
    for required in ['28/10/2026', '90,09%', '142', '149', 'token_version',
                     '83,68%', '73,18%', '87,10%', 'best-effort', 'AWS',
                     '40803522140', '40803466021', '0c4aa05']:
        if required not in normalized:
            errors.append('Texto obrigatório ausente: ' + required)
    for prefix, count in [('RF', 35), ('RNF', 14)]:
        for i in range(1, count+1):
            if f'{prefix}{i:02}' not in combined:
                errors.append(f'Requisito ausente: {prefix}{i:02}')
    models = json.loads((ROOT / 'diagramas/modelos.json').read_text(encoding='utf-8'))['diagrams']
    for model in models:
        if model['file'] not in combined:
            errors.append('Diagrama sem legenda: ' + model['file'])
    if len(images) != 6:
        errors.append(f'Esperadas seis imagens de diagramas; encontradas {len(images)}')
    if len(pdf.get_toc()) != 19:
        errors.append('Sumário/marcadores incompletos')
    if 'Placeholder for table of contents' in combined:
        errors.append('Sumário não resolvido')
    # Compare embedded pixels with source PNGs, not just image count/signature.
    embedded = []
    for xref in images:
        pix = pymupdf.Pixmap(pdf, xref)
        if pix.colorspace.n != 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        embedded.append((pix.width, pix.height, pix.samples))
    for model in models:
        with Image.open(ROOT / 'diagramas/previews' / (model['file'] + '.png')) as png:
            rgb = png.convert('RGB')
            if (rgb.width, rgb.height, rgb.tobytes()) not in embedded:
                errors.append('Imagem embutida diverge do preview: ' + model['file'])

    if render_dir:
        for start in range(0, len(thumbs), 9):
            sheet = Image.new('RGB', (960, 1374), '#dce4eb')
            draw = ImageDraw.Draw(sheet)
            for i, (number, thumb) in enumerate(thumbs[start:start+9]):
                x, y = (i % 3)*320+10, (i // 3)*458+22
                sheet.paste(thumb, (x, y))
                draw.text((x, y-16), f'Pagina {number}', fill='#18334b')
            sheet.save(render_dir / f'contact-{start//9+1:02}.png')
        (render_dir / 'text.txt').write_text(combined, encoding='utf-8')
    result = {'pages': len(pdf), 'diagrams': len(images), 'bookmarks': len(pdf.get_toc()),
              'errors': errors, 'visual_review': 'Conferir as imagens renderizadas separadamente.'}
    if render_dir:
        (render_dir / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf', type=Path, default=ROOT / 'entrega/HospedJa_Checkpoint3_Documento_Unico.pdf')
    parser.add_argument('--render-dir', type=Path)
    args = parser.parse_args()
    sys.exit(verify(args.pdf, args.render_dir))
