# Скрипт для развертывания голосового ассистента CLAIRE
# Автор: CLAIRE Platform Team
# Дата: 2024

Write-Host "🎤 Развертывание голосового ассистента CLAIRE..." -ForegroundColor Cyan

# Проверка наличия Supabase CLI
Write-Host "📋 Проверка зависимостей..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI найден: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI не найден. Установите его:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Проверка переменных окружения
Write-Host "🔐 Проверка переменных окружения..." -ForegroundColor Yellow
if (-not $env:OPENAI_API_KEY) {
    Write-Host "❌ OPENAI_API_KEY не установлен" -ForegroundColor Red
    Write-Host "Установите переменную окружения OPENAI_API_KEY" -ForegroundColor Yellow
    exit 1
}

if (-not $env:SUPABASE_PROJECT_REF) {
    Write-Host "❌ SUPABASE_PROJECT_REF не установлен" -ForegroundColor Red
    Write-Host "Установите переменную окружения SUPABASE_PROJECT_REF" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Переменные окружения настроены" -ForegroundColor Green

# Логин в Supabase (если не залогинен)
Write-Host "🔑 Проверка авторизации в Supabase..." -ForegroundColor Yellow
try {
    supabase status
    Write-Host "✅ Уже авторизован в Supabase" -ForegroundColor Green
} catch {
    Write-Host "🔐 Требуется авторизация в Supabase..." -ForegroundColor Yellow
    supabase login
}

# Связывание проекта
Write-Host "🔗 Связывание с проектом Supabase..." -ForegroundColor Yellow
try {
    supabase link --project-ref $env:SUPABASE_PROJECT_REF
    Write-Host "✅ Проект связан" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка при связывании проекта" -ForegroundColor Red
    exit 1
}

# Развертывание существующей Edge Function
Write-Host "🚀 Развертывание ai-assistant..." -ForegroundColor Yellow
try {
    supabase functions deploy ai-assistant
    Write-Host "✅ ai-assistant развернут" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка при развертывании ai-assistant" -ForegroundColor Red
    exit 1
}

# Развертывание новой Edge Function для голоса
Write-Host "🎤 Развертывание voice-assistant..." -ForegroundColor Yellow
try {
    supabase functions deploy voice-assistant
    Write-Host "✅ voice-assistant развернут" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка при развертывании voice-assistant" -ForegroundColor Red
    exit 1
}

# Проверка развертывания
Write-Host "🔍 Проверка развертывания..." -ForegroundColor Yellow
try {
    $functions = supabase functions list
    Write-Host "✅ Функции развернуты:" -ForegroundColor Green
    $functions | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
} catch {
    Write-Host "⚠️ Не удалось проверить список функций" -ForegroundColor Yellow
}

# Установка зависимостей frontend
Write-Host "📦 Установка зависимостей frontend..." -ForegroundColor Yellow
try {
    if (Test-Path "bun.lockb") {
        bun install
        Write-Host "✅ Зависимости установлены (Bun)" -ForegroundColor Green
    } else {
        npm install
        Write-Host "✅ Зависимости установлены (npm)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Ошибка при установке зависимостей" -ForegroundColor Red
    exit 1
}

# Сборка проекта
Write-Host "🏗️ Сборка проекта..." -ForegroundColor Yellow
try {
    if (Test-Path "bun.lockb") {
        bun run build
    } else {
        npm run build
    }
    Write-Host "✅ Проект собран" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка при сборке проекта" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Развертывание завершено успешно!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Запустите приложение: npm run dev или bun dev" -ForegroundColor White
Write-Host "2. Откройте http://localhost:5173" -ForegroundColor White
Write-Host "3. Перейдите на /voice-demo для тестирования" -ForegroundColor White
Write-Host "4. Проверьте работу голосового ассистента" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Для отладки используйте:" -ForegroundColor Yellow
Write-Host "supabase functions logs voice-assistant" -ForegroundColor White
Write-Host "supabase functions serve voice-assistant" -ForegroundColor White 