# Script for deploying CLAIRE voice assistant
# Author: CLAIRE Platform Team
# Date: 2024

Write-Host "🎤 Deploying CLAIRE voice assistant..." -ForegroundColor Cyan

# Check for Supabase CLI
Write-Host "📋 Checking dependencies..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Install it:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check environment variables
Write-Host "🔐 Checking environment variables..." -ForegroundColor Yellow
if (-not $env:OPENAI_API_KEY) {
    Write-Host "❌ OPENAI_API_KEY not set" -ForegroundColor Red
    Write-Host "Set environment variable OPENAI_API_KEY" -ForegroundColor Yellow
    exit 1
}

if (-not $env:SUPABASE_PROJECT_REF) {
    Write-Host "❌ SUPABASE_PROJECT_REF not set" -ForegroundColor Red
    Write-Host "Set environment variable SUPABASE_PROJECT_REF" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# Login to Supabase (if not logged in)
Write-Host "🔑 Checking Supabase authorization..." -ForegroundColor Yellow
try {
    supabase status
    Write-Host "✅ Already authorized in Supabase" -ForegroundColor Green
} catch {
    Write-Host "🔐 Supabase authorization required..." -ForegroundColor Yellow
    supabase login
}

# Link project
Write-Host "🔗 Linking with Supabase project..." -ForegroundColor Yellow
try {
    supabase link --project-ref $env:SUPABASE_PROJECT_REF
    Write-Host "✅ Project linked" -ForegroundColor Green
} catch {
    Write-Host "❌ Error linking project" -ForegroundColor Red
    exit 1
}

# Deploy existing Edge Function
Write-Host "🚀 Deploying ai-assistant..." -ForegroundColor Yellow
try {
    supabase functions deploy ai-assistant
    Write-Host "✅ ai-assistant deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error deploying ai-assistant" -ForegroundColor Red
    exit 1
}

# Deploy new Edge Function for voice
Write-Host "🎤 Deploying voice-assistant..." -ForegroundColor Yellow
try {
    supabase functions deploy voice-assistant
    Write-Host "✅ voice-assistant deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error deploying voice-assistant" -ForegroundColor Red
    exit 1
}

# Check deployment
Write-Host "🔍 Checking deployment..." -ForegroundColor Yellow
try {
    $functions = supabase functions list
    Write-Host "✅ Functions deployed:" -ForegroundColor Green
    $functions | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
} catch {
    Write-Host "⚠️ Could not check function list" -ForegroundColor Yellow
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
try {
    if (Test-Path "bun.lockb") {
        bun install
        Write-Host "✅ Dependencies installed (Bun)" -ForegroundColor Green
    } else {
        npm install
        Write-Host "✅ Dependencies installed (npm)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error installing dependencies" -ForegroundColor Red
    exit 1
}

# Build project
Write-Host "🏗️ Building project..." -ForegroundColor Yellow
try {
    if (Test-Path "bun.lockb") {
        bun run build
    } else {
        npm run build
    }
    Write-Host "✅ Project built" -ForegroundColor Green
} catch {
    Write-Host "❌ Error building project" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start application: npm run dev or bun dev" -ForegroundColor White
Write-Host "2. Open http://localhost:5173" -ForegroundColor White
Write-Host "3. Go to /voice-demo for testing" -ForegroundColor White
Write-Host "4. Check voice assistant functionality" -ForegroundColor White
Write-Host ""
Write-Host "🔧 For debugging use:" -ForegroundColor Yellow
Write-Host "supabase functions logs voice-assistant" -ForegroundColor White
Write-Host "supabase functions serve voice-assistant" -ForegroundColor White 