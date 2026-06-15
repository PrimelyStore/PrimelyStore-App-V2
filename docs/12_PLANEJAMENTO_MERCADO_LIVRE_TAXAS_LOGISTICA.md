# Planejamento de Taxas e Custos Logisticos do Mercado Livre (Fase 5.5L-6A)

## 1. Objetivo Exato
Planejar tecnicamente e de forma documental a futura integracao de custos de venda, comissoes e taxas logisticas do Mercado Livre (ML) para o modulo de precificacao e margem estimada do Primely Store. 

Nenhuma chamada real de rede e realizada nesta etapa documental, nenhuma Edge Function e implementada, e nenhum segredo e exposto ou lido de arquivos do repositorio ou do ambiente.

---

## 2. Arquivos Criados ou Alterados
- `docs/12_PLANEJAMENTO_MERCADO_LIVRE_TAXAS_LOGISTICA.md` (novo arquivo, este documento)
- `scripts/codex-responder-antigravity.ps1` (atualizado para forcar leitura e saida UTF-8)
- `docs/antigravity/STATUS_ATUAL.md` (atualizado)
- `docs/antigravity/HISTORICO_EXECUCOES.md` (atualizado)
- `docs/antigravity/RESPOSTA_ANTIGRAVITY.md` (atualizado)
- `docs/antigravity/PROXIMO_COMANDO.md` (atualizado)

---

## 3. Mapeamento de Custos Futuros a Considerar
Para obter a estimativa real de lucratividade nos canais do Mercado Livre, a futura orquestracao gerencial devera calcular:

### 3.1. Comissao (Commission)
- Depende do `category_id` (categoria do anuncio) e do `listing_type_id`:
  - **Classico** (`gold_special`): taxa percentual menor (e.g. 10% a 14% dependendo da categoria).
  - **Premium** (`gold_pro`): taxa percentual maior (e.g. 15% a 19%), mas com parcelamento sem juros para o comprador.

### 3.2. Tarifa Fixa (Flat Fee)
- Adicional fixo cobrado por unidade vendida de produtos de baixo custo (abaixo de R$ 79,00 atualmente no Brasil).
- Custo padrao atual: R$ 6,00 por item. Produtos acima de R$ 79,00 sao isentos desta tarifa fixa, mas obrigatoriamente exigem frete gratis pelo vendedor.

### 3.3. Custos Logisticos (Shipping Fees)
Dependem do tipo de envio (`shipping_mode`), modalidade (`logistic_type`) e caracteristicas fisicas:
- **Mercado Envios Full (Fulfillment)**:
  - Armazenado e despachado pelo centro de distribuicao do ML.
  - Custo de frete grates (co-participacao do vendedor com base no peso e dimensoes).
  - Tarifas adicionais de armazenagem mensal e retirada/descarte de estoque antigo (antiguidade de estoque), tratadas gerencialmente como custos operacionais periodicos.
- **Mercado Envios Flex (Same Day)**:
  - Logistica propria de entrega rapida.
  - O comprador paga uma taxa de frete fixa que e repassada pelo Mercado Livre ao vendedor na fatura. O vendedor repassa este valor para remunerar seu portador/motoqueiro local.
- **Mercado Envios Coleta / Normal**:
  - Despachado por transportadoras credenciadas.
  - Custo de frete grates baseado na tabela do Mercado Livre para a faixa de peso do produto, com descontos baseados na reputacao do vendedor.

### 3.4. Fatores de Lucratividade Gerencial
- **Custo do Produto (COGS)**: Custos de aquisicao originados do cadastro de custos locais.
- **Impostos (Tax)**: Aliquota do Simples Nacional configurada localmente (e.g. 4% sobre faturamento bruto). Este valor de 4% e meramente mockado/configuravel e exige validacao fiscal humana por contador ou gestor tributario antes de qualquer uso ou aplicacao em ambiente real.
- **Margem, Lucro e ROI**:
  - `Faturamento = Preco de Venda`
  - `Comissao Total = (Faturamento * Taxa Comissao) + Tarifa Fixa (se faturamento < 79)`
  - `Lucro Liquido = Faturamento - COGS - Impostos - Comissao Total - Custo Logistico`
  - `Margem Liquida = Lucro Liquido / Faturamento`
  - `ROI (Retorno sobre Investimento) = Lucro Liquido / COGS`
- **Preco Minimo Recomendado**: Preco calculado para atingir break-even (lucro zero) ou uma margem minima de lucro definida pelo gestor.

---

