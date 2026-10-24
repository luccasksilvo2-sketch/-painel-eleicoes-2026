# Comparativo 1º × 2º Turno

Aba nova integrada ao menu existente, sem substituir o painel, o timer ou suas cinco abas anteriores. Arquivos novos: `compare-core.js` (cálculos/validação), `compare.js` (dados/interface), `compare.css` (estilos). Não há dependências de produção, build, servidor adicional ou dados eleitorais embutidos.

## Uso

Ao abrir a aba, o exemplo é Canaã dos Carajás/PA. Escolha uma sugestão municipal exata e clique em Consultar seleção. Apague o município para consultar estado, região ou Brasil. O filtro de estado lista seus municípios no autocomplete; Carregar municípios da seleção consulta seus resultados de forma sequencial por localidade, com no máximo três requisições simultâneas. Brasil inclui exterior pelo arquivo nacional; agregados regionais somam UFs e ponderam percentuais por votos válidos e seções por quantidade de seções. Um agregado requer todas as UFs da região disponíveis.

Tabela de 20 linhas por página, busca textual, filtro por candidato, ordenação, gráfico de barras da página e CSV da seleção filtrada (não apenas da página). CSV inclui status, percentuais, seções e horários e protege contra fórmulas de planilha. Rankings municipais de dez ganhos e dez perdas por candidato, em votos ou percentual. Ranking estadual respeita localidades e candidato selecionados. A cobertura municipal é sempre explícita: rankings não são apresentados como nacionais completos.

Os votos parciais aparecem como PROVISÓRIOS. Diferenças e rankings só são habilitados quando **os dois turnos da localidade estão finalizados**, evitando quedas artificiais. Ausência de apuração aparece como indisponibilidade, não zero. Crescimento sobre base zero é indefinido (—); diferença absoluta continua calculável quando ambos finalizados. Diferença em p.p. utiliza os percentuais de válidos de cada turno.

## Fonte confirmada nesta sessão

Configuração: `https://resultados.tse.jus.br/oficial/comum/config/ele-c.json`.

No ciclo `ele2026`, cargo presidencial `1`, eleição `6257`, turno `1`, o campo **`cdt2: 6258`** confirma o vínculo com o segundo turno. Não se exige uma entrada independente de turno 2 antes de sua publicação.

Cadastros dos dois turnos: `/oficial/ele2026/{id}/config/mun-e{000000}-cm.json`. Usa-se `mu.cd` de cinco dígitos, nunca `mu.cdi` do IBGE. Os cadastros são cruzados por código eleitoral e código IBGE para identificar incompatibilidades entre turnos.

Resultados: `/oficial/ele2026/{id}/dados/{uf}/{uf}{municipio}-c0001-e{000000}-u.json`. Para estado/Brasil, omite-se o código municipal. Cada resposta é conferida por `f=o`, eleição, turno, cargo `1`, `cdabr`, candidatos por nome, votos inteiros e percentuais válidos.

Acompanhamento confirmado: `/oficial/ele2026/6258/dados/{uf}/{uf}-e006258-ab.json`. `abr` contém `tpabr=mun`, `cdabr`, status, seções e horário. Na atualização dos carregados, assinaturas dessas entradas orientam novas consultas. Quando o acompanhamento falha ou é incompatível, o código recorre aos resultados individuais. Mesmo sem alteração indicada, resultados municipais são rechecados no máximo a cada cinco minutos, evitando depender indefinidamente de acompanhamento atrasado.

Cache em memória: configuração 5 min, cadastro 1h, primeiro turno final 1h, resultados 30s. Atualização automática só na aba visível, a cada 30s; apenas localidades já carregadas. Timeout 15s, limite global de três requisições, pausa de 200ms entre localidades na coleta manual, botão para interromper a próxima localidade. Requisições em andamento terminam. Falhas preservam dados anteriores com aviso, e excluem a localidade dos rankings. Cache HTTP revalidado sem cabeçalhos personalizados; não requer credenciais. O TSE respondeu com CORS refletindo Origin em verificação HTTP.

Horários `dt/ht` são informados como Brasília. Arquivos não iniciados têm horário indisponível; `dg/hg` de geração não são apresentados como totalização. O tempo sem mudança é **observado desde o carregamento na sessão**, com base em votos/percentuais/seções; não pretende medir o período anterior à abertura da aba. Agregados regionais não inventam um horário oficial único: consulte os horários por UF na tabela.

## Validação

- `node --test tests-comparativo/core.test.cjs`: **9 testes passaram**, incluindo validação, elo cdt2, crescimento/queda final, percentuais, parcial/não iniciado, divisão por zero, código IBGE incorreto e agregado com cobertura integral.
- `python3 tests-comparativo/browser.py`: passou com **dados sintéticos isolados**. Filtros por candidato, três estados e três municípios por estado de teste, coleta, rankings, busca, CSV e seis abas. Responsividade em 320, 390 e 1440px; sem erros JavaScript.
- `python3 tests-comparativo/official.py`: passou com HTTPS validado e arquivos oficiais ao vivo de **PA, SP, MG, Canaã dos Carajás, Belém e Marabá**. Percentuais de primeiro turno confrontados com votos válidos, tolerância de arredondamento de 0,02 p.p. Nenhum resultado artificial incluído na aplicação.
- `python3 tests-comparativo/browser.py --official`: passou usando respostas obtidas por HTTPS validado do TSE, encaminhadas ao navegador pelo teste; Canaã exibe primeiro turno e aguarda o segundo. Esse teste não prova a cadeia TLS do Chromium nem constitui teste em iPhone real.

Códigos eleitorais municipais confirmados: Canaã `04707` (IBGE `1502152`), Belém `04278`, Marabá `04839`. Nos seis locais oficiais consultados: primeiro turno finalizado; segundo turno **não iniciado**, zero seções totalizadas e sem horário oficial. Portanto não foi possível conferir diferenças definitivas reais entre turnos. Ganhos/perdas e rankings finais foram exercitados somente nos testes sintéticos, que não são carregados pela página.

## Limitações e transparência

Safari/iPhone físico não testado; larguras móveis foram exercitadas no Chromium. Coleta nacional completa é demorada e manual, nunca automática nem simultânea em milhares de localidades. Tabela/gráfico/regiões podem combinar horários diferentes; arquivos individuais mantêm seus horários. Não é uma fotografia simultânea nacional.

Mudanças de votos não comprovam transferências individuais de eleitores. Abstenção, comparecimento e outras diferenças entre turnos alteram os totais. A observação aparece na própria aba.

Esta entrega preserva o código das abas antigas. Seus identificadores, pesquisas e tratamentos anteriores não foram reescritos nesta tarefa. Nenhuma implantação ou alteração direta de `main` foi realizada.
