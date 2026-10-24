"""Fixtures sintéticas apenas neste teste; relógio controlado para cadência."""
import json,re,threading
from datetime import datetime,timezone
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
UFS='rr ap am pa ac ro to ma pi ce rn pb pe al se ba mt ms go df mg es rj sp pr sc rs'.split()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
mode='ok';revision=0;requests=[]
def result(uf,cd=''):
 return {'ele':'6258','t':'2','f':'o','cdabr':cd or uf,'idg':str(revision if uf in ['br','pa'] else 0),'and':'n' if mode=='waiting' else 'p','dt':'25/10/2026','ht':'18:00:00','s':{'pst':'50,00','st':'50','ts':'100'},'carg':[{'cd':'1','agr':[{'par':[{'cand':[{'n':'13','nmu':'LULA','vap':str(600+revision),'pvap':'60,00'},{'n':'22','nmu':'FLAVIO BOLSONARO','vap':'400','pvap':'40,00'}]}]}]}]}
def route(r):
 global requests
 url=r.request.url
 if 'resultados.tse.jus.br' not in url:r.abort();return
 requests.append(url)
 if url.endswith('ele-c.json'):d={'pl':[{'c':'ele2026','e':[{'cd':'6257','t':'1','cdt2':'6258'}]}]}
 elif '/6257/' in url or '/ele2022/' in url:r.fulfill(status=404,body='');return
 elif url.endswith('br-e006258-ab.json'):
  if mode=='tracker_fail':r.fulfill(status=500,body='');return
  d={'ele':'6258','t':'2','f':'o','abr':[{'tpabr':'uf','cdabr':uf,'and':'p','dt':'25/10/2026','ht':'18:00:00','s':{'st':revision if uf=='pa' else 0}} for uf in UFS]}
 elif '/config/mun-' in url:d={'abr':[{'cd':'pa','mu':[{'cd':'04707','nm':'CANAÃ DOS CARAJÁS'}]}]}
 else:
  m=re.search(r'/dados/(\w{2})/\w{2}(\d{5})?-c',url)
  if not m:r.fulfill(status=404,body='');return
  if mode=='blocked' and m.group(1)=='br':r.fulfill(status=429,headers={'Retry-After':'180','Access-Control-Expose-Headers':'Retry-After'},body='');return
  d=result(m.group(1),m.group(2) or '')
 r.fulfill(status=200,content_type='application/json',body=json.dumps(d))
def counts():
 return {uf:len([u for u in requests if '/6258/' in u and f'/dados/{uf}/{uf}-c' in u]) for uf in ['br',*UFS]}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://**/*',route);page.clock.install(time=datetime(2026,10,25,21,tzinfo=timezone.utc))
  page.goto(f'http://127.0.0.1:{server.server_port}/')
  page.wait_for_function("!document.querySelector('#refresh').disabled")
  assert page.locator('#timer').inner_text()=='10s'
  initial=counts();assert all(v==1 for v in initial.values()),initial
  stamp=page.locator('#kTime').inner_text()
  for second in range(1,10):
   page.clock.run_for(1000);assert page.locator('#timer').inner_text()==f'{10-second}s'
  page.clock.run_for(1000);page.wait_for_function("!document.querySelector('#refresh').disabled")
  c=counts();assert c['br']==2 and all(c[uf]==1 for uf in UFS),c
  assert page.locator('#kTime').inner_text()==stamp
  revision=1
  page.locator('[data-view="map"]').click()
  page.locator('#loadCities').click()
  page.wait_for_function("document.querySelector('#munProgress').textContent.includes('1/1')")
  progress=page.locator('#munProgress').inner_text()
  page.clock.run_for(10000);page.wait_for_function("!document.querySelector('#refresh').disabled")
  c=counts();assert c['pa']==2 and all(c[uf]==1 for uf in UFS if uf!='pa'),c
  assert 'Pará' in page.locator('#stateDetail').inner_text()
  assert page.locator('#topLula .cityLine').count()==1
  page.locator('[data-view="compare"]').click()
  page.locator('#cmpSearch').fill('preservar filtro')
  page.clock.run_for(10000);page.wait_for_function("!document.querySelector('#refresh').disabled")
  assert page.locator('#cmpSearch').input_value()=='preservar filtro'
  page.locator('[data-view="live"]').click()
  before=counts();page.locator('#refresh').click();page.wait_for_function("!document.querySelector('#refresh').disabled")
  after=counts();assert all(after[k]==before[k]+1 for k in before)
  mode='blocked';page.locator('#refresh').click();page.wait_for_function("!document.querySelector('#refresh').disabled")
  assert int(page.locator('#timer').inner_text().rstrip('s'))>=180, (page.locator('#timer').inner_text(),page.locator('#status').inner_text(),requests[-5:])
  before=len(requests);page.locator('#refresh').click();assert len(requests)==before
  assert page.locator('#kTime').inner_text()==stamp
  assert not errors,errors
  page.close()
  for scenario,interval in [('waiting',300),('tracker_fail',60)]:
   mode=scenario
   page=browser.new_page();page.route('https://**/*',route)
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.clock.install(time=datetime(2026,10,25,21,tzinfo=timezone.utc))
   page.goto(f'http://127.0.0.1:{server.server_port}/')
   page.wait_for_function("!document.querySelector('#refresh').disabled")
   assert page.locator('#timer').inner_text()==str(interval)+'s',scenario
   before=counts();page.clock.run_for(10000)
   assert counts()==before,scenario
   page.close()
  assert not errors,errors
  browser.close()
 print('PASS: 10→1s, Brasil 10s, UFs inalteradas dispensadas/PA alterado, ranking preservado, filtro preservado, botão manual, 429/Retry-After, horário oficial preservado; sem erros JS.')
finally:server.shutdown();server.server_close()
