# Revisão técnica — 22/10/2026

## Resultado e escopo

Revisão na branch `revisao-tecnica-segundo-turno`, baseada em `665ded9ae4404aab0ea6a4cdaa4837158856aa21`. Nenhuma alteração direta em `main` e nenhum resultado eleitoral publicado. Recursos existentes preservados: placar, evolução local, mapa e grade acessível, regiões/swing, rankings estaduais, estimativas, histórico, pesquisas e simulador.

O HTML agora referencia CSS e JavaScript separados, sem adicionar framework ou dependência de produção. `election-core.js` reúne funções puras compartilhadas pela aplicação e testes.

## Achados e correções

| Achado | Alteração |
| --- | --- |
| Ausência de validação uniforme nos arquivos nacionais, estaduais e municipais | Validação comum de eleição, turno, cargo, estrutura, identidades, votos, percentuais e data de 2026; conferência de UF/município quando informados |
| Falha de configuração podia ficar em cache por cinco minutos | Cache somente depois de resposta válida; nova tentativa após falha |
| Ausência de `idg` podia impedir atualização | Atualização de arquivos válidos a cada consulta e assinatura de conteúdo para invalidar rankings |
| Arquivo antigo podia substituir versão mais recente | Rejeição de `dt/ht` anterior ao último recebido |
| Número decimal em JavaScript podia perder o ponto decimal | Conversão que preserva valores numéricos e trata formatos brasileiros; percentuais fora de faixa rejeitados |
| Empate podia atribuir vitória ao primeiro candidato ordenado | Liderança neutra no mapa e indicação explícita de empate; nenhum vencedor com zero votos |
| Identificação de Flávio aceitava qualquer candidato de número 22 | Identificação por nome; ausência do candidato não vira zero municipal confirmado |
| Dependência de CDN e falha de certificado impediam mapa | Malha estática local com 27 siglas únicas, legenda, título descritivo por UF e interação por teclado |
| Detalhe estadual não informava diferença em p.p. | Votos, percentuais, diferença absoluta e em p.p.; horário da totalização estadual e aviso de falha |
| Consulta bem-sucedida era confundida com resultado atualizado | Horário de Brasília, relógio de totalização e contador distinto de mudança observada |
| Ranking podia aceitar outro turno e manter números da UF anterior | Validação municipal, limpeza ao trocar UF, cancelamento, desempate estável e indicação de cobertura/versão/horários |
| Espera de rede ilimitada e rajadas simultâneas | Timeout com AbortController, pool limitado, backoff, pausa em aba oculta e retomada online |
| Grade transformada e larguras mínimas prejudicavam celular | Grade flexível, contêineres com largura limitada, foco visível e controles com altura mínima de 44 px |
| Estimativas podiam extrapolar cobertura incompleta | Estimativa nacional exige 27 UFs com eleitorado; swing exige cobertura regional completa nos dois anos; regiões identificam cobertura parcial |
| Pesquisa de 2026 sem fonte confirmada aparecia como fato | Comparação de 2026 informa ausência de verificação; números e link não confirmados removidos |
| Histórico local antigo podia conter dados não validados | Nova chave de armazenamento e validação dos pontos antes de desenhar gráfico; eixo vertical cobre 0–100% |
| `index (1).html` duplicava integralmente o painel | Igualdade byte a byte confirmada antes da remoção; nenhuma referência interna encontrada; versão anterior permanece no Git |

## Validação executada

- **14 testes Node passaram**, sem falhas ou testes ignorados: conversão numérica, confirmação de configuração, cargo/eleição/turno, estrutura inválida, votos/percentuais, identidade duplicada, escopo municipal/estadual, datas/fuso, versões sem `idg`, ranking, milhares, ano incorreto e totalização antiga.
- **15 testes Playwright/Chromium passaram**, sem erros JavaScript: 27 UFs, votos/p.p., relógios, cinco abas, teclado em todas as UFs, indisponibilidade, falha/repetição de configuração, payload incompatível, empates, atualização sem `idg`, preservação em falha, cobertura parcial, Top 5/invalidação, turno municipal errado, troca/cancelamento de UF, atualização automática, timeout e pesquisa sem verificação.
- Responsividade: ausência de overflow horizontal do documento nas cinco abas em larguras de **320, 375, 390, 430 e 1440 px**. Inspeção visual do mapa a 390 px. São testes Chromium; **Safari/iPhone físico não foram testados**.
- Consulta sem mocks: o mapa local carregou **27 UFs**, sem erros JavaScript. A consulta real de configuração do TSE falhou por **403 do proxy de rede**; a interface exibiu indisponibilidade, sem inventar resultados.
- Git: branch separada e `git diff --check` sem erros.

## Pendências antes de uso eleitoral real

1. Liberar `resultados.tse.jus.br` na política de rede. Não são necessárias credenciais de API para esses endpoints públicos. Uma liberação de rede não garante que o pleito esteja publicado.
2. Conferir na configuração e documentação oficiais os IDs 6257/6258 e os caminhos EA12/EA20 de 2026. Foram mantidos como parâmetros existentes, não apresentados como identificadores confirmados nesta revisão. Em caso de divergência, ajustar o adaptador mediante evidência oficial e acrescentar testes com o formato confirmado.
3. Repetir validação real de Brasil, uma UF e municípios, incluindo cargo, escopo, horários, CORS e percentuais. Os mocks cobrem o contrato implementado, **não provam o formato atual do TSE**.
4. Conferir acessibilidade e comportamento em Safari/iOS real, especialmente seleção de UFs pequenas e navegação do cabeçalho.
5. Revalidar as fontes estáticas de pesquisas e históricos de 2018/2022 antes de apresentá-las como referências auditadas.

Nenhuma publicação ou implantação faz parte desta revisão. Os dados sintéticos existem exclusivamente na suíte de testes; a aplicação não possui modo de demonstração com votos artificiais.
