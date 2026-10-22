"""Somente dados SINTÉTICOS interceptados no navegador. Nenhum placar é publicado."""
import json
import os
import shutil
import re
import threading
import unittest
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
UFS = 'rr ap am pa ac ro to ma pi ce rn pb pe al se ba mt ms go df mg es rj sp pr sc rs'.split()


def result(uf='br', lula=600, flavio=400, turn='2'):
    stamp = datetime.now(timezone(timedelta(hours=-3))) - timedelta(minutes=5)
    total = lula + flavio
    return {'ele': '6258' if turn == '2' else '6257', 't': turn, 'uf': uf,
            'dt': stamp.strftime('%d/%m/%Y'), 'ht': stamp.strftime('%H:%M:%S'),
            's': {'pst': '50,00', 'st': '5', 'ts': '10'},
            'e': {'te': '2000', 'est': '1000', 'c': str(total)}, 'and': 'p',
            'carg': [{'cd': '0001', 'agr': [{'par': [{'sg': 'TESTE', 'cand': [
                {'n': '13', 'nmu': 'LULA', 'vap': str(lula), 'pvap': str(100*lula/total if total else 0)},
                {'n': '22', 'nmu': 'FLÁVIO BOLSONARO', 'vap': str(flavio), 'pvap': str(100*flavio/total if total else 0)}
            ]}]}]}]}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class PanelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}/'
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'), headless=True, args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.mode = 'ok'
        self.bad_uf = None
        self.count = 0
        self.city_error = False
        self.tie = False
        self.changed = False
        self.config_calls = 0
        self.held_routes = []
        self.requests = []
        self.context.route('https://resultados.tse.jus.br/**', self.route)
        self.page.add_init_script("""document.addEventListener('DOMContentLoaded',()=>{const el=document.createElement('div');el.textContent='TESTE AUTOMATIZADO — DADOS SINTÉTICOS';el.style.background='#733';document.body.prepend(el)})""")

    def tearDown(self):
        for route in self.held_routes:
            try:
                route.abort()
            except Exception:
                pass
        self.context.close()
        self.assertEqual(self.errors, [])

    def route(self, route):
        url = route.request.url
        self.requests.append(url)
        if url.endswith('ele-c.json'):
            self.config_calls += 1
            if self.mode == 'network':
                route.abort('failed')
                return
            if self.mode == 'config_once' and self.config_calls == 1:
                route.fulfill(status=503, body='Indisponível')
                return
            data = {'pl': [{'e': [] if self.mode == 'unavailable' else [{'cd': '6258', 't': '2'}]}]}
        elif '/ele2022/' in url:
            data = {'ele': '544', 't': '2', 'cand': [{'n': '13', 'vap': '500', 'pvap': '50,00'}, {'n': '22', 'vap': '500', 'pvap': '50,00'}]}
        elif '/config/mun-' in url:
            data = {'abr': [{'cd': uf, 'mu': [{'cd': str(i+1).zfill(5), 'nm': f'Município fictício {i+1}'} for i in range(7)]} for uf in UFS]}
        else:
            uf = re.search(r'/dados/([a-z]{2})/', url).group(1)
            municipal = re.search(r'/[a-z]{2}(\d{5})-c', url)
            first = '/6257/' in url
            if not first and not municipal and (self.mode == 'all_fail' or uf == self.bad_uf):
                route.fulfill(status=503, body='Indisponível')
                return
            if municipal:
                city = int(municipal.group(1))
                data = result(uf, city * 100, (8-city)*100)
                data['mun'] = municipal.group(1)
                if self.city_error and city == 1:
                    data['t'] = '1'
            else:
                data = result(uf, 700 if self.changed else 500 if self.tie else 600, 500 if self.tie else 400, '1' if first else '2')
            if first:
                data['carg'][0]['agr'][0]['par'][0]['cand'].append({'n': '99', 'nmu': 'CANDIDATO FICTÍCIO', 'vap': '200', 'pvap': '16,67'})
            if not first and self.mode == 'wrong_turn':
                data['t'] = '1'
            if not first and self.mode == 'malformed':
                data = {'ele': '6258', 't': '2', 'carg': []}
        route.fulfill(status=200, content_type='application/json', body=json.dumps(data))

    def open(self):
        self.page.goto(self.url)
        self.page.wait_for_function("!document.querySelector('#refresh').disabled && !document.querySelector('#status').textContent.includes('Consultando')")
        self.page.wait_for_selector('#geoMap path[data-uf]', state='attached')

    def refresh(self):
        self.page.locator('#refresh').click()
        self.page.wait_for_function("!document.querySelector('#refresh').disabled")

    def map(self):
        self.page.locator('[data-view="map"]').click()

    def test_success_map_states_clocks_and_navigation(self):
        self.open()
        self.assertIn('28/28', self.page.locator('#status').inner_text())
        self.assertEqual(self.page.locator('#geoMap path').count(), 27)
        self.assertEqual(self.page.locator('#geoMap .leader-lula').count(), 27)
        self.assertIn('5 min', self.page.locator('#kSilence').inner_text())
        self.assertIn('Brasília', self.page.locator('#kDate').inner_text())
        for view in ['map', 'history', 'polls', 'scenarios', 'live']:
            self.page.locator(f'[data-view="{view}"]').click()
            self.assertEqual(self.page.locator('.view.active').count(), 1)
        self.map()
        for uf in UFS:
            self.page.locator(f'#geoMap path[data-uf="{uf}"]').focus()
            self.page.keyboard.press('Enter')
            self.assertIn(f'({uf.upper()})', self.page.locator('#stateDetail').inner_text())
            self.assertIn('20,00 p.p.', self.page.locator('#stateDetail').inner_text())

    def test_unavailable_does_not_fetch_second_round(self):
        self.mode = 'unavailable'
        self.open()
        self.assertIn('não confirmado', self.page.locator('#status').inner_text())
        self.assertEqual(self.page.locator('#candidateList .cand').count(), 0)
        self.assertFalse(any('/6258/dados/' in u for u in self.requests))

    def test_configuration_unavailable_after_valid_result_disables_collection(self):
        self.open()
        self.mode = 'unavailable'
        self.refresh()
        self.map()
        self.assertTrue(self.page.locator('#loadCities').is_disabled())
        self.assertIn('Aguardando divulgação', self.page.locator('#munMessage').inner_text())
        self.assertEqual(self.page.locator('#lulaVotes').inner_text(), '600')
        self.assertIn('dados anteriores', self.page.locator('#dataStatus').inner_text())

    def test_network_failure_then_retry_configuration(self):
        self.mode = 'config_once'
        self.open()
        self.assertIn('Falha', self.page.locator('#status').inner_text())
        self.refresh()
        self.assertEqual(self.config_calls, 2)
        self.assertIn('28/28', self.page.locator('#status').inner_text())

    def test_wrong_turn_and_malformed_payload(self):
        for mode in ['wrong_turn', 'malformed']:
            with self.subTest(mode=mode):
                self.mode = mode
                self.open()
                self.assertIn('0/28', self.page.locator('#status').inner_text())
                self.assertEqual(self.page.locator('#candidateList .cand').count(), 0)

    def test_ties_never_color_a_winner(self):
        self.tie = True
        self.open()
        self.assertEqual(self.page.locator('#kLeader').inner_text(), 'Empate')
        self.assertEqual(self.page.locator('#geoMap .leader-lula').count(), 0)
        self.assertEqual(self.page.locator('#kStatesLula').inner_text(), '0')
        self.map()
        self.assertIn('Empate', self.page.locator('#stateDetail').inner_text())

    def test_refresh_without_idg_and_keep_previous_on_failure(self):
        self.open()
        self.changed = True
        self.refresh()
        self.assertEqual(self.page.locator('#lulaVotes').inner_text(), '700')
        self.mode = 'all_fail'
        self.refresh()
        self.assertEqual(self.page.locator('#lulaVotes').inner_text(), '700')
        self.assertIn('anteriores permanecem', self.page.locator('#dataStatus').inner_text())

    def test_partial_state_failure(self):
        self.bad_uf = 'pa'
        self.open()
        self.assertIn('27/28', self.page.locator('#status').inner_text())
        self.assertIn('1 UFs sem dados', self.page.locator('#dataStatus').inner_text())
        self.map()
        self.assertIn('Sem totalização', self.page.locator('#stateDetail').inner_text())

    def test_municipal_top5_and_invalidation(self):
        self.open()
        self.map()
        self.page.locator('#loadCities').click()
        self.page.wait_for_function("document.querySelector('#munProgress').textContent.includes('7/7')")
        self.assertEqual(self.page.locator('#topLula .cityLine').count(), 5)
        self.assertIn('fictício 7', self.page.locator('#topLula .cityLine').first.inner_text())
        self.assertIn('fictício 1', self.page.locator('#topFlavio .cityLine').first.inner_text())
        self.assertIn('Δ', self.page.locator('#topLula').inner_text())
        self.changed = True
        self.page.locator('[data-view="live"]').click()
        self.refresh()
        self.map()
        self.assertIn('desatualizado', self.page.locator('#munMessage').inner_text())

    def test_wrong_municipal_turn_is_partial(self):
        self.city_error = True
        self.open()
        self.map()
        self.page.locator('#loadCities').click()
        self.page.wait_for_function("document.querySelector('#munProgress').textContent.includes('6/7') && document.querySelector('#munProgress').textContent.includes('1 erros')")
        self.assertIn('parcial', self.page.locator('#munMessage').inner_text())
        self.assertNotIn('fictício 1\n', self.page.locator('#topFlavio').inner_text())

    def test_switch_state_clears_previous_rankings(self):
        self.open()
        self.map()
        self.page.locator('#loadCities').click()
        self.page.wait_for_function("document.querySelector('#munProgress').textContent.includes('7/7')")
        self.page.locator('#geoMap path[data-uf="sp"]').focus()
        self.page.keyboard.press('Enter')
        self.assertIn('São Paulo', self.page.locator('#munSubtitle').inner_text())
        self.assertEqual(self.page.locator('#topLula .cityLine').count(), 0)

    def test_mobile_desktop_no_document_overflow(self):
        self.open()
        for width in [320, 375, 390, 430, 1440]:
            self.page.set_viewport_size({'width': width, 'height': 844})
            for view in ['live', 'map', 'history', 'polls', 'scenarios']:
                self.page.locator(f'[data-view="{view}"]').click()
                self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, view))

    def test_automatic_refresh_and_unchanged_clock(self):
        self.page.clock.install()
        self.open()
        before = len(self.requests)
        self.page.clock.run_for(31000)
        self.page.wait_for_function("!document.querySelector('#refresh').disabled")
        self.page.clock.fast_forward(31000)
        self.page.wait_for_function("!document.querySelector('#refresh').disabled")
        self.assertGreater(len(self.requests), before)
        self.assertIn('1 min', self.page.locator('#kUnchanged').inner_text())

    def test_timeout_releases_refresh_button(self):
        self.page.clock.install()
        self.context.route('**/oficial/comum/config/ele-c.json', lambda route: self.held_routes.append(route))
        self.page.goto(self.url)
        self.page.clock.fast_forward(16000)
        self.page.wait_for_function("!document.querySelector('#refresh').disabled")
        self.assertIn('Falha', self.page.locator('#status').inner_text())
        self.assertIn('Nenhum arquivo não validado', self.page.locator('#dataStatus').inner_text())

    def test_switch_state_cancels_inflight_collection(self):
        self.open()
        self.map()
        self.page.locator('#loadCities').click()
        self.page.locator('#geoMap path[data-uf="sp"]').focus()
        self.page.keyboard.press('Enter')
        self.page.wait_for_timeout(500)
        self.assertIn('São Paulo', self.page.locator('#munSubtitle').inner_text())
        self.assertEqual(self.page.locator('#topLula .cityLine').count(), 0)
        self.assertFalse(self.page.locator('#loadCities').is_disabled())

    def test_simulator_controls_reset_and_official_score_is_unchanged(self):
        self.open()
        self.page.locator('[data-view="scenarios"]').click()
        self.page.wait_for_selector('#simControls input[data-field="flavio"]')
        before = self.page.locator('#simResult').inner_text()
        self.page.locator('#simControls input[data-field="flavio"]').fill('80')
        self.assertNotEqual(self.page.locator('#simResult').inner_text(), before)
        self.assertIn('SIMULAÇÃO HIPOTÉTICA', self.page.locator('#simResult').inner_text())
        self.assertEqual(self.page.locator('#lulaVotes').inner_text(), '600')
        self.page.locator('#resetSim').click()
        self.assertEqual(self.page.locator('#simResult').inner_text(), before)

    def test_geographic_failure_keeps_accessible_state_grid(self):
        self.context.route('**/assets/estados.geojson', lambda route: route.fulfill(status=200, content_type='application/json', body='{}'))
        self.page.goto(self.url)
        self.page.wait_for_function("document.querySelector('.geoFallback').open")
        self.map()
        self.assertEqual(self.page.locator('#tileMap .stateTile').count(), 27)
        self.page.locator('#tileMap [data-uf="sp"]').click()
        self.assertIn('São Paulo', self.page.locator('#stateDetail').inner_text())

    def test_unverified_poll_not_published(self):
        self.open()
        self.page.locator('[data-view="polls"]').click()
        self.assertIn('não verificada', self.page.locator('#pollCards').inner_text())
        self.assertEqual(self.page.locator('a[href*="datafolha"][href*="2026"]').count(), 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