## 4. Informacoes Futuras da API do Mercado Livre
A futura Edge Function `mercadolivre-fees-quote` podera consultar os endpoints oficiais:
- **/sites/{site_id}/listing_prices**: para estimar a comissao de acordo com o preço, categoria e tipo de anuncio.
- **/users/{user_id}/shipping_options**: simulador de custos logisticos de acordo com peso, dimensoes, reputacao do vendedor e tipo logistico.
- **/categories/{category_id}**: validacao de regras e tarifas minimas exigidas por categoria.

---

## 5. Informacoes Configuraveis Localmente (Fallbacks)
Quando as chamadas de API falharem, ou para fins de simulacao rapida, a aplicacao dependera de tabelas e matrizes locais:
- **Tabela de Fretes de Fallback**: Matriz local de frete Mercado Envios por faixas de peso gerenciais (e.g. 0-0.5kg, 0.5-1kg, etc.).
- **Desconto por Reputacao**: Flag para setar o status do termometro da conta (e.g., Lojas Oficiais/Mercado Lideres Platinum recebem 50% de desconto no frete gratis; contas sem medalhas recebem menos).
- **Aliquota de Imposto**: Configurada pelo gestor para o calculo da margem.

---

## 6. Variaveis de Ambiente Futuras (Apenas Nomes)
Nenhum valor real e inserido aqui ou no repositorio. As chaves necessarias no Supabase Vault serao:
- `MERCADO_LIVRE_CLIENT_ID`
- `MERCADO_LIVRE_CLIENT_SECRET`
- `MERCADO_LIVRE_REFRESH_TOKEN`
- `MERCADO_LIVRE_API_ENDPOINT`

---

## 7. Riscos de Seguranca
- **Vazamento de Tokens**: Tokens de acesso OAuth do Mercado Livre expiram a cada 6 horas. O refresh token dura ate 180 dias. Qualquer vazamento nos logs representaria sequestro de conta. A mitigacao exige sanitizacao rigorosa em blocos try-catch e execucao estritamente no backend (Edge Functions), nunca no browser.

---

## 8. Riscos de Negocio
- **Discrepancia de Pesos**: Divergencias entre o peso gerencial cadastrado e o peso cubico faturado pelo Mercado Livre nas agencias. Isso pode gerar margens negativas inesperadas. A tela de precificacao deve exibir alertas de auditoria quando o frete cobrado diferir do frete simulado.
- **Flutuacao de Reputacao**: Uma queda na reputacao da conta reduz o desconto do frete grates de 50% para 40% (ou menos), elevando o custo de frete instantaneamente.

---

## 9. Criterios de Aceite da Futura Integracao
1. CRUD funcional para cadastro de dados do Mercado Livre na aba Mapeamento.
2. Edge Function `mercadolivre-fees-quote` executando chamadas de simulação e gravando log em `marketplace_fee_quotes`.
3. Sanitizacao de logs de erro impedindo o vazamento de tokens nas tabelas de auditoria do Supabase.
4. Fallback local ativo para calculo de taxas por matriz quando a API estiver inoperante.

---

## 10. Rollback da Fase e Funcionalidade
- Exclusao dos arquivos da Edge Function `supabase/functions/mercado-livre-fees-quote/index.ts` e `index.test.ts` criados nesta fase.
- Execucao de `git checkout` para reverter as alteracoes nos arquivos de controle (`ROADMAP.md`, `TASKS.md`, `docs/12_PLANEJAMENTO_MERCADO_LIVRE_TAXAS_LOGISTICA.md` e a pasta `docs/antigravity/`).

---

## 11. Implementacao Realizada (2026-06-12)
Os helpers mockados, a Edge Function e testes locais offline Deno foram implementados com sucesso:
- Fase 5.5L-6B/C (Helpers e Testes Offline):
  - Helpers criados: `_helpers_ml_fees.ts` e `_helpers_ml_shipping.ts`.
  - Testes criados: `_helpers_ml_fees.test.ts` e `_helpers_ml_shipping.test.ts`.
- Fase 5.5L-6D (Edge Function mockada):
  - Criada a Edge Function mockada com handler testavel: `index.ts`.
  - Testes de integracao HTTP offline criados: `index.test.ts`.
- Total de testes passando com sucesso: 33 testes (20 unitarios dos helpers e 13 de integracao HTTP do handler) 100% offline, sem rede, sem secrets e sem deploy.
- Nota de Seguranca: O CORS utiliza origem wildcard "*" apenas no mock local para facilitar testes, estando proibido para producao.

---

## 12. Planejamento da Integracao Frontend/Simulador (Fase 5.5L-6E)

