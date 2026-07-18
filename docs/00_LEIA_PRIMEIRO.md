# LEIA PRIMEIRO — Documentação Oficial Primely Store V3

Este pacote contém somente os documentos que devem permanecer na pasta `docs/` do projeto neste momento.

## Conceito definitivo

```txt
O Primely Store NÃO é ERP.
O Olist/Tiny é o ERP operacional oficial.
O Primely Store é um painel gerencial inteligente.
```

O Primely Store deve servir para:

- Relatórios gerenciais;
- Análises de vendas;
- Estoque consolidado;
- Curva ABC;
- Alertas inteligentes;
- Conciliações;
- Margem, lucro, ROI e tomada de decisão;
- Saúde das integrações;
- Futuras automações com n8n, Telegram e agentes de IA.

O Primely Store não deve duplicar:

- controle operacional de estoque;
- emissão/controle operacional de notas;
- baixa FIFO automática em massa;
- fluxo principal de pedidos;
- fluxo principal de recebimento de compras;
- operação diária que já acontece no Olist/Tiny.

---

## Documentos deste pacote

Copie estes arquivos para a pasta `docs/` do projeto:

```txt
00_LEIA_PRIMEIRO.md
01_FONTE_OFICIAL_PRIMELY_STORE_V3.md
02_ARQUITETURA_OFICIAL_V3.md
03_ROADMAP_PRIMELY_STORE_V3.md
04_BANCO_SUPABASE_E_MIGRATIONS.md
05_INTEGRACOES_E_SAUDE_DOS_DADOS.md
06_CURVA_ABC_INTELIGENTE_MARKETPLACE.md
07_PADRAO_VISUAL_RESPONSIVIDADE.md
08_HISTORICO_TECNICO_RESUMIDO.md
```

---

## O que fazer com os documentos antigos

Os documentos antigos por etapa podem ser removidos da pasta principal `docs/` para não confundir o Antigravity.

Se quiser preservar histórico, mova para:

```txt
docs/_arquivo_historico/
```

Não é recomendado deixar muitos arquivos de etapas antigas na raiz de `docs`, porque a IA pode interpretar documentos antigos como regra atual e voltar a transformar o Primely em um segundo ERP.

---

## Ordem de leitura para o Antigravity

O Antigravity deve ler nesta ordem:

1. `AGENTS.md`
2. `.agents/skills/*`
3. `docs/00_LEIA_PRIMEIRO.md`
4. `docs/01_FONTE_OFICIAL_PRIMELY_STORE_V3.md`
5. `docs/02_ARQUITETURA_OFICIAL_V3.md`
6. `docs/03_ROADMAP_PRIMELY_STORE_V3.md`
7. Documento específico da tarefa, quando existir.

---

## Regra de ouro

Antes de qualquer implementação, o Antigravity deve responder:

```txt
Esta alteração mantém o Primely como painel gerencial inteligente ou está criando um segundo ERP?
```

Se estiver criando um segundo ERP, a tarefa deve ser interrompida e replanejada.
