# Planejamento de Taxas e Custos Logisticos do Mercado Livre (Fase 5.5L-6A)

## 1. Objetivo Exato
Planejar tecnicamente e de forma documental a futura integracao de custos de venda, comissoes e taxas logisticas do Mercado Livre (ML) para o modulo de precificacao e margem estimada do Primely Store. 

Nenhuma chamada real de rede e realizada nesta etapa documental, nenhuma Edge Function e implementada, e nenhum segredo e exposto ou lido de arquivos do repositorio ou do ambiente.

---

## 2. Arquivos Criados ou Alterados
- `docs/12_PLANEJAMENTO_MERCADO_LIVRE_TAXAS_LOGISTICA.md` (novo arquivo, este documento)
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