### 12.1. Objetivo da Fase 5.5L-6E
Planejar de forma puramente documental como a interface do simulador de precificacao (`CustosMargem.tsx`) e a camada de servicos (`precificacaoService.ts`) consumirao localmente a Edge Function mockada `mercado-livre-fees-quote` no ambiente de desenvolvimento local, sem chamadas externas reais e sem deploy.

### 12.2. Escopo do Planejamento
Consiste na integracao logica entre a interface do simulador de custos e a Edge Function mockada local. O simulador podera obter calculos dinamicos de comissoes, tarifas fixas, custos de frete por peso/reputacao e break-even (preco minimo) diretamente do endpoint local da Edge Function.

### 12.3. Arquivos a Serem Alterados em Etapa Futura
* **[MODIFY] [CustosMargem.tsx](src/pages/CustosMargem.tsx)**: Para inclusao de estados, inputs especificos de simulacao do Mercado Livre (peso, reputacao, category_id, listing_type_id) e renderizacao dos resultados e warnings.
* **[MODIFY] [precificacaoService.ts](src/services/precificacaoService.ts)**: Criacao da funcao auxiliar de chamada local `simularTaxasMercadoLivreLocal(params)`.

### 12.4. Campos de Entrada no Simulador Mercado Livre
* **Preco de Venda Gerencial Simulado (R$)**
* **Custo do Produto (COGS) (R$)**
* **Peso Estimado (gramas)**: Numero inteiro nao negativo.
* **Reputacao da Conta**: Dropdown (`platinum`, `gold`, `silver`, `none`).
* **Categoria do Anuncio (category_id)**: Campo de texto (ex: `MLB12345`).
* **Tipo de Anuncio (listing_type_id)**: Classico (`gold_special`) ou Premium (`gold_pro`).

### 12.5. Campos Oriundos do Cadastro de Produtos (Auto-preenchimento)
* **Custo do Produto (COGS)**: Coletado da tabela `produtos_precificacao`.
* **Peso**: Coletado da tabela `produtos` (Pendente de Auditoria das colunas de dimensoes fisicas reais para verificar compatibilidade e necessidade de conversao de unidades).
* **Mapeamento do Anuncio**: Campos `category_id`, `listing_type_id` e `logistic_type` obtidos da tabela `produto_canal_marketplace_mapeamento` se o SKU estiver mapeado.
* **Aliquota de Imposto**: Obtida da aliquota padrao cadastrada na tabela `configuracoes_operacao` (Simples Nacional 4% por padrao). Esta aliquota de 4% e meramente mockada/configuravel no banco para testes locais, exigindo validacao fiscal humana antes de qualquer decisao comercial real.

### 12.6. Estrutura da Chamada a Edge Function e Modos de Autenticacao (Bloqueio de Integracao Real)

A integracao HTTP local real no frontend React esta **bloqueada** devido a restricoes de seguranca de autenticacao. O frontend React nao pode, em hipotese alguma, chamar diretamente a Edge Function atual usando os tokens internos `PRIMELY_INTERNAL_FUNCTION_TOKEN` ou `mock-valid-token`, para evitar que chaves privadas/internas sejam expostas de forma estatica no navegador ou em variaveis de ambiente publicas VITE do frontend.

A integracao HTTP local real com a Edge Function ficara suspensa ate que a Edge Function implemente a validacao segura de sessoes nativas do Supabase Auth (JWT do usuario) ou seja configurado um adaptador local seguro no backend que elimine a necessidade de exposicao de tokens no navegador.

Para viabilizar o desenvolvimento e testes, sao definidos tres fluxos isolados e independentes:

#### A. Testes HTTP em Memoria (Backend Deno)
* **Objetivo**: Validar a logica de calculo e rotas da Edge Function de forma isolada na suite de testes do Deno.
* **Mecanismo**: Os testes de integracao local em `index.test.ts` podem injetar o token temporario de teste (`mock-valid-token`) no cabecalho de autorizacao (`Authorization: Bearer mock-valid-token`) diretamente nas chamadas em memoria. Este mecanismo e exclusivo para testes em memoria do backend Deno e nao e exposto a rede ou ao frontend.

#### B. Testes Frontend com Fetch Mockado (React Vitest)
* **Objetivo**: Testar a interface React e seus loading/error/success states sem depender de conexoes HTTP reais e sem chamar nenhum endpoint local.
* **Mecanismo**: Utilizacao de Vitest e helpers de mock no frontend para interceptar o `fetch` global ou mockar o servico `precificacaoService.ts`, retornando diretamente respostas locais simuladas (fixtures JSON estaticas) correspondentes aos calculos de taxas e comissoes do Mercado Livre. Sem chamadas HTTP reais e sem tokens.

