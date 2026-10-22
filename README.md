# Painel Eleições 2026 — segundo turno

Aplicação estática em português, com placar nacional, mapa das 27 UFs, comparações históricas, rankings municipais e simulador de transferência de votos. Não requer npm, build, banco de dados ou credenciais.

## Executar

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory .
```

Abra a página pelo servidor HTTP; `file://` não é suportado para carregar a malha local. Os arquivos `index.html`, `styles.css`, `election-core.js`, `app.js` e `assets/estados.geojson` devem ser distribuídos juntos.

## Dados e limites

- A configuração pública do TSE precisa confirmar o identificador e o segundo turno antes das consultas de 2026. Os identificadores 6258/6257 e os caminhos EA20/EA12 vieram da versão anterior: **ainda precisam ser confrontados com arquivos oficiais acessíveis de 2026**. O painel não tenta adivinhar outro identificador ou usar um pleito anterior como substituto.
- Arquivos incompatíveis com eleição, turno, cargo presidencial, data de 2026, votos e percentuais são rejeitados. Metadados de UF/município, quando presentes, também são conferidos. Não há verificação criptográfica própria dos JSONs: a origem usa HTTPS do TSE.
- Atualização a cada 30 segundos, até quatro consultas simultâneas, timeout de 15 segundos e espera crescente até 300 segundos em falhas. A contagem de atualização pausa em abas ocultas; ao voltar, retoma a contagem restante. Reconexão de rede dispara nova tentativa.
- Falhas preservam os últimos dados válidos com seus horários e um aviso global. Cada UF com falha também mostra um aviso no detalhe. Uma resposta com horário anterior não substitui a totalização já recebida.
- O horário `dt/ht` do arquivo é exibido no fuso de Brasília (UTC−3), separado do horário da consulta. O contador de totalização usa esse horário; o contador de **mudança observada** usa os votos/percentuais/seções recebidos desde a primeira observação na sessão. Não mede mudanças anteriores à abertura da página. Relógio do dispositivo incorreto pode afetar os contadores.
- Top 5: consulta manual de todos os municípios da UF, três requisições simultâneas e pausa de 320 ms por trabalhador. Lista por votos absolutos positivos de cada candidato, com diferença em votos e p.p. sobre os válidos do município. Coleta parcial ou anterior à versão estadual atual recebe aviso. Coleta completa não equivale a fotografia simultânea: cada município informa seu horário. Mudar de UF cancela a coleta atual. A atualização municipal é manual para limitar carga no TSE.
- A pesquisa de 2026 sem confirmação foi retirada dos números e marcada como não verificada. Comparação e simulador permanecem disponíveis quando existe base válida. Referências históricas e pesquisas de 2018/2022 foram preservadas como referências estáticas do projeto, sem nova confirmação nesta revisão.
- O simulador é identificado como hipótese e não modifica o placar oficial. Nenhuma fixture de teste é carregada pela aplicação.

## Testes

Cálculos e validação (Node.js 24 usado nesta revisão):

```bash
node --test tests/core.test.cjs
```

Testes de navegador (Python 3.12, Playwright 1.62.0 e Chromium):

```bash
python3 tests/browser_smoke.py
```

O ambiente usado já disponibiliza Playwright e `/usr/bin/chromium`. Em outra máquina, instale Playwright num ambiente virtual e disponibilize Chromium. O script usa `CHROMIUM_PATH` quando definido, Chromium do sistema quando encontrado ou o Chromium instalado pelo Playwright.

Todos os endpoints eleitorais dos testes são interceptados com dados **sintéticos**, explicitamente identificados no navegador. Os testes não publicam nem gravam placares na aplicação. Veja [revisão técnica e resultados](docs/revisao-tecnica.md).
