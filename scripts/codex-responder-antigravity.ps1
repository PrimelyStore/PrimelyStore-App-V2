$ErrorActionPreference = "Stop"

Write-Host "========================================="
Write-Host "Preparando contexto local para o Codex..."
Write-Host "========================================="

New-Item -ItemType Directory -Force -Path "docs/antigravity" | Out-Null

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        return Get-Content -Path $Path -Raw -ErrorAction SilentlyContinue
    }

    return "[ARQUIVO_NAO_ENCONTRADO] $Path"
}

function Run-CmdSafe {
    param([string]$Command)

    try {
        $output = cmd.exe /c $Command 2>&1
        return ($output | Out-String)
    }
    catch {
        return "[ERRO_AO_EXECUTAR] $Command`r`n$($_.Exception.Message)"
    }
}

$contexto = @"

==============================
CONTEXTO LOCAL COLETADO PELO POWERSHELL
==============================

Este contexto foi coletado pelo PowerShell antes de chamar o Codex.
O Codex NAO deve executar comandos.
O Codex NAO deve ler arquivos diretamente.
O Codex deve analisar apenas o conteudo abaixo e gerar o veredito.

==============================
GIT STATUS --SHORT
==============================
$(Run-CmdSafe "git status --short")

==============================
GIT DIFF --STAT
==============================
$(Run-CmdSafe "git diff --stat")

==============================
GIT DIFF
==============================
$(Run-CmdSafe "git diff")

==============================
DOC: docs/antigravity/RESPOSTA_ANTIGRAVITY.md
==============================
$(Read-FileSafe "docs/antigravity/RESPOSTA_ANTIGRAVITY.md")

==============================
DOC: docs/antigravity/PROXIMO_COMANDO.md
==============================
$(Read-FileSafe "docs/antigravity/PROXIMO_COMANDO.md")

==============================
DOC: docs/antigravity/STATUS_ATUAL.md
==============================
$(Read-FileSafe "docs/antigravity/STATUS_ATUAL.md")

==============================
DOC: docs/antigravity/HISTORICO_EXECUCOES.md
==============================
$(Read-FileSafe "docs/antigravity/HISTORICO_EXECUCOES.md")

==============================
DOC: AGENTS.md
==============================
$(Read-FileSafe "AGENTS.md")

==============================
DOC: ROADMAP.md
==============================
$(Read-FileSafe "ROADMAP.md")

==============================
DOC: TASKS.md
==============================
$(Read-FileSafe "TASKS.md")

==============================
DOC: ACCEPTANCE_CRITERIA.md
==============================
$(Read-FileSafe "ACCEPTANCE_CRITERIA.md")

"@

$prompt = @"
Voce e o Codex atuando como auditor tecnico do Antigravity IDE neste projeto.

IMPORTANTE:
- Nao execute comandos.
- Nao leia arquivos diretamente.
- Nao altere arquivos.
- Nao faca commit.
- Nao faca deploy.
- Nao chame APIs reais.
- Nao leia secrets reais.
- Nao execute SQL destrutivo.

O PowerShell ja coletou todos os dados necessarios abaixo.
Sua funcao e apenas analisar o contexto fornecido e responder se a etapa anterior foi aprovada, precisa correcao ou precisa confirmacao humana.

Escreva a resposta em portugues simples, sem acentos, para evitar problema de codificacao.

Formato obrigatorio da resposta:

# Resposta do Codex para o Antigravity

## Veredito

Use apenas uma destas opcoes:
- APROVADO_PARA_CONTINUAR
- PRECISA_CORRIGIR
- AGUARDAR_CONFIRMACAO_HUMANA

## Analise do que o Antigravity fez

Explique se a etapa foi feita corretamente com base no contexto recebido.

## Problemas encontrados

Liste problemas, riscos ou inconsistencias. Se nao houver, escreva:
Nenhum problema critico encontrado.

## Proximo comando para o Antigravity

Escreva o prompt completo que o Antigravity deve seguir agora.
O prompt deve mandar o Antigravity executar apenas uma etapa por vez.
O prompt deve proibir commit, deploy, chamada real Amazon, leitura de secrets e SQL destrutivo.

## Criterios de aceite da proxima etapa

Liste criterios objetivos.

## Observacao para o usuario

Explique em linguagem simples o que aconteceu e qual deve ser o proximo passo.

==============================
CONTEXTO PARA ANALISE
==============================

$contexto
"@

Write-Host "Chamando Codex em modo nao interativo..."

$codexOutput = $prompt | codex exec --sandbox read-only -

$codexOutput | Set-Content -Path "docs/antigravity/RESPOSTA_CODEX.md" -Encoding UTF8

Write-Host ""
Write-Host "========================================="
Write-Host "Resposta do Codex salva em:"
Write-Host "docs/antigravity/RESPOSTA_CODEX.md"
Write-Host "========================================="