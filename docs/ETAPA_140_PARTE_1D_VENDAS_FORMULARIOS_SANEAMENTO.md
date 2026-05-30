# Etapa 140 — Parte 1D — Documentação dos ajustes e saneamento da tela Vendas

## 1. Objetivo desta documentação

Este documento registra duas melhorias importantes realizadas na área de **Vendas** do sistema **Agentes Primely Store**:

```txt
1. Ajuste visual da tela Vendas para deixar os formulários recolhidos por padrão.
2. Saneamento da base com remoção segura de vendas de teste.
```

A finalidade foi deixar a tela mais limpa e remover registros de teste que poderiam poluir:

```txt
cards de resumo
tabela de vendas encontradas
dashboard
relatórios futuros
análises de venda
alertas operacionais
controle de baixa FIFO
```

---

## 2. Contexto

Antes desta etapa, a tela **Vendas** mostrava vendas reais importadas/processadas e também vendas antigas de teste.

As vendas de teste apareciam na tabela, mas não representavam operação real.

Foram identificadas 3 vendas de teste:

```txt
VENDA-AUTH-001
VENDA-TESTE-FRONT-001
VENDA-TESTE-SISTEMA-001
```

Essas vendas tinham:

```txt
valor_total = 0,00
sem itens vinculados
sem baixa FIFO
sem movimentação de estoque
sem vínculo Olist
sem auditoria
```

---

## 3. Ajuste visual da tela Vendas

Foi alterado o arquivo:

```txt
src/pages/Vendas.tsx
```

O objetivo foi deixar os formulários fechados por padrão, igual ao padrão aplicado na tela Compras.

Agora a tela possui uma área:

```txt
Ações rápidas de vendas
```

Com os botões:

```txt
Cadastrar cabeçalho da venda
Adicionar item à venda
```

---

## 4. Comportamento dos formulários

Depois do ajuste:

```txt
O formulário "Cadastrar cabeçalho da venda" fica fechado ao abrir a tela.
O formulário "Adicionar item à venda" fica fechado ao abrir a tela.
O usuário abre o formulário somente quando clicar no botão correspondente.
Clicar novamente no botão fecha o formulário.
Ao clicar em "Usar venda", o formulário de item pode abrir automaticamente.
Ao cadastrar uma venda nova, o formulário de cabeçalho fecha e o formulário de item pode abrir.
```

Esse ajuste melhora a experiência porque reduz a altura inicial da tela e facilita visualizar os cards, itens e vendas encontradas.

---

## 5. O que foi preservado no ajuste visual

O ajuste visual preservou:

```txt
cadastro de venda
cadastro de item da venda
saldo disponível no local de saída
validação de estoque
bloqueio por estoque insuficiente
baixa FIFO
itens das vendas
vendas encontradas
integração com Supabase
vendasService.ts
estoque
lotes
movimentações
```

---

## 6. Commit do ajuste visual

O ajuste visual dos formulários foi validado com build e commitado.

Commit:

```txt
6a2917c feat: recolher formularios da tela de vendas
```

Validação técnica:

```txt
npm run build
```

Resultado:

```txt
build concluído com sucesso
```

Status Git final:

```txt
nothing to commit, working tree clean
```

---

## 7. Auditoria antes da limpeza das vendas de teste

Antes de apagar qualquer venda, foi feita auditoria no banco.

Foram verificadas as dependências reais relacionadas a vendas:

```txt
auditoria_eventos → venda_id
olist_pedidos_snapshot → venda_id
vendas_itens → venda_id
olist_pedidos_itens_snapshot → venda_item_id
vendas_itens_lotes → venda_item_id
movimentacoes_estoque → sem venda_id direto; conferência por documento_origem e observacoes
```

Também foi confirmado que a tabela `vendas` usa a coluna:

```txt
numero_pedido_marketplace
```

e não:

```txt
marketplace_pedido_id
```

---

## 8. Conferências realizadas

As vendas de teste foram conferidas nas seguintes estruturas:

```txt
vendas
vendas_itens
auditoria_eventos
olist_pedidos_snapshot
olist_pedidos_itens_snapshot
vendas_itens_lotes
movimentacoes_estoque
```

Resultado:

```txt
vendas de teste encontradas: 3
itens de venda vinculados: 0
auditorias vinculadas: 0
snapshots Olist vinculados: 0
itens Olist vinculados: 0
lotes de itens de venda vinculados: 0
movimentações de estoque relacionadas: 0
```

---

## 9. Observações sobre colunas/tabelas corrigidas

Durante a auditoria foram identificados nomes incorretos usados inicialmente em consultas.

Foi corrigido que:

```txt
A tabela vendas não tem marketplace_pedido_id.
A coluna correta é numero_pedido_marketplace.
```

Também foi corrigido que:

```txt
A tabela public.estoque_movimentacoes não existe.
A tabela correta é public.movimentacoes_estoque.
```

E foi identificado que:

```txt
movimentacoes_estoque não possui venda_id.
```

Por isso, a conferência de movimentações relacionadas às vendas de teste foi feita por texto nas colunas:

```txt
documento_origem
observacoes
```

---

## 10. Backups criados antes da remoção

Antes do DELETE, foram criadas tabelas de backup:

```txt
bkp140_1c_vendas_teste_before_delete
bkp140_1c_vendas_itens_teste_before_delete
bkp140_1c_auditoria_vendas_teste_before_delete
bkp140_1c_olist_pedidos_teste_before_delete
bkp140_1c_olist_pedidos_itens_teste_before_delete
bkp140_1c_vendas_itens_lotes_teste_before_delete
bkp140_1c_movimentacoes_teste_before_delete
```

Resultado validado dos backups:

```txt
bkp140_1c_vendas_teste_before_delete                  3
bkp140_1c_vendas_itens_teste_before_delete            0
bkp140_1c_auditoria_vendas_teste_before_delete        0
bkp140_1c_olist_pedidos_teste_before_delete           0
bkp140_1c_olist_pedidos_itens_teste_before_delete     0
bkp140_1c_vendas_itens_lotes_teste_before_delete      0
bkp140_1c_movimentacoes_teste_before_delete           0
```

---

## 11. Vendas removidas

Foram removidas as 3 vendas de teste:

```txt
VENDA-AUTH-001
VENDA-TESTE-FRONT-001
VENDA-TESTE-SISTEMA-001
```

Antes do DELETE real, foi feita simulação com `ROLLBACK`.

Depois foi executado o DELETE real.

Resultado do DELETE real:

```txt
olist_itens_apagados: 0
lotes_itens_apagados: 0
itens_apagados: 0
auditorias_apagadas: 0
olist_pedidos_apagados: 0
movimentacoes_apagadas: 0
vendas_apagadas: 3
```

Isso confirmou que somente as vendas de teste foram removidas.

---

## 12. Vendas reais preservadas

Após a limpeza, permaneceram 6 vendas reais:

```txt
711
712
713
714
715
716
```

Essas vendas continuaram com:

```txt
1 unidade por venda
1 baixado
0 pendente
status ativo
ação Baixado
```

---

## 13. Estado final da tela Vendas

A tela Vendas passou a mostrar:

```txt
Vendas encontradas: 6
Unidades vendidas: 6
Receita líquida: R$ 171,18
Lucro estimado: R$ 171,18
Itens das vendas: 6
```

As vendas de teste não aparecem mais.

---

## 14. O que foi preservado no saneamento

A limpeza não alterou:

```txt
vendas reais
itens das vendas reais
baixa FIFO das vendas reais
vendas_itens_lotes das vendas reais
movimentações reais
estoque
lotes
produtos
fornecedores
compras
NFs Olist
dashboard real
alertas operacionais reais
```

---

## 15. Benefícios da etapa

A etapa trouxe os seguintes benefícios:

```txt
Tela Vendas mais limpa.
Formulários recolhidos por padrão.
Cards de resumo sem dados de teste.
Tabela de vendas sem vendas falsas.
Base mais preparada para sincronização Olist.
Menor risco de confundir venda de teste com venda real.
Maior segurança para criar botão de sincronização de vendas.
```

---

## 16. Próximas etapas recomendadas

Depois desta documentação, as próximas etapas recomendadas são:

```txt
1. Finalizar a sincronização ampliada manual das NFs Olist de compras.
2. Criar botão seguro "Sincronizar NFs Olist" na tela Compras.
3. Planejar botão seguro "Sincronizar vendas Olist" na tela Vendas.
4. Separar sincronização de vendas da baixa FIFO.
5. Criar agendamento automático seguro para compras e vendas.
```

---

## 17. Regra importante para vendas

Para vendas, a sincronização deve ser tratada separadamente da baixa de estoque.

Recomendação:

```txt
Sincronizar vendas Olist ≠ baixar FIFO automaticamente
```

Primeiro, a sincronização deve apenas:

```txt
buscar pedidos
criar/atualizar vendas
criar/atualizar itens
registrar logs
```

A baixa FIFO deve continuar controlada, para evitar:

```txt
baixa duplicada
baixa sem estoque
baixa de pedido cancelado
baixa antes de conferência
```

---

## 18. Status da Etapa 140 — Parte 1D

Status:

```txt
Documentação criada.
Formulários da tela Vendas recolhidos.
Build validado.
Commit do ajuste visual validado.
Vendas de teste removidas com backup.
Vendas reais preservadas.
Itens reais preservados.
Baixa FIFO preservada.
Movimentações preservadas.
Tela Vendas validada visualmente.
Base preparada para próximos passos.
```
