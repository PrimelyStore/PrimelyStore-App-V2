---
name: documentation-roadmap
description: Use para documentação, ROADMAP, changelog técnico, decisões técnicas e retomada de contexto entre chats.
---

# Documentation and Roadmap

## Objetivo

Garantir que o projeto não perca o rumo e que cada mudança fique documentada.

O `ROADMAP` é a âncora do projeto.

---

## Arquivos oficiais de documentação

Usar principalmente:

```txt
docs/00_LEIA_PRIMEIRO.md
docs/01_FONTE_OFICIAL_PRIMELY_STORE_V3.md
docs/02_ARQUITETURA_OFICIAL_V3.md
docs/03_ROADMAP_PRIMELY_STORE_V3.md
docs/04_BANCO_SUPABASE_E_MIGRATIONS.md
docs/05_INTEGRACOES_E_SAUDE_DOS_DADOS.md
docs/06_CURVA_ABC_INTELIGENTE_MARKETPLACE.md
docs/07_PADRAO_VISUAL_RESPONSIVIDADE.md
docs/08_HISTORICO_TECNICO_RESUMIDO.md
```

---

## Regras

1. Toda mudança relevante deve atualizar documentação.
2. Não deixar decisão importante apenas no chat.
3. Registrar mudanças no roadmap.
4. Documentar como testar.
5. Documentar rollback quando houver risco.
6. Documentar impacto no banco, frontend e integrações.
7. Não manter documentos antigos conflitantes como fonte ativa.

---

## Formato de registro de alteração

```md
## YYYY-MM-DD — Nome da alteração

### Objetivo
...

### Arquivos alterados
...

### Impacto
...

### Como testar
...

### Riscos
...

### Rollback
...

### Próxima etapa
...
```

---

## Classificação de itens do projeto

Ao auditar arquivos/telas/módulos, classificar como:

- ✅ Manter e usar;
- 🔄 Adaptar/melhorar;
- 🔒 Manter como legado;
- ❌ Pode remover futuramente;
- 🆕 Precisa criar.

Nunca remover sem confirmação.
