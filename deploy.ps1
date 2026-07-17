<#
.SYNOPSIS
  Full deploy automation: git push → CI watch → Vercel deploy verification.
#>

param(
  [Parameter(Mandatory=$false)]
  [string]$CommitMessage = "chore: deploy — auto-push from deploy.ps1",

  [Parameter(Mandatory=$false)]
  [int]$CIPollSeconds = 10,

  [Parameter(Mandatory=$false)]
  [int]$DeployPollSeconds = 15
)

$ErrorActionPreference = 'Stop'
$RepoRoot = "C:\Users\wilso\Documents\APPS\ERP EMPRESARIAL CONSTRUSMART -WM FAMOUS\CONSTRUSMART"
$GitRemote = 'origin'
$Branch = (git -C $RepoRoot branch --show-current 2>&1).Trim()
$ProdUrl = 'https://construsmart-wm2026.vercel.app/'
$GhOwner = (git -C $RepoRoot remote get-url $GitRemote 2>&1).Trim() -replace '.*github\.com[:/]([^/]+)/[^/]+', '$1'
$GhRepo  = (git -C $RepoRoot remote get-url $GitRemote 2>&1).Trim() -replace '.*github\.com[:/][^/]+/([^/]+)\.git', '$1'

function Write-Step($text, $color='Cyan') {
  Write-Host "`n[$color]==> $text<" -ForegroundColor $color
}

function Require-Cmd($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found in PATH."
  }
}

# ── 0. Preflight ──────────────────────────────────────────────────────────────
Write-Step "Preflight checks" "Yellow"
Require-Cmd git
Require-Cmd gh
Require-Cmd vercel
Require-Cmd curl

Set-Location $RepoRoot

$status = git status --short 2>&1 | Out-String
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "Working tree is clean. Nothing to commit."
} else {
  Write-Host "Modified files:`n$status"
}

# Remove untracked junk if present
if (Test-Path "$RepoRoot\temp_gitignore_check.txt") {
  Remove-Item "$RepoRoot\temp_gitignore_check.txt" -Force
  Write-Host "Removed temp_gitignore_check.txt"
}

# ── 1. Stage & commit ─────────────────────────────────────────────────────────
Write-Step "Staging and committing changes" "Cyan"

git -C $RepoRoot add --all 2>&1 | Out-Null
$diff = git -C $RepoRoot diff --cached --stat 2>&1 | Out-String
Write-Host "Staged changes:`n$diff"

$hasChanges = git -C $RepoRoot diff --cached --quiet 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "No changes staged. Skipping commit."
} else {
  git -C $RepoRoot commit -m $CommitMessage 2>&1 | Out-Null
  Write-Host "Committed: $CommitMessage"
}

# ── 2. Push to GitHub ─────────────────────────────────────────────────────────
Write-Step "Pushing to $GitRemote/$Branch" "Cyan"
git -C $RepoRoot push $GitRemote $Branch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "git push failed."
}
Write-Host "Push successful."

# Capture the new commit SHA
$CommitSha = (git -C $RepoRoot rev-parse HEAD 2>&1).Trim()
Write-Host "Commit SHA: $CommitSha"

# ── 3. Wait for GitHub Actions workflow run ───────────────────────────────────
Write-Step "Waiting for GitHub Actions run..." "Cyan"
Start-Sleep -Seconds 5

$RunId = $null
$Attempts = 0
while (-not $RunId -and $Attempts -lt 12) {
  $runs = gh -R "$GhOwner/$GhRepo" run list --branch $Branch --limit 1 --json databaseId,status,conclusion,url 2>&1 | ConvertFrom-Json
  if ($runs) {
    $RunId = $runs[0].databaseId
    $RunUrl = $runs[0].url
  }
  if (-not $RunId) {
    Start-Sleep -Seconds $CIPollSeconds
    $Attempts++
  }
}

if (-not $RunId) {
  throw "Could not detect GitHub Actions run for branch '$Branch'."
}
Write-Host "Run URL: $RunUrl"

# Stream logs until completion
Write-Host "Streaming CI logs (this may take a few minutes)..."
$watchResult = gh -R "$GhOwner/$GhRepo" run watch $RunId --exit-status 2>&1 | Out-String
Write-Host $watchResult

if ($LASTEXITCODE -ne 0) {
  throw "CI checks failed. Review the run at $RunUrl"
}
Write-Host "All CI checks passed." -ForegroundColor Green

# ── 4. Verify Vercel deployment ───────────────────────────────────────────────
Write-Step "Verifying Vercel deployment" "Cyan"

# Query latest production deployment
$deployments = vercel inspect $GhRepo --scope $GhOwner --token (vercel whoami --token 2>&1 | Out-String).Trim() 2>&1 | Out-String
# Fallback: use the Vercel REST API via curl if inspect fails
$DeployUrl = "$ProdUrl"
$DeployOk = $false
$Attempts = 0
while (-not $DeployOk -and $Attempts -lt 8) {
  try {
    $resp = curl -Uri $DeployUrl -Method Head -UseBasicParsing -TimeoutSec 15 -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 200) {
      $DeployOk = $true
      Write-Host "Production URL responds HTTP 200." -ForegroundColor Green
    } else {
      Write-Host "HTTP $($resp.StatusCode) — retrying in $DeployPollSeconds s..."
    }
  } catch {
    Write-Host "Request failed: $_ — retrying in $DeployPollSeconds s..."
  }
  Start-Sleep -Seconds $DeployPollSeconds
  $Attempts++
}

if (-not $DeployOk) {
  Write-Warning "Deployment did not return HTTP 200 after retries. Check Vercel dashboard."
} else {
  Write-Host "`nDeployment verified at: $DeployUrl" -ForegroundColor Green
}

# ── 5. Summary ────────────────────────────────────────────────────────────────
Write-Step "Deploy Summary" "Green"
Write-Host @"
  Branch       : $Branch
  Commit SHA   : $CommitSha
  CI Run       : $RunUrl
  Production   : $ProdUrl
  Status       : SUCCESS
"@
