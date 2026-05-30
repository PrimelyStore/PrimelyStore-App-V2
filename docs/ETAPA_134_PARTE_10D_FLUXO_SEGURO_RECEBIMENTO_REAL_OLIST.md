# Etapa 134 — Parte 10D — Fluxo seguro de recebimento real de NFs Olist

## 1. Objetivo desta documentação

Este documento registra o fluxo seguro para liberar uma **Nota Fiscal de Entrada Olist** como **recebimento real** no sistema **Agentes Primely Store**.

A finalidade é deixar claro:

- como uma NF nova deve ser conferida;
- como identificar se ela está bloqueada;
- como liberar uma compra para recebimento real;
- como validar a liberação;
- como reverter a liberação em caso de erro;
- por que NFs antigas não devem ser liberadas por engano.

---

## 2. Contexto

O sistema já possui integração com Notas Fiscais de Entrada vindas do Olist.

Fluxo técnico atual:

```txt
Olist NF de entrada
↓
olist_notas_entrada_snapshot
↓
olist_notas_entrada_itens_snapshot
↓
processar_olist_notas_entrada_para_compras
↓
compras
↓
compras_itens
↓
compras_controle_recebimento
```

A conversão de NF para compra **não deve receber estoque automaticamente**.

O recebimento real só deve acontecer depois de conferência operacional.

---

## 3. Objetos principais envolvidos

Tabelas principais:

```txt
public.compras
public.compras_itens
public.compras_controle_recebimento
public.olist_notas_entrada_snapshot
public.olist_notas_entrada_itens_snapshot
```

Funções principais:

```txt
public.definir_controle_recebimento_compra(...)
public.validar_compra_para_recebimento(...)
public.receber_item_compra(...)
public.receber_compra(...)
public.gerar_lote_compra_item(...)
```

Trigger confirmada:

```txt
trg_aplicar_controle_recebimento_olist_nf
```

Tabela da trigger:

```txt
public.olist_notas_entrada_snapshot
```

Função executada pela trigger:

```txt
public.aplicar_controle_recebimento_olist_nf()
```

---

## 4. Classificações operacionais disponíveis

A tabela `compras_controle_recebimento` aceita as seguintes classificações:

```txt
recebimento_real
historico_fiscal_sem_entrada_estoque
pendente_conferencia_operacional
```

Significado prático:

```txt
recebimento_real
→ Compra liberada para recebimento.
→ bloqueia_recebimento = false

historico_fiscal_sem_entrada_estoque
→ Compra usada apenas para histórico fiscal.
→ Não deve gerar lote nem entrada de estoque.
→ bloqueia_recebimento = true

pendente_conferencia_operacional
→ Compra ainda precisa ser analisada antes de qualquer recebimento.
→ bloqueia_recebimento = true
```

---

## 5. Regra de segurança

Nenhuma NF de entrada do Olist deve gerar estoque automaticamente.

Antes de receber, é obrigatório conferir:

```txt
1. Se a NF é realmente nova.
2. Se a mercadoria ainda não entrou no estoque Primely.
3. Se os produtos estão vinculados corretamente.
4. Se as quantidades estão corretas.
5. Se a conversão de unidade está correta.
6. Se o custo unitário está correto.
7. Se os impostos que entram no custo estão corretos.
8. Se o local de destino da compra está correto.
9. Se a compra não representa apenas histórico fiscal.
```

---

## 6. Situação atual validada

Na auditoria da Etapa 134 — Parte 10C, foram localizadas apenas 3 compras Olist:

```txt
OLIST-NF-220525
OLIST-NF-224330
OLIST-NF-351272
```

As 3 estão classificadas como:

```txt
historico_fiscal_sem_entrada_estoque
```

E todas estão com:

```txt
bloqueia_recebimento = true
```

Conclusão:

```txt
Essas 3 NFs são históricas e não devem ser liberadas para recebimento real.
```

---

## 7. Fluxo correto para uma NF nova

Quando chegar uma NF nova real do Olist, o fluxo esperado é:

```txt
1. NF entra no Olist.
2. Sistema importa a NF para snapshot.
3. Sistema cria ou atualiza a compra no Primely.
4. Controle de recebimento bloqueia a compra inicialmente.
5. Usuário confere a NF e seus itens.
6. Usuário decide se a NF deve gerar estoque.
7. Se sim, libera como recebimento_real.
8. Sistema permite receber os itens.
9. Recebimento gera lote.
10. Recebimento gera movimentação de entrada no estoque.
```

---

## 8. Consulta para localizar a compra da NF nova

Quando uma NF nova aparecer, primeiro localizar a compra:

```sql
select
    c.id as compra_id,
    c.numero_pedido,
    c.numero_nota_fiscal,
    f.nome as fornecedor,
    c.status as status_compra,
    cr.classificacao_operacional,
    cr.bloqueia_recebimento,
    cr.motivo,
    cr.origem,
    cr.updated_at
from public.compras c
left join public.fornecedores f
    on f.id = c.fornecedor_id
left join public.compras_controle_recebimento cr
    on cr.compra_id = c.id
where c.numero_nota_fiscal = 'NUMERO_DA_NF_AQUI';
```

Substituir:

```txt
NUMERO_DA_NF_AQUI
```

pelo número real da nota fiscal.

---

## 9. Consulta para conferir os itens da compra

Antes de liberar o recebimento, conferir os itens:

```sql
select
    c.id as compra_id,
    c.numero_pedido,
    c.numero_nota_fiscal,
    p.sku,
    p.nome as produto,
    ci.quantidade,
    ci.quantidade_recebida,
    ci.quantidade - coalesce(ci.quantidade_recebida, 0) as quantidade_pendente,
    ci.custo_unitario,
    coalesce(ci.valor_impostos_item, 0) as imposto_custo_item,
    round(ci.quantidade * ci.custo_unitario, 2) as total_produto_item,
    round(
        (ci.quantidade * ci.custo_unitario)
        + coalesce(ci.valor_impostos_item, 0)
        + coalesce(ci.outros_custos_item, 0)
        - coalesce(ci.valor_desconto_item, 0),
        2
    ) as total_estimado_item,
    ci.status,
    ci.observacoes
from public.compras c
join public.compras_itens ci
    on ci.compra_id = c.id
left join public.produtos p
    on p.id = ci.produto_id
where c.id = 'COLE_AQUI_O_COMPRA_ID'::uuid
order by p.sku;
```

Verificar:

```txt
produto correto
SKU correto
quantidade correta
quantidade recebida zerada
quantidade pendente correta
custo unitário correto
impostos corretos
status pendente
observações de conversão/fiscal
```

---

## 10. Como liberar uma NF nova para recebimento real

Somente depois da conferência, liberar usando:

```sql
select public.definir_controle_recebimento_compra(
    'COLE_AQUI_O_COMPRA_ID'::uuid,
    'recebimento_real',
    'NF conferida operacionalmente e liberada para recebimento real. Mercadoria ainda não entrou no estoque Primely.',
    'etapa_134_parte_10d_liberacao_manual'
);
```

Essa chamada deve alterar a compra para:

```txt
classificacao_operacional = recebimento_real
bloqueia_recebimento = false
```

---

## 11. Como validar a liberação

Depois de liberar, conferir:

```sql
select
    c.id as compra_id,
    c.numero_pedido,
    c.numero_nota_fiscal,
    f.nome as fornecedor,
    c.status as status_compra,
    cr.classificacao_operacional,
    cr.bloqueia_recebimento,
    cr.motivo,
    cr.origem,
    cr.updated_at
from public.compras c
left join public.fornecedores f
    on f.id = c.fornecedor_id
left join public.compras_controle_recebimento cr
    on cr.compra_id = c.id
where c.id = 'COLE_AQUI_O_COMPRA_ID'::uuid;
```

Resultado esperado:

```txt
classificacao_operacional = recebimento_real
bloqueia_recebimento = false
```

---

## 12. Como fazer rollback se liberar por engano

Se a compra for liberada por engano, voltar para bloqueada:

```sql
select public.definir_controle_recebimento_compra(
    'COLE_AQUI_O_COMPRA_ID'::uuid,
    'pendente_conferencia_operacional',
    'Liberação revertida. Compra voltou para conferência operacional antes de qualquer recebimento.',
    'rollback_etapa_134_parte_10d'
);
```

Depois conferir novamente:

```sql
select
    c.id as compra_id,
    c.numero_pedido,
    c.numero_nota_fiscal,
    f.nome as fornecedor,
    c.status as status_compra,
    cr.classificacao_operacional,
    cr.bloqueia_recebimento,
    cr.motivo,
    cr.origem,
    cr.updated_at
from public.compras c
left join public.fornecedores f
    on f.id = c.fornecedor_id
left join public.compras_controle_recebimento cr
    on cr.compra_id = c.id
where c.id = 'COLE_AQUI_O_COMPRA_ID'::uuid;
```

Resultado esperado após rollback:

```txt
classificacao_operacional = pendente_conferencia_operacional
bloqueia_recebimento = true
```

---

## 13. O que nunca fazer sem conferência

Não liberar automaticamente como `recebimento_real`:

```txt
NF antiga
NF já recebida em outro momento
NF usada apenas como histórico fiscal
NF sem local de destino
NF com item sem produto vinculado
NF com unidade desconhecida
NF com custo divergente
NF com imposto divergente
NF com quantidade suspeita
```

---

## 14. Relação com recebimento, lote e estoque

Depois que uma compra estiver como:

```txt
classificacao_operacional = recebimento_real
bloqueia_recebimento = false
```

as funções de recebimento poderão permitir o fluxo:

```txt
receber_item_compra
↓
validar_compra_para_recebimento
↓
gerar_lote_compra_item
↓
entrada em estoque
↓
movimentação de estoque
```

O recebimento deve continuar sendo feito pelos fluxos já existentes do sistema.

---

## 15. Observação sobre NFs históricas

As NFs abaixo foram classificadas como histórico fiscal:

```txt
NF 220525
NF 224330
NF 351272
```

Elas permanecem como:

```txt
historico_fiscal_sem_entrada_estoque
bloqueia_recebimento = true
```

Essas NFs não devem ser recebidas, salvo revisão operacional específica, com backup e documentação do motivo.

---

## 16. Próximas melhorias recomendadas

Próximos passos recomendados para evoluir o fluxo:

```txt
1. Criar uma tela ou botão para liberar recebimento real com segurança.
2. Exibir visualmente a classificação operacional na tela de Compras.
3. Bloquear botões de recebimento quando bloqueia_recebimento = true.
4. Exibir o motivo do bloqueio na tela.
5. Registrar quem liberou a NF para recebimento real.
6. Criar uma tela de conferência de NF antes do recebimento.
7. Criar relatório de NFs históricas e NFs liberadas para recebimento.
```

---

## 17. Status da Etapa 134 — Parte 10D

Status:

```txt
Documentação criada.
Fluxo seguro de liberação manual documentado.
Nenhuma alteração operacional aplicada no banco.
Nenhuma NF antiga liberada.
Nenhum estoque movimentado.
Nenhum lote criado.
```
