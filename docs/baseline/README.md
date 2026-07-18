# Baseline de Schema Legado Mínimo

Este diretório contém a estrutura de tabelas, views e funções legadas do projeto, necessária para a inicialização e reprodutibilidade do ambiente de desenvolvimento local.

## ⚠️ Diretrizes e Regras de Segurança Importantes

1. **Reprodutibilidade Local Apenas**:
   - Esta baseline serve unicamente para recriar as estruturas legadas no ambiente local do Docker para garantir a compatibilidade com trechos legados de código.
   - **Não é uma migração oficial**: Nunca envie este arquivo para o ambiente de produção/remoto.

2. **Evite `supabase db push` acidental**:
   - **Não** deixe este arquivo na pasta `supabase/migrations/` antes de rodar comandos de deploy ou push para o remoto.
   - O arquivo foi removido do diretório `supabase/migrations/` por padrão para evitar que o Supabase CLI o envie para o banco de dados remoto ou acuse desalinhamento no histórico de migrações reais.

3. **Instruções de Uso Local**:
   - Quando for necessário reconfigurar ou recriar o seu banco de dados local do zero (ex: `supabase start` ou `supabase db reset` em um ambiente zerado):
     1. Copie temporariamente o arquivo `20260515000000_baseline_schema_legado_minimo.sql` deste diretório para a pasta `supabase/migrations/`.
     2. Execute o comando de inicialização local (ex: `supabase start` ou `supabase db reset`).
     3. **Após a conclusão da inicialização do contêiner local, remova o arquivo da pasta `supabase/migrations/` imediatamente** para retornar o repositório ao estado limpo.

4. **Conceito Oficial**:
   - **Olist/Tiny** continua sendo o **ERP operacional oficial** do negócio.
   - O **Primely Store** atua estritamente como um **painel gerencial inteligente** para snapshots, cruzamento de dados, consolidação de custos, Curva ABC e conciliações.
   - Esta baseline não contém nenhum dado real de produção e não ativa fluxos operacionais adicionais duplicados.
   - Não tente usar ou adaptar essas estruturas operacionais legadas em ambiente de produção sem autorização prévia e explícita do arquiteto do projeto.
