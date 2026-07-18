---
name: supabase-safe-analytics
description: Use para Supabase, PostgreSQL, MCP, migrations, views, RPCs, RLS, policies, logs e Edge Functions.
---

# Supabase Safe Analytics

## Objetivo

Usar o Supabase como base analítica do Primely Store:

- snapshots;
- logs;
- views;
- RPCs;
- configurações;
- análises;
- conciliações;
- indicadores.

O Supabase **não deve virar ERP operacional paralelo** ao Olist/Tiny.

---

## MCP Supabase

Regra padrão:

```txt
Usar MCP em modo somente leitura para auditoria e planejamento.
```

Acesso de escrita somente em ambiente dev/staging e com confirmação.

Não executar sem confirmação:

- `execute_sql` destrutivo;
- `apply_migration`;
- exclusão de tabela;
- alteração de coluna crítica;
- update/delete em massa;
- remoção de policy;
- alteração de RLS;
- alteração em produção.

---

## Regras obrigatórias

1. Nunca alterar produção diretamente.
2. Criar migrations versionadas em `supabase/migrations`.
3. Nunca executar SQL destrutivo sem plano de rollback.
4. Não remover tabela, view, RPC ou função sem auditoria.
5. Verificar RLS ao criar ou expor tabela.
6. Nunca expor `service_role` no frontend.
7. Preferir views/RPCs para consultas analíticas e dashboards.
8. Evitar cálculos críticos espalhados no frontend.
9. Registrar logs de sincronização em integrações.
10. Atualizar documentação quando o schema mudar.

---

## Classificação de tabelas

Toda tabela nova ou existente deve ser classificada como:

- Snapshot;
- Log;
- Configuração;
- Analítica;
- Mapeamento;
- Legado;
- Temporária.

Se for legado, não usar como fonte oficial sem conciliação.

---

## Checklist antes de migration

Antes de criar ou alterar migration, informar:

- Qual problema resolve?
- Quais tabelas/views/RPCs afeta?
- Há perda de dados?
- Há impacto no frontend?
- Há impacto em Edge Functions?
- Existe rollback?
- A documentação será atualizada?
- O usuário confirmou?

---

## Padrão de resposta após alteração

Informar:

- Migration criada ou alterada;
- Arquivos afetados;
- SQL usado ou sugerido;
- Riscos;
- Como testar;
- Rollback;
- Próxima etapa segura.