#### C. Futura Chamada HTTP Local Real (Bloqueada)
* **Status**: Bloqueada por seguranca.
* **Condicao para Desbloqueio**: A Edge Function devera ser modificada para aceitar e validar o JWT de sessao do usuario logado (obtida nativamente via `supabase.auth.getSession()`). Uma vez implementada esta autenticacao segura no backend, o frontend podera fazer a requisicao HTTP para o endpoint local (`http://127.0.0.1:54321/functions/v1/mercado-livre-fees-quote`) enviando o JWT nativo do usuario logado no cabecalho `Authorization: Bearer <JWT_SUPABASE>`.
* **Futuro Endpoint de Producao**: A chamada de producao utilizara o endpoint do projeto configurado dinamicamente via variaveis de ambiente seguras (por exemplo, `VITE_SUPABASE_URL` do projeto), nunca codificado de forma estatica.

* **Payload de Requisicao Futuro (Request Body)**:
  ```json
  {
    "mapeamento_id": "c826c03d-57a7-4eab-a833-7eac07eae29d",
    "preco_consultado": 100.00,
    "category_id": "MLB12345",
    "listing_type_id": "gold_special",
    "cogs": 50.00,
    "aliquota_imposto": 0.04,
    "peso_gramas": 800,
    "reputacao": "platinum"
  }
  ```

### 12.7. Estrutura Esperada dos Resultados Exibidos na Tela
* **Comissao**: Valor cobrado (R$) e percentual (ex: `R$ 10,00` - 10%).
* **Tarifa Fixa**: Tarifa fixa aplicada para itens < R$ 79,00 (ex: `R$ 6,00`).
* **Custo Logistico**: Valor do frete simulado com desconto de reputacao aplicado (ex: `R$ 11,00`).
* **Imposto Simples Nacional (4%)**: Valor absoluto calculado (ex: `R$ 4,00`). Esta aliquota de 4% e meramente mockada/configuravel, exigindo validacao fiscal humana antes de qualquer uso real.
* **Lucro**: Lucro liquido calculado (com cor dinamica: verde para lucro, vermelho para prejuizo).
* **Margem**: Margem liquida estimada (percentual).
* **ROI**: Retorno sobre o investimento.
* **Preco Minimo Recomendado**: Break-even estimado sugerido para a operacao.
* **Warnings**: Array de avisos textuais sobre margens negativas ou preco abaixo do break-even.

### 12.8. Alerta Visual Obrigatorio na Interface Futura
A interface do simulador devera conter um banner informativo amarelado de destaque com a frase exata:
`"Calculos baseados em simulacao mockada/local. Validar custos e taxas reais antes de aplicar precos."`

### 12.9. O que Sera Mockado
* As tabelas e taxas de comissoes por categorias e custos logisticos de fretes por peso/reputacao serao fixtures locais na Edge Function, simulando a integracao com APIs reais.
* A autenticacao local sera simulada por injecao controlada de Bearer token nos testes em memoria.

### 12.10. O que NAO Sera Feito
* Nao serao feitas chamadas de rede para APIs oficiais externas do Mercado Livre ou da Amazon.
* Nao serao lidos segredos reais do `.env.local` nem chaves de API.
* Nao sera feito deploy na nuvem.
* Nao serao criadas tabelas, migrations ou executados comandos SQL.
* Nao sera alterado nenhum codigo frontend ou backend nesta fase documental.
* Nao havera duplicacao de calculo financeiro ou fallback de regra no React. Se a Edge Function falhar, a tela exibira um estado de erro sem recalcular taxas localmente.

### 12.11. Riscos Tecnicos
* **Vazamento de Tokens**: Risco de exposicao de credenciais privadas/internas no navegador. A mitigacao obrigatoria e o bloqueio total de integracao HTTP local direta no frontend ate que a autenticacao seja migrada para o JWT do usuario Supabase Auth no backend.
* **Falha de rede local**: Inoperabilidade do Supabase CLI local. A mitigacao exige que o service React capture a excecao de conexao e apresente um estado de erro visivel na interface para o usuario, sem tentar estimar taxas localmente com fallbacks que divirjam das regras da Edge Function.

### 12.12. Riscos de Negocio
* Flutuacoes de tarifas reais ou descontos de reputacao que divirjam do simulador mockado. A mitigacao e o Alerta Visual Obrigatorio instruindo o gestor a validar no portal oficial antes de mudar precos no ERP.

