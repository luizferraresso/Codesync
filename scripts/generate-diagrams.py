"""Regenera DOT e draw.io editável a partir de diagramas/modelos.json.

PNG: dot -Tpng -Gdpi=120 diagramas/ARQUIVO.dot -o diagramas/previews/ARQUIVO.png
Com Graphviz disponível, --render regenera todos os PNGs automaticamente.
O Graphviz pode ser executado em contêiner; não é necessário alterar o host.
"""
from pathlib import Path
import json
import math
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'diagramas/modelos.json').read_text(encoding='utf-8'))
NODE_STYLE = ('rounded=1;whiteSpace=wrap;html=0;align=center;verticalAlign=middle;'
              'fillColor=#F6F8FB;strokeColor=#48637C;fontColor=#12253A;'
              'fontSize=14;fontFamily=Arial;spacing=12;arcSize=8;')
EDGE_STYLE = ('edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;'
              'jettySize=auto;html=0;endArrow=open;endFill=0;strokeColor=#53728D;'
              'strokeWidth=1.5;fontSize=12;fontFamily=Arial;labelBackgroundColor=#FFFFFF;')

for model in DATA['diagrams']:
    width, gap = 280, 60
    page_width = max(1000, max(map(len, model['rows'])) * (width + gap) + 40)
    levels, y = [], 60
    for row in model['rows']:
        height = max(100, max(len(node['label'].splitlines()) for node in row) * 23 + 32)
        x = (page_width - (len(row) * width + (len(row) - 1) * gap)) / 2
        levels.append([(node, x + index * (width + gap), y, width, height) for index, node in enumerate(row)])
        y += height + 120
    page_height = math.ceil(max(y, page_width * 1.1) / 10) * 10
    document = ET.Element('mxfile', host='app.diagrams.net', modified=DATA['updated']+'T00:00:00.000Z',
                          agent='HospedJa CodeSync', version='24.7.17', type='device')
    diagram = ET.SubElement(document, 'diagram', name=model['title'], id=model['file'])
    graph = ET.SubElement(diagram, 'mxGraphModel', dx=str(page_width), dy=str(page_height),
                          grid='1', gridSize='10', guides='1', tooltips='1', connect='1', arrows='1',
                          fold='1', page='1', pageScale='1', pageWidth=str(page_width),
                          pageHeight=str(page_height), math='0', shadow='0', background='#FFFFFF')
    cells = ET.SubElement(graph, 'root')
    ET.SubElement(cells, 'mxCell', id='0')
    ET.SubElement(cells, 'mxCell', id='1', parent='0')
    dot = ['digraph D {',
           'graph [rankdir=TB,bgcolor=white,ranksep="1.1",nodesep="0.6",pad="0.3",splines=polyline];',
           'node [shape=box,style="rounded,filled",fillcolor="#F6F8FB",color="#48637C",fontcolor="#12253A",fontname="DejaVu Sans",fontsize=12,margin="0.18,0.16"];',
           'edge [color="#53728D",fontcolor="#39546B",fontname="DejaVu Sans",fontsize=10,arrowsize=0.7];']
    for row in levels:
        dot.append('{rank=same; ' + '; '.join(json.dumps(node['id']) for node, *_ in row) + ';}')
        for node, x, node_y, node_width, height in row:
            cell = ET.SubElement(cells, 'mxCell', id=node['id'], value=node['label'], style=NODE_STYLE,
                                 vertex='1', parent='1')
            ET.SubElement(cell, 'mxGeometry', x=str(int(x)), y=str(node_y), width=str(node_width),
                          height=str(height), attrib={'as':'geometry'})
            dot.append(json.dumps(node['id']) + ' [label=' + json.dumps(node['label'],ensure_ascii=False) + '];')
    for index, edge in enumerate(model['edges'], 1):
        label = edge[2] if len(edge)>2 else ''
        cell = ET.SubElement(cells, 'mxCell', id=f'edge_{index}', value=label, style=EDGE_STYLE,
                             edge='1', parent='1', source=edge[0], target=edge[1])
        ET.SubElement(cell, 'mxGeometry', relative='1', attrib={'as':'geometry'})
        suffix = ' [label='+json.dumps(label,ensure_ascii=False)+']' if label else ''
        dot.append(json.dumps(edge[0])+' -> '+json.dumps(edge[1])+suffix+';')
    dot.append('}')
    ET.indent(document, space='  ')
    output = ROOT / 'diagramas' / model['file']
    ET.ElementTree(document).write(output.with_suffix('.drawio'),encoding='utf-8',xml_declaration=True)
    output.with_suffix('.dot').write_text('\n'.join(dot)+'\n',encoding='utf-8',newline='\n')
    print('Gerado:',model['file'])
    if '--render' in sys.argv:
        preview = ROOT / 'diagramas/previews' / (model['file']+'.png')
        preview.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run(['dot','-Tpng','-Gdpi=120',str(output.with_suffix('.dot')),'-o',str(preview)],check=True)
        print('Renderizado:',preview.name)
