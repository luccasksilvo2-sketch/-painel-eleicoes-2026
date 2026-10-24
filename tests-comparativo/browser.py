"""Dados artificiais exclusivamente neste teste. --official usa respostas HTTPS do TSE."""
import sys,json,re,threading,urllib.request
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=s.serve_forever,daemon=True).start()
official='--official' in sys.argv
seen=[]
def fixture(url):
 if url.endswith('ele-c.json'):return {'pl':[{'c':'ele2026','e':[{'cd':'6257','t':'1','cdt2':'6258','abr':[{'cp':[{'cd':'1'}]}]}]}]}
 if '/config/mun-' in url:return {'abr':[{'cd':uf,'mu':[{'cd':cd,'cdi':'1502152','nm':nm} for cd,nm in [('04707','CANAÃ DOS CARAJÁS'),('04278','BELÉM'),('04839','MARABÁ')]]} for uf in ['pa','sp','mg']]}
 if '-ab.json' in url:return {'ele':'6258','t':'2','f':'o','abr':[]}
 id='6257' if '/6257/' in url else '6258';scope=re.search(r'/([a-z]{2})(\d{5})?-c0001',url);cd=scope.group(2) or scope.group(1)
 votes=100 if id=='6257' else 120
 return {'ele':id,'t':'1' if id=='6257' else '2','f':'o','cdabr':cd,'and':'f','s':{'pst':'100,00','ts':'10','st':'10'},'dt':'25/10/2026','ht':'18:00:00','carg':[{'cd':'1','agr':[{'par':[{'cand':[{'nmu':'LULA','vap':str(votes),'pvap':'60,00'},{'nmu':'FLAVIO BOLSONARO','vap':'80','pvap':'40,00'}]}]}]}]}
def route(r):
 url=r.request.url;seen.append(url)
 try:
  if official:
   with urllib.request.urlopen(url,timeout=20) as response:body=response.read()
  else:body=json.dumps(fixture(url)).encode()
  r.fulfill(status=200,content_type='application/json',body=body)
 except Exception:r.fulfill(status=503,body='Indisponível')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  # Isola aba nova das consultas automáticas de outras abas.
  page.route('https://**/*',lambda r:r.abort())
  page.goto(f'http://127.0.0.1:{s.server_port}/')
  page.route('https://resultados.tse.jus.br/**',route)
  page.locator('[data-view=compare]').click()
  page.wait_for_function("document.querySelector('#cmpLoad').disabled === false && document.querySelector('#cmpBody').textContent.includes('CANAÃ')")
  assert page.locator('#cmpBody tr').count()==2
  assert 'Não foi possível' not in page.locator('#cmpMessage').inner_text()
  if official:
   text=page.locator('#cmpBody').inner_text();assert '16.676' in text and '33.546' in text
   assert 'Aguardando apuração' in text
  else:
   assert '+20' in page.locator('#cmpBody').inner_text()
   page.locator('#cmpCandidate').select_option('lula');assert page.locator('#cmpBody tr').count()==1
   page.locator('#cmpCandidate').select_option('both')
   with page.expect_download() as download:page.locator('#cmpCsv').click()
   assert download.value.suggested_filename=='comparativo-tse.csv'
   for uf in ['pa','sp','mg']:
    page.locator('#cmpState').select_option(uf)
    page.wait_for_function("!document.querySelector('#cmpLoad').disabled")
    page.locator('#cmpBatch').click()
    page.wait_for_function("!document.querySelector('#cmpBatch').disabled")
    assert '3/3 carregados' in page.locator('#cmpCoverage').inner_text()
    assert 'maiores ganhos' in page.locator('#cmpRanks').inner_text()
   page.locator('#cmpSearch').fill('MARABÁ');assert page.locator('#cmpBody tr').count()==2
  for w in [320,390,1440]:
   page.set_viewport_size({'width':w,'height':844})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),w
  for view in ['live','map','history','polls','scenarios','compare']:
   page.locator(f'[data-view="{view}"]').click();assert page.locator('.view.active').count()==1
  assert not errors,errors
  print('PASS:', 'oficial via HTTPS verificado' if official else 'sintético isolado', 'filtros, tabela, responsividade e seis abas; requisições:',len(seen))
  browser.close()
finally:s.shutdown();s.server_close()