### 12.13. Rollback Documental
* Nenhuma restauracao manual, git checkout ou descarte de alteracoes nesta fase documental pode ocorrer sem confirmacao humana previa e explicita do usuario. Caso autorizado, os arquivos de controle alterados (`ROADMAP.md`, `TASKS.md`, `docs/12_PLANEJAMENTO_MERCADO_LIVRE_TAXAS_LOGISTICA.md` e a pasta `docs/antigravity/`) serao restaurados manualmente e os arquivos da Edge Function criados no commit anterior serao preservados na branch original de desenvolvimento.

### 12.14. Testes Futuros
* Criacao de testes unitarios em Vitest no frontend para interceptar o `fetch` HTTP local e simular cenarios de sucesso (200), payload malformado (400), nao autorizado (401) e erro interno (500).

### 12.15. Criterios de Aceite
1. O simulador deve possuir inputs especificos do Mercado Livre para peso e reputacao.
2. A chamada HTTP local real a Edge Function fica marcada como bloqueada por seguranca ate que a autenticacao por JWT do usuario Supabase Auth esteja estabelecida no backend.
3. Testes do frontend React devem usar estritamente fetch mockado em memoria (Vitest), sem realizar requisicoes a endpoints locais reais e sem utilizar nenhum token interno ou mockado no React.
4. O Alerta Visual Obrigatorio deve estar visivel na tela quando a simulacao Mercado Livre for ativada.
5. Em caso de falha da chamada HTTP para a function (quando desbloqueada), exibir estado de erro sem calculo duplicado local.
6. A aliquota do Simples Nacional de 4% utilizada nas simulacoes locais e um valor meramente mockado/configuravel, exigindo validacao fiscal humana antes de qualquer uso comercial real.

### 12.16. Garantias de Seguranca
* Confirmado que nao houve implementacao de codigo frontend, Edge Function, testes, commit, push, deploy, chamada de rede, segredos reais, migrations ou SQL destrutivo.

---

## 13. Implementacao do Simulador Mercado Livre Local/Mockado Independente no Frontend (Fase 5.5L-6F)
* **Objetivo**: Concluir a implementacao do simulador de precificacao mockado independente no frontend, habilitando o formulario e o calculo local em TypeScript de forma totalmente isolada.
* **Aprovacao da Decisao Humana Oficial (Opcao 1)**:
  O usuario confirmou explicitamente a Opcao 1, autorizando formalmente manter o simulador do Mercado Livre com formulas mockadas locais no frontend React, executadas de forma independente e sem chamada da Edge Function nesta etapa gerencial. Esta decisao humana substitui, para a Fase 5.5L-6F, a restricao documental anterior que exigia manter o formulario bloqueado ate existir autenticacao real no backend.

* **Regras da Decisao Aprovada**:
  1. A simulacao local pura em TypeScript esta autorizada por decisao humana para o ambiente normal de desenvolvimento local.
  2. A simulacao funciona de forma local sem Edge Function em execucao.
  3. A simulacao funciona localmente sem necessidade de Supabase CLI.
  4. A simulacao nao usa token, Authorization, JWT ou secret.
  5. A simulacao nao usa fetch ou chamada HTTP para a Edge Function local ou remota.
  6. A simulacao nao chama API real do Mercado Livre.
  7. As formulas, comissoes, fretes e impostos (4.0%) usam fixtures e regras mockadas locais codificadas em TypeScript no arquivo `src/services/precificacaoService.ts`.
  8. Os resultados calculados sao apenas estimativas gerenciais para apoiar a tomada de decisao.
  9. Os resultados nao sao apresentados como taxas oficiais do Mercado Livre.
  10. O frontend exibe permanentemente o aviso de governanca: `"Calculos baseados em simulacao mockada/local. Validar custos e taxas reais antes de aplicar precos."`
  11. A futura integracao oficial com Edge Function, Supabase Auth e API real sera tratada em outra fase do projeto.
  12. O simulador padrao existente foi preservado e continua funcionando normalmente.
  13. O imposto de 4% e configuravel no backend e serve como configuracao operacional padrao na simulacao, nao representando uma regra fiscal universal.
  14. Nenhum valor de comissao, tarifa, frete ou limite mockado localmente e tratado como regra oficial definitiva.

* **Resultados Finais de Validacao**:
  - 7 testes unitarios e de regressao offline do frontend aprovados no Vitest;
  - Build de producao concluido com sucesso em 289ms;
  - Git diff --check passa limpo (valida apenas whitespace, nao caracteres corrompidos).
  - As dependencias `vitest`, `jsdom`, `@testing-library/react` e `@testing-library/jest-dom` sao apenas `devDependencies` de desenvolvimento/teste.
  - O arquivo `AGENTS.md` foi alterado estritamente na Secao 3.1 para justificar tecnicamente o uso destas dependencias de teste.
  - Nenhum deploy, API real, secret, migration ou SQL foi utilizado.

