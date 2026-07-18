# ACCEPTANCE_CRITERIA.md - Criterios Gerais de Aceite

Este documento define os criterios gerais de aceite que devem ser obrigatoriamente seguidos em todas as etapas de desenvolvimento, auditoria e planejamento do projeto.

## Criterios de Aceite Gerais
- O projeto Primely Store deve ser mantido como painel gerencial inteligente.
- Nao duplicar funcionalidades de ERP (Olist/Tiny e a fonte operacional oficial).
- Toda alteracao documental relevante deve ser feita em ASCII simples, sem acentos e sem cedilhas.
- Executar apenas uma etapa isolada de cada vez.
- Atualizar docs/antigravity/RESPOSTA_ANTIGRAVITY.md ao final de cada etapa.

## Regras de Seguranca Obrigatorias
- Sem commit automatico de arquivos modificados ou novos.
- Sem deploy automatico para ambientes de producao ou remoto sem autorizacao.
- Sem leitura ou armazenamento de secrets reais (chaves, senhas, tokens) em arquivos no repositorio.
- Sem chamadas de API real (Amazon, Mercado Livre, Keepa, Olist/Tiny, etc.) sem confirmacao humana explicita.
- Sem execucao de SQL destrutivo ou alteracoes estruturais em massa em bancos remotos.
