"""Validação reproduzível com HTTPS e dados oficiais, sem fixtures sintéticas."""
import json,subprocess,urllib.request
base='https://resultados.tse.jus.br/oficial/'
def get(path):
 with urllib.request.urlopen(base+path,timeout=25) as r:return json.load(r)
config=get('comum/config/ele-c.json')
cat=get('ele2026/6257/config/mun-e006257-cm.json')
pa=next(a for a in cat['abr'] if a['cd']=='pa')
cities=[m for m in pa['mu'] if m['nm'] in ['CANAÃ DOS CARAJÁS','BELÉM','MARABÁ']]
assert len(cities)==3
assert next(m for m in cities if m['nm']=='CANAÃ DOS CARAJÁS')['cd']=='04707'
locations=[('pa','', 'Pará'),('sp','','São Paulo'),('mg','','Minas Gerais')]+[('pa',m['cd'],m['nm']) for m in cities]
samples=[]
for uf,cd,name in locations:
 data=[get(f'ele2026/{id}/dados/{uf}/{uf}{cd}-c0001-e{id.zfill(6)}-u.json') for id in ['6257','6258']]
 samples.append({'scope':cd or uf,'name':name,'data':data})
runner="""const fs=require('fs'),C=require('./compare-core');const input=JSON.parse(fs.readFileSync(0,'utf8'));C.config(input.config);for(const s of input.samples){const a=s.data.map((d,i)=>C.parse(d,i?'6258':'6257',s.scope));for(const key of ['lula','flavio']){const r=C.delta(...a,key);if(a[0].valid&&Math.abs(100*r.first/a[0].valid-r.pct1)>.02)throw Error('Percentual oficial inconsistente');if(!a[1].started&&r.diff!==null)throw Error('Queda artificial');console.log(s.name,key,JSON.stringify(r));}}"""
subprocess.run(['node','-e',runner],input=json.dumps({'config':config,'samples':samples}),text=True,check=True)
print('PASS: 3 municípios, 3 estados, códigos TSE e percentuais oficiais. Diferenças definitivas dependem da publicação/finalização do segundo turno.')