* **Detalhamento das Correcoes Tecnicas**:
  1. **Auditoria e Reducao de Diff (CustosMargem.tsx)**: Restaurada a acentuacao portuguesa e os emojis originais das abas e footer do componente fora do bloco de simulador ML.
  2. **Validacao de Valores nao Finitos**: A funcao `simularTaxasMercadoLivreLocal` valida com `Number.isFinite` os inputs de preco de venda, custo do produto, aliquota de imposto, custos logisticos adicionais e peso em gramas, rejeitando NaN, Infinity e valores negativos inapropriados.
  3. **Testes Unitarios do Service**: Criado o arquivo `precificacaoService.test.ts` contendo 11 testes especificos cobrindo as faixas de preco de transicao (78.99, 79.00 e 79.01), break-even, margens negativas e rejeicao de nao finitos.
  4. **Erro Simplificado no Componente**: Removidos quaisquer termos de Supabase JWT, Edge Function indisponivel ou autenticacao de producao, retornando uma mensagem limpa e coerente com a execucao offline local.
  5. **Script de Auditoria**: Ajustado o script `scripts/codex-responder-antigravity.ps1` configurando a leitura e saida em UTF-8 no console do PowerShell, resolvendo a corrupcao textual.

---

## 14. Planejamento da Abstracao de Provedores de Taxas do Mercado Livre (Fase 5.5L-6G)

### 14.1. Objetivo do Planejamento
Desenhar uma arquitetura desacoplada para o simulador do Mercado Livre, permitindo que a interface do usuario (`CustosMargem.tsx`) consuma um provedor abstrato de calculos de taxas. Isso garante que, no futuro, o provedor em memoria possa ser substituido por uma chamada remota a uma Edge Function ou outra fonte oficial de calculos sem alterar o componente visual do frontend.

### 14.2. Interface Conceitual do Provedor (`MercadoLivreFeesProvider`)
Sera definida uma interface abstrata em TypeScript atuando como contrato para os calculos de taxas:
- **Interface**: `MercadoLivreFeesProvider` contendo o metodo `simularTaxas(input: SimulacaoMercadoLivreInput): Promise<SimulacaoMercadoLivreResultado>`.
- **Entrada (`SimulacaoMercadoLivreInput`)**: Parametros coletados do formulario (preco_venda, custo_produto, aliquota_imposto, peso_gramas, reputacao, category_id, listing_type_id, etc.).
- **Resposta (`SimulacaoMercadoLivreResultado`)**: Valores simulados e warnings de lucratividade (lucro_liquido, margem_liquida, roi, preco_minimo_recomendado, warnings, etc.).
- **Erros**: Qualquer excecao (validacao ou rede) deve ser traduzida em erro estruturado com mensagens amigaveis, sem expor informacoes tecnicas (JWT, endpoints, logs internos).

### 14.3. Provedores Conceituais
1. **`LocalMockMercadoLivreFeesProvider`**: Executa os calculos locais em memoria delegando temporariamente para a funcao pura preexistente `simularTaxasMercadoLivreLocal`.
2. **`EdgeFunctionMercadoLivreFeesProvider` (Apenas Conceitual)**: Provedor futuro para chamadas a Edge Function do Supabase. Este provedor **permanece apenas planejado**.
   - Nao sera criada nenhuma classe, arquivo, esqueleto de implementacao, fetch, URL, headers, JWT, token ou variavel de ambiente nesta fase.
   - Sua futura implementacao dependera de autenticacao segura por sessao JWT, configuracoes homologadas, testes offline, validacao das regras e autorizacao humana explicita.
   - Nota: A Edge Function atual tambem utiliza regras mockadas de comissao e frete, nao representando taxas oficiais do Mercado Livre. Uma futura fonte oficial exigira integracao e validacao fiscal humana posterior.

### 14.4. UI Desacoplada e Sem Conhecimento Interno
O componente `CustosMargem.tsx` nao contera nenhum conhecimento sobre:
- Formulas financeiras de comissao, tarifa fixa, ou descontos de reputacao.
- Fixtures, faixas de preco limite (R$ 79,00) ou tabelas logisticas de frete por peso.
- URL, fetch, headers, JWT, tokens ou detalhes de infraestrutura da Edge Function / Supabase.
- A UI interagira apenas com os tipos de entrada, resposta, loading, erro, warnings e dados exibidos na tela.

