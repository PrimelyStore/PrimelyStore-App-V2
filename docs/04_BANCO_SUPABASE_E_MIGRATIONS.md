# Banco de Dados, Supabase e Migrations — Primely Store V3

## 1. Papel oficial do Supabase

O Supabase/PostgreSQL é a base de consolidação e análise do Primely Store.

Ele deve armazenar:

- snapshots de integrações;
- logs de sincronização;
- views gerenciais;
- RPCs analíticas;
- configurações;
- dados auxiliares;
- indicadores;
- histórico necessário para relatórios.

Ele não deve ser usado para criar uma segunda operação concorrente ao Olist/Tiny.

---

## 2. Tipos de tabelas permitidas

Toda tabela deve ser classificada antes de ser criada ou alterada.

Categorias recomendadas:

| Categoria | Uso |
|---|---|
| Snapshot | Cópia importada de API externa |
| Log | Histórico de sincronização, erro ou execução |
| Configuração | Parâmetros do sistema |
| Analítica | Apoio a relatórios e indicadores |
| Mapeamento | Relação entre sistemas |
| Legado | Estrutura antiga mantida por segurança/auditoria |
| Temporária | Uso controlado e com prazo para remoção |

---

## 3. Regra para tabelas operacionais antigas

Se ainda existirem tabelas antigas de produtos, compras, vendas, estoque, lotes e FIFO, elas não devem ser apagadas automaticamente.

Tratamento correto:

1. Auditar uso atual;
2. Verificar se alguma tela depende delas;
3. Verificar se alguma função/RPC depende delas;
4. Verificar se há dados úteis para histórico;
5. Classificar como:
   - manter;
   - adaptar;
   - legado;
   - ocultar;
   - remover futuramente.

---

## 4. Snapshots

Snapshots são a base do novo conceito.

Exemplos:

```txt
olist_produtos_snapshot
olist_depositos_snapshot
olist_estoque_depositos_snapshot
olist_pedidos_snapshot
olist_pedidos_itens_snapshot
olist_notas_entrada_snapshot
olist_notas_entrada_itens_snapshot
amazon_fba_inventory_snapshot
keepa_produtos_snapshot
```

Regra:

```txt
Snapshot não é operação oficial do Primely.
Snapshot é fotografia/importação para análise.
```

---

## 5. Views e RPCs

Indicadores importantes devem preferencialmente ficar em views ou RPCs.

Exemplos de usos:

- dashboard;
- Curva ABC;
- estoque consolidado;
- margem estimada;
- conciliação;
- alertas;
- rankings.

Vantagens:

- performance;
- segurança;
- consistência;
- reaproveitamento;
- menos regra duplicada no frontend.

---

## 6. Migrations

Toda alteração estrutural deve ser versionada em:

```txt
supabase/migrations/
```

Antes de criar migration:

- explicar objetivo;
- listar tabelas/views afetadas;
- indicar se há perda de dados;
- indicar rollback;
- pedir confirmação;
- rodar em ambiente seguro primeiro.

---

## 7. Regras de segurança no banco

- Não executar SQL destrutivo sem confirmação.
- Não remover tabela/view/função sem auditoria.
- Não alterar coluna crítica sem plano de migração.
- Não atualizar dados em massa sem backup.
- Não remover RLS sem justificativa.
- Não usar service_role no frontend.
- Não expor tokens em tabelas acessíveis publicamente.
- Usar Edge Functions para operações sensíveis.

---

## 8. MCP Supabase

Configuração recomendada para auditoria:

```json
{
  "mcpServers": {
    "supabase-readonly": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=SEU_PROJECT_REF&read_only=true"
    }
  }
}
```

Regra:

```txt
Usar MCP somente leitura por padrão.
Escrita somente em ambiente dev/staging e com confirmação.
```

---

## 9. Checklist antes de alterar o banco

- [ ] A alteração é necessária?
- [ ] Existe tabela/view/RPC existente que resolve?
- [ ] A alteração respeita o conceito de painel gerencial?
- [ ] Há risco de duplicar o Olist?
- [ ] Há risco de perda de dados?
- [ ] Existe rollback?
- [ ] Existe migration?
- [ ] A documentação será atualizada?
- [ ] O usuário confirmou?
