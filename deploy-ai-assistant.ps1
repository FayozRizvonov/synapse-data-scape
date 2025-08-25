# Deploy CLAIRE AI Assistant PowerShell Script

Write-Host "🚀 Deploying CLAIRE AI Assistant..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
} catch {
    Write-Host "❌ Supabase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Deploy the AI assistant function
Write-Host "📦 Deploying AI assistant function..." -ForegroundColor Yellow
$deployResult = supabase functions deploy ai-assistant

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ AI assistant function deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy AI assistant function" -ForegroundColor Red
    exit 1
}

# Check if OPENAI_API_KEY is set
if (-not $env:OPENAI_API_KEY) {
    Write-Host "⚠️  OPENAI_API_KEY environment variable is not set" -ForegroundColor Yellow
    Write-Host "Please set it with:" -ForegroundColor Yellow
    Write-Host "supabase secrets set OPENAI_API_KEY=your_openai_api_key_here" -ForegroundColor Cyan
} else {
    Write-Host "🔑 Setting OpenAI API key..." -ForegroundColor Yellow
    supabase secrets set OPENAI_API_KEY=$env:OPENAI_API_KEY
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OpenAI API key set successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set OpenAI API key" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 AI Assistant deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To test the function, run:" -ForegroundColor Cyan
Write-Host "supabase functions invoke ai-assistant --body '{\"message\": \"Hello\"}'" -ForegroundColor White
Write-Host ""
Write-Host "The AI assistant is now ready to use in your application!" -ForegroundColor Green 