# Quick Deployment Steps

## Step 1: Add CRON_SECRET to .env (Local)

✅ Already done! Check your `.env` file.

## Step 2: Install Vercel CLI (if not installed)

```powershell
npm install -g vercel
vercel login
```

## Step 3: Link Project (if not linked)

```powershell
vercel link
# Follow prompts to link existing project or create new
```

## Step 4: Set CRON_SECRET in Vercel

```powershell
# Get the secret from .env file
$cronSecret = (Get-Content .env | Select-String "CRON_SECRET").ToString().Split("=")[1]
Write-Host "Your CRON_SECRET: $cronSecret"

# Add to Vercel (interactive - paste the secret when prompted)
vercel env add CRON_SECRET production
# When prompted, paste: [your CRON_SECRET value]
```

**Or via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add: `CRON_SECRET` = `[your secret from .env]`
5. Select: Production, Preview, Development
6. Save

## Step 5: Set Other Required Environment Variables

Make sure these are set in Vercel:

```powershell
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add RESEND_API_KEY production
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production
```

## Step 6: Deploy

```powershell
vercel --prod
```

## Step 7: Verify Deployment

1. Check Vercel dashboard for deployment status
2. Visit your production URL
3. Check Cron Jobs in Settings → Cron Jobs (should see 5 jobs)
4. Test a cron endpoint manually (see below)

## Step 8: Test Cron Endpoints

```powershell
# Get your domain
$domain = "your-app.vercel.app"  # Replace with your actual domain
$cronSecret = "your-cron-secret"  # From .env

# Test protected job endpoint
$headers = @{
    "Authorization" = "Bearer $cronSecret"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "https://$domain/api/jobs/ingest?city=palm-bay" `
    -Method POST -Headers $headers

# Test cron dispatcher (simulates Vercel Cron)
$cronHeaders = @{
    "x-vercel-cron" = "1"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "https://$domain/api/cron/ingest?city=palm-bay" `
    -Method POST -Headers $cronHeaders
```

## Troubleshooting

### If vercel command not found:
```powershell
npm install -g vercel
```

### If not logged in:
```powershell
vercel login
```

### If project not linked:
```powershell
vercel link
```

### To check environment variables:
```powershell
vercel env ls
```

### To view deployment logs:
```powershell
vercel logs
```

---

**Ready to deploy!** Run `vercel --prod` when environment variables are set.

