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
- **Impostos (Tax)**: Aliquota do Simples Nacional configurada localmente (e.g. 4% sobre faturamento bruto).
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

## 10. Rollback Documental
- Exclusao do arquivo `docs/12_PLANEJAMENTO_MERCADO_LIVRE_TAXAS_LOGISTICA.md` e git checkout dos arquivos de controle alterados na pasta `docs/antigravity/`.