### 14.5. Selecao Segura do Provedor
Na primeira implementacao desta arquitetura:
- O provedor local sera o unico disponivel no sistema.
- A injecao do provedor sera explicita.
- Nao havera selecao automatica por sessao, existencia de token, URL ou variavel de ambiente `VITE_`.
- Nao havera fallback automatico para provedor remoto.
- A Factory inicial, se criada, retornara estritamente a instancia do provedor local.

### 14.6. Estrategia de Prevencao de Duplicidade
Nao havera importacao direta do mesmo modulo entre o runtime do React (Vite) e o runtime do Deno (Edge Function) nesta primeira fase.
- A integridade de formulas sera avaliada por contratos de entrada/saida equivalentes, compartilhamento de fixtures de casos de teste, testes de contrato e comparacao deterministica dos resultados mockados de testes offline. Testes de contrato detectam divergencias entre implementacoes, mas nao eliminam por si mesmos o risco de duplicacao de formulas.
- Qualquer compartilhamento fisico de codigo sera analisado em fase posterior para contornar limitacoes e diferencas de runtime.

### 14.7. Estrutura Futura de Arquivos (Sem criacao nesta fase)
Se confirmada a necessidade de evitar fragmentacao, a estrutura planejada sera:
- `src/services/mercadoLivreFees/types.ts`
- `src/services/mercadoLivreFees/MercadoLivreFeesProvider.ts`
- `src/services/mercadoLivreFees/LocalMockMercadoLivreFeesProvider.ts`
- `src/services/mercadoLivreFees/providerFactory.ts`
- `src/services/mercadoLivreFees/LocalMockMercadoLivreFeesProvider.test.ts`
- `src/services/mercadoLivreFees/providerContract.test.ts`

### 14.8. Compatibilidade Temporaria e Transicao Segura
Para garantir uma transicao livre de quebras:
- A funcao `simularTaxasMercadoLivreLocal` sera mantida intacta temporariamente.
- O novo provedor local delegara inicialmente a execucao para essa funcao existente.
- Somente em microfase posterior, a logica sera movida definitivamente para dentro do provedor, sem duplicar formulas no arquivo principal.
- A funcao antiga sera removida do modulo original apenas apos testes aprovados e confirmacao humana.

### 14.9. Estrategia de Testes Offline
- Testes unitarios do provedor local serao isolados e offline.
- Testes de contrato serao criados para comparar de forma deterministica os resultados.
- A pagina React sera testada com mock do provedor, simulando estados de sucesso, loading e erro sem realizar conexoes HTTP ou depender de rede.

### 14.10. Riscos Identificados e Mitigacoes
- **Divergencia entre Mock e Real**: Mitigado pelo banner visual obrigatorio e instrucoes ao gestor.
- **Duplicacao de Regras**: Mitigado por testes de contrato com payloads identicos de teste no frontend e backend.
- **Uso Acidental de Provedor Remoto**: Mitigado pelo bloqueio completo de rotas e factory restrita a local.
- **Exposicao de Credenciais**: Mitigado pelo desacoplamento total da UI, impedindo passagem de tokens.
- **Quebra do Simulador Atual**: Mitigado por testes de regressao e compatibilidade temporaria.

### 14.11. Criterios de Aceite da Futura Implementacao
1. Criacao da interface `MercadoLivreFeesProvider` e factory inicial.
2. Provedor local retornando calculos corretos via delegacao a funcao existente.
3. Componente `CustosMargem.tsx` refatorado para usar o provedor por meio de seu contrato, sem conhecer formulas ou URLs.
4. Preservacao de todos os comportamentos visuais (formulario, banner, loadings, erros, warnings, break-even).
5. Todas as suites de testes Vitest relacionadas ao simulador, provider e componente passando offline com sucesso.
6. Build de producao compilado sem erros.

### 14.12. Plano de Rollback da Abstracao
O procedimento de rollback serve apenas como referencia tecnica e nunca deve ser executado de forma automatica ou sem confirmacao humana explicita.
Se a refatoracao apresentar problemas na implementacao:
- Apresentar o diff stat detalhado das alteracoes da microfase.
- Solicitar confirmacao humana previa e explicita.
- Restaurar ou reverter apenas os arquivos autorizados da microfase (nunca descartar alteracoes nao relacionadas ou de outras branches).

