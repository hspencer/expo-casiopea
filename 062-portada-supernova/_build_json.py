# Construye cursos.json a partir de la respuesta cruda de la API SMW de Casiopea.
# Se usa una sola vez para generar el dataset estatico que consume el sketch 061.
import json, re

raw = json.load(open('_raw.json'))
res = raw['query']['results']
ANIO = 2026

def es_dis(carreras):
    return any('dise' in c.lower() for c in carreras)
def es_arq(carreras):
    return any('arquitectura' in c.lower() for c in carreras)

# Asigna cada curso a una de cinco orbitas concentricas.
def orbita(tipo, carreras):
    taller = 'taller' in tipo.lower()
    d, a = es_dis(carreras), es_arq(carreras)
    if d and a:           return 'otros'        # interdisciplinar
    if taller and a:      return 'talleres-arquitectura'
    if taller and d:      return 'talleres-diseno'
    if a:                 return 'cursos-arquitectura'
    if d:                 return 'cursos-diseno'
    return 'otros'

cursos = []
for titulo, item in res.items():
    p = item.get('printouts', {})
    anios = [int(x) for x in p.get('Año', []) if str(x).isdigit()]
    if anios and ANIO not in anios:
        continue
    n = len(p.get('Alumnos', []))
    if n == 0:
        continue
    carreras = [ (o.get('fulltext') if isinstance(o, dict) else o) for o in p.get('Carreras Relacionadas', []) ]
    carreras = [c for c in carreras if c]
    tipo = (str(p['Tipo de Curso'][0]) if p.get('Tipo de Curso') else 'Otro')
    profes = [ (o.get('fulltext') if isinstance(o, dict) else o) for o in p.get('Profesores', []) ]
    profes = [c for c in profes if c]
    # nombre limpio: saca el año del titulo
    nombre = re.sub(r'\s*\d{4}.*$', '', titulo).strip() or titulo
    cursos.append({
        'titulo': nombre,
        'tituloRaw': titulo,
        'alumnos': n,
        'tipo': tipo,
        'carreras': carreras,
        'profesores': profes,
        'url': item.get('fullurl', ''),
        'orbita': orbita(tipo, carreras),
    })

# orden de orbitas de adentro hacia afuera
ORDEN = ['talleres-arquitectura','talleres-diseno','cursos-arquitectura','cursos-diseno','otros']
cursos.sort(key=lambda c: (ORDEN.index(c['orbita']), -c['alumnos']))

out = {'anio': ANIO, 'orbitas': ORDEN, 'cursos': cursos}
json.dump(out, open('cursos.json','w'), ensure_ascii=False, indent=2)

from collections import Counter
print('cursos con alumnos:', len(cursos))
print(Counter(c['orbita'] for c in cursos))
print('rango alumnos:', min(c['alumnos'] for c in cursos), '-', max(c['alumnos'] for c in cursos))
for c in cursos[:8]:
    print(f"  [{c['orbita']:>22}] {c['alumnos']:>3}  {c['titulo']}")
