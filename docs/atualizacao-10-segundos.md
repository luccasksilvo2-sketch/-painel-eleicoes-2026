# Atualização do placar em ciclos de 10 segundos

Branch: `atualizacao-10-segundos`, a partir da main `0079fa1`. Nenhuma implantação ou alteração direta da main.

## Comportamento

- Durante a apuração (`and=p`), consulta nacional em cada ciclo normal de 10s, contado após conclusão da rodada anterior. Requisições não se sobrepõem; latência e timeout podem alongar o ciclo.
- Contador superior sincronizado ao fim da consulta: 10, 9, 8…; durante a consulta exibe “Consultando…”. O timer da data da eleição permanece independente.
- Antes de iniciar, após finalizar ou quando a configuração ainda não confirma o pleito: 300s. Falhas sucessivas: 60, 120, 240 e 300s.
- HTTP 403/429: proteção mínima de 300s; HTTP 503: mínimo de 60s. `Retry-After` numérico ou data HTTP, quando exposto pelo CORS, pode ampliar o intervalo, inclusive além de 300s. Botão manual também respeita a proteção. Sem cabeçalho acessível, usa-se o intervalo conservador. Timeout de 15s por requisição; sem repetição imediata de falhas.
- “Atualizar agora” força consulta nacional, configuração e resultados das 27 UFs, salvo quando já há consulta em andamento ou proteção de rede vigente.
- Em aba oculta não inicia novos ciclos automáticos; ao voltar, consulta se o prazo expirou. Pedidos já iniciados terminam normalmente.
- `dt/ht` da última totalização continuam separados do horário local da consulta. Consultar de novo não reinicia o contador do horário oficial. Texto visível explica que consultar a cada 10s não significa publicação de votos a cada 10s.

## Acompanhamento TSE e economia de tráfego

Arquivo confirmado por HTTPS nesta sessão:

`https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-e006258-ab.json`

O acompanhamento nacional contém 27 entradas `tpabr=uf`, com `cdabr`, `and`, `dt/ht`, seções e eleitorado. A assinatura completa de cada entrada determina quais UFs mudaram. O parser confere eleição, turno, origem oficial e a presença única das 27 UFs. Não utiliza a URL inexistente com sufixo de cargo no acompanhamento nacional.

Depois da primeira carga, UFs inalteradas dispensam download do resultado detalhado. UFs novas, alteradas, com falha anterior ou sem conferência há cinco minutos são consultadas; limite de três pedidos estaduais simultâneos. A assinatura é aceita somente após resultado detalhado válido, para permitir repetir uma UF que falhou. Reconferência a cada cinco minutos cobre atrasos ou correções não refletidas imediatamente pelo acompanhamento.

Se o acompanhamento falha ou vem incompleto/incompatível, aplica backoff e usa rechecagem detalhada limitada a uma rodada por cinco minutos, ou por ação manual. Últimos resultados válidos são preservados com aviso de falha parcial. Resultado detalhado é validado por eleição, turno, origem oficial, cargo e UF.

Acompanhamento municipal já utilizado pela aba comparativa (EA15, `.../{uf}/{uf}-e006258-ab.json`) é preservado; a alteração usa o acompanhamento nacional por UF (EA14) para o placar. Não passa a baixar municípios a cada 10s. Coleta municipal continua manual e a aba comparativa mantém sua cadência e cache independentes.

## Preservação da interface

Atualizações de placar não chamam `renderAll`, não reconstroem o simulador/comparativo e não alteram os filtros. Atualizações estaduais preservam a UF selecionada, dados municipais, coleta em andamento e avisos de versão desatualizada do ranking. UFs com assinatura de resultado inalterada não causam redesenho do mapa. Sem mudanças, tampouco redesenha a lista nacional. A carga histórica de 2022 também passa a usar três trabalhadores em vez de 27 requisições simultâneas.

## Testes executados

- `node --test tests-live/policy.test.cjs`: **6 testes passaram** — normal/backoff, validade/cobertura do acompanhamento, decisão de reconsulta, assinatura/horário oficial, Retry-After e bloqueio do botão antes do prazo.
- `python3 tests-live/browser.py`: **passou**, com dados sintéticos isolados e relógio controlado. Sequência 10→1; Brasil a cada ciclo; 27 UFs iniciais, zero downloads estaduais quando inalteradas e apenas PA ao mudar sua assinatura; preservação do ranking municipal, seleção do mapa, filtro comparativo e horário oficial; botão força rodada; HTTP 429 protege consultas; espera de 300s antes de iniciar e backoff de 60s ao falhar acompanhamento; ausência de erros JavaScript.
- `node --test tests-comparativo/core.test.cjs`: **9 testes de regressão passaram**.
- `python3 tests-comparativo/browser.py`: **passou**, preservando seis abas, filtros, rankings, CSV e responsividade em 320/390/1440px.
- Acompanhamento oficial baixado por HTTPS foi aceito pelo parser com **27 UFs**. Não se afirma ter observado apuração real em andamento: a cadência e os erros foram exercitados com fixtures sintéticas separadas. Nenhum voto sintético é carregado pela aplicação.

Safari/iPhone físico não testado. O prazo de novas publicações pertence ao TSE; a alteração só controla consultas do navegador. Scripts adicionais `live-poll.js` precisam ser publicados junto com `index.html`.