### 14.13. Criterios de Aceite da Fase 5.5L-6G.1
Esta microfase e exclusivamente documental e de planejamento conceitual.
- Arquitetura de provedores documentada conceitualmente.
- Provedor local mockado como o unico disponivel e autorizado para a primeira implementacao.
- Provedor remoto (Edge Function) documentado apenas de forma conceitual, sem esqueleto de codigo ou configuracao.
- Estrategia de migracao planejada sem duplicacao de formulas e mantendo compatibilidade temporaria.
- Estrategia de testes offline e de contrato documentada.
- Riscos e plano de rollback documental explicitamente mapeados.
- Nenhuma alteracao em arquivos `.ts`, `.tsx`, JSON, configuracoes ou dependencias do projeto.
- Nenhum stage (`git add`), commit, push ou deploy realizado.

### 14.14. Divisao de Microfases Recomendadas
A Fase 5.5L-6G fica formalmente dividida nas seguintes microfases:
- **5.5L-6G.1**: Planejamento documental e formalizacao (Esta etapa atual).
- **5.5L-6G.2**: Criacao dos tipos TypeScript e definicao da interface do provedor de calculo de taxas do Mercado Livre.
- **5.5L-6G.3**: Criacao do provedor local mockado (`LocalMockMercadoLivreFeesProvider`) que delegara a execucao para a funcao pura preexistente `simularTaxasMercadoLivreLocal`.
- **5.5L-6G.4**: Injecao explicita do provedor local no componente visual `CustosMargem.tsx`.
- **5.5L-6G.5**: Implementacao de testes de contrato e testes de regressao para garantir que o provedor retorne o mesmo resultado do simulador anterior.
- **5.5L-6G.6**: Extracao final da logica de calculo de dentro da funcao antiga para o novo provedor local e remocao da funcao de compatibilidade temporaria (apenas apos testes e aprovacao humana).
- **Fase remota futura separada**: Planejamento e implementacao do provedor remoto baseado em Edge Function do Supabase (sem data ou autorizacao na fase atual).

---

## 15. Implementacao da Fase 5.5L-6G.2 (Tipos e Interface TypeScript)
* **Objetivo**: Criar os contratos TypeScript e a interface do provedor de calculo de taxas do Mercado Livre (`MercadoLivreFeesProvider`), sem implementar calculos ou alteracoes em codigo funcional.
* **Arquivos Criados**:
  - `src/services/mercadoLivreFees/types.ts`
  - `src/services/mercadoLivreFees/MercadoLivreFeesProvider.ts`
* **Estrategia Adotada**:
  - Reutilizacao total dos tipos do formulador e resultado (`SimulacaoMercadoLivreInput`, `SimulacaoMercadoLivreResultado`, `SimulacaoMercadoLivreWarning`) via `import type` a partir de `../precificacaoService.ts`, evitando qualquer duplicidade fisica de codigo.
  - Criacao do tipo `MercadoLivreFeesProviderSource` para definir a origem da simulacao ('local_mock' | 'edge_function' | 'official_api') e estender o resultado de simulacao original via intersecao de tipos para rastrear essa origem.
  - Interface `MercadoLivreFeesProvider` definida de forma independente, assincrona, e sem acoplamento a rede, banco, Supabase ou React.
* **Validacoes locais**:
  - Suite de 18 testes Vitest passou com sucesso.
  - Build de producao executado e aprovado sem erros.
  - Nao foram encontrados termos proibidos (fetch, http, supabase, JWT, etc.) nos novos arquivos.
  - Nenhuma alteracao realizada em codigo funcional ou configuracoes existentes.

---

## 16. Implementacao da Fase 5.5L-6G.3 (Provedor Local Mockado Concreto)
* **Objetivo**: Criar o provedor local concreto `LocalMockMercadoLivreFeesProvider` delegando as chamadas para a funcao de calculo preexistente `simularTaxasMercadoLivreLocal`, sem duplicidade de formulas.
* **Arquivos Criados**:
  - `src/services/mercadoLivreFees/LocalMockMercadoLivreFeesProvider.ts`
  - `src/services/mercadoLivreFees/LocalMockMercadoLivreFeesProvider.test.ts`
* **Estrategia Adotada**:
  - A classe concreta implementa `MercadoLivreFeesProvider` e possui `id: 'local_mock'`.
  - As chamadas de simulacao sao repassadas integralmente para `simularTaxasMercadoLivreLocal`.
  - O resultado retornado e estendido para incluir `provider_source: 'local_mock'`.
  - Erros e excecoes sao propagados de forma nativa e transparente.
* **Validacoes locais**:
  - Suite local com 28 testes Vitest (incluindo 10 testes especificos de regressao para o provider local mockado) passou com sucesso.
  - Build de producao executado e aprovado sem erros.
  - Nao foram encontrados termos proibidos (fetch, http, supabase, JWT, etc.) nos novos arquivos.
  - Nenhuma alteracao realizada em codigo funcional ou configuracoes existentes.
