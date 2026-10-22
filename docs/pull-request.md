O painel podia atribuir liderança em empates, manter dados municipais de outra UF e aceitar arquivos de eleição/turno incompatíveis. Esta revisão valida os arquivos recebidos do TSE, preserva dados válidos com avisos de falha, oferece mapa local das 27 UFs com votos e diferenças em p.p., e identifica a cobertura e a versão dos rankings municipais.

Também separa o horário oficial do tempo sem mudança observada, limita consultas e aplica timeout/backoff, melhora a navegação em telas pequenas e remove `index (1).html` após confirmar duplicação byte a byte. As cinco abas e o simulador foram preservados; a pesquisa não verificada de 2026 deixa de apresentar números como fatos.

Validação: 14 testes Node e 18 testes Playwright/Chromium passaram; cinco abas verificadas entre 320 e 1440 px. A execução sem mocks carregou as 27 UFs sem erros JavaScript. O TSE respondeu 403 pelo proxy, portanto IDs/caminhos e dados reais de 2026 ainda precisam de confirmação oficial. Testes usam exclusivamente dados sintéticos interceptados; nenhum resultado foi publicado ou implantado. Safari/iOS físico não foi testado.

Detalhes e pendências em `docs/revisao-tecnica.md`. Solicito revisão especialmente do contrato EA12/EA20 após liberação do domínio `resultados.tse.jus.br`. `main` permanece inalterada.
