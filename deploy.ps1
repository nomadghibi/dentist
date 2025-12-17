# Vercel Deployment Script
# Run this script to set up and deploy

Write-Host "🚀 Vercel Deployment Setup`n" -ForegroundColor Cyan

# Step 1: Check if logged in
Write-Host "Step 1: Checking Vercel login status..." -ForegroundColor Yellow
$loginCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Vercel`n" -ForegroundColor Yellow
    Write-Host "Please run: vercel login" -ForegroundColor White
    Write-Host "Then run this script again.`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ Logged in to Vercel`n" -ForegroundColor Green

# Step 2: Get CRON_SECRET from .env
Write-Host "Step 2: Reading CRON_SECRET from .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "CRON_SECRET=(.+)") {
        $cronSecret = $matches[1].Trim()
        Write-Host "✅ CRON_SECRET found`n" -ForegroundColor Green
    } else {
        Write-Host "❌ CRON_SECRET not found in .env" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

# Step 3: Set CRON_SECRET in Vercel
Write-Host "Step 3: Setting CRON_SECRET in Vercel..." -ForegroundColor Yellow
Write-Host "Your CRON_SECRET: $cronSecret`n" -ForegroundColor White
Write-Host "Run this command and paste the secret when prompted:" -ForegroundColor White
Write-Host "  vercel env add CRON_SECRET production`n" -ForegroundColor Cyan
Write-Host "Or set it via Vercel Dashboard (see DEPLOY_NOW.md)`n" -ForegroundColor White

$setSecret = Read-Host "Have you set CRON_SECRET in Vercel? (y/n)"
if ($setSecret -ne "y" -and $setSecret -ne "Y") {
    Write-Host "Please set CRON_SECRET first, then run this script again.`n" -ForegroundColor Yellow
    exit 1
}

# Step 4: Deploy
Write-Host "`nStep 4: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "Running: vercel --prod`n" -ForegroundColor Cyan

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!`n" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Check Vercel dashboard for deployment status" -ForegroundColor White
    Write-Host "  2. Verify cron jobs in Settings → Cron Jobs" -ForegroundColor White
    Write-Host "  3. Test endpoints manually (see DEPLOY_NOW.md)`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed. Check errors above.`n" -ForegroundColor Red
}

