"""Offline structural verification of the consolidated academic deliverable.
This does not replace MySQL, Jest, Docker or AWS runtime checks.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import sys, re, zipfile, json, struct
from collections import Counter

root=Path(__file__).resolve().parents[1]
errors=[]
models={d['file']:d for d in json.loads((root/'diagramas/modelos.json').read_text(encoding='utf-8'))['diagrams']}
required=['README.md','CONTRIBUTING.md','database/01_schema.sql','database/02_seed.sql',
          'database/03_verificacao.sql','src/app.js','src/docs/openapi.yaml',
          'docs/MATRIZ_REQUISITOS_CP2.md','docs/REVISAO_GERAL.md',
          'docs/DIVISAO_EQUIPE_E_BACKLOG.md','entrega/HospedJa_Checkpoint3_Documento_Unico.pdf']
for item in required:
    if not (root/item).is_file():errors.append('Falta '+item)
for p in sorted((root/'diagramas').glob('*.drawio')):
    try:
        doc=ET.parse(p); rootxml=doc.getroot()
        assert rootxml.tag=='mxfile'
        diagrams=rootxml.findall('./diagram')
        assert len(diagrams)==1
        graph=diagrams[0].find('mxGraphModel')
        assert graph is not None and graph.attrib.get('background')=='#FFFFFF'
        assert int(graph.attrib['pageHeight']) >= int(graph.attrib['pageWidth'])
        cells=graph.findall('./root/mxCell')
        ids={c.attrib.get('id') for c in cells}
        assert len(ids)==len(cells), 'IDs duplicados'
        for c in cells:
            if c.attrib.get('edge')=='1':
                assert c.attrib.get('source') in ids and c.attrib.get('target') in ids
        model=models[p.stem]
        expected_nodes={node['id']:node['label'] for row in model['rows'] for node in row}
        actual_nodes={c.attrib['id']:c.attrib['value'] for c in cells if c.attrib.get('vertex')=='1'}
        assert actual_nodes==expected_nodes, 'Rotulos/nos drawio divergentes do modelo'
        expected_edges={(e[0],e[1],e[2] if len(e)>2 else '') for e in model['edges']}
        actual_edges={(c.attrib['source'],c.attrib['target'],c.attrib.get('value','')) for c in cells if c.attrib.get('edge')=='1'}
        assert actual_edges==expected_edges, 'Relacoes drawio divergentes do modelo'
        dot=p.with_suffix('.dot').read_text(encoding='utf-8')
        token=r'("(?:[^"\\]|\\.)*")'
        dot_nodes={json.loads(m[0]):json.loads(m[1]) for m in re.findall('^'+token+r' \[label='+token+r'\];',dot,re.M)}
        dot_edges={(json.loads(m[0]),json.loads(m[1]),json.loads(m[2]) if m[2] else '')
                   for m in re.findall(token+r' -> '+token+r'(?: \[label='+token+r'\])?;',dot)}
        assert dot_nodes==expected_nodes, 'Rotulos/nos DOT divergentes do modelo'
        assert dot_edges==expected_edges, 'Relacoes DOT divergentes do modelo'
        for c in cells:
            if c.attrib.get('vertex')!='1':continue
            g=c.find('mxGeometry'); assert g is not None
            assert float(g.attrib['x'])>=0 and float(g.attrib['y'])>=0
            assert float(g.attrib['x'])+float(g.attrib['width'])<=int(graph.attrib['pageWidth'])
            assert float(g.attrib['y'])+float(g.attrib['height'])<=int(graph.attrib['pageHeight'])
        png=(root/'diagramas/previews'/(p.stem+'.png')).read_bytes()
        assert png.startswith(b'\x89PNG\r\n\x1a\n') and png[12:16]==b'IHDR', 'PNG invalido'
        width,height=struct.unpack('>II',png[16:24]);assert width>0 and height>0
        print('OK drawio/DOT/modelo/PNG',p.name,len(cells),'cells',f'{width}x{height}')
    except Exception as e: errors.append(p.name+' inválido: '+str(e))
if len(list((root/'diagramas').glob('*.drawio')))!=6:
    errors.append('Quantidade de diagramas diferente de 6')
text=(root/'database/01_schema.sql').read_text(encoding='utf-8')
if len(re.findall(r'CREATE TABLE IF NOT EXISTS',text,re.I))!=40:errors.append('Schema diferente de 40 tabelas')
if (root/'package-lock.json').exists():print('package-lock presente')
else: print('PENDENTE package-lock.json, gerar com npm install local')
if not (root/'entrega/HospedJa_Checkpoint3_Documento_Unico.pdf').read_bytes().startswith(b'%PDF-'):
    errors.append('PDF inválido ou ausente')
print('Erros estruturais:',len(errors))
for e in errors:print('ERROR',e)
sys.exit(1 if errors else 0)
