# Bootstrap do backend RAG em uma máquina nova (Windows).
# Cria o .venv, instala o lock de dependências, copia .env.example -> .env
# quando faltar, e confere os artefatos da v6.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path .venv)) {
    Write-Host "== Criando .venv =="
    # Sem o 3.14, o py escreve no stderr; com "Stop", o PowerShell 5.1 trata
    # isso como erro fatal e o script terminaria antes de tentar o python do PATH.
    $ErrorActionPreference = "Continue"
    py -3.14 -m venv .venv 2>$null
    $ErrorActionPreference = "Stop"
    if (-not (Test-Path .venv\Scripts\python.exe)) { python -m venv .venv }
}
& .\.venv\Scripts\python -m pip install --upgrade pip | Out-Null
& .\.venv\Scripts\pip install -r requirements-lock.txt

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "== .env criado a partir de .env.example (defaults: endpoint da turma) =="
}

& .\.venv\Scripts\python scripts\bootstrap_check.py
Write-Host "`nPronto. Suba o backend com:"
Write-Host "  .\.venv\Scripts\python -m uvicorn app.api:app --host 127.0.0.1 --port 8080"
