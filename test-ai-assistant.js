// Тестовый файл для проверки работы AI ассистента
// Запуск: node test-ai-assistant.js

const testQueries = [
  "What are the key insights for Q2?",
  "Show me the best performing channels",
  "What's the regional performance?",
  "Show me marketing recommendations",
  "What are the scenario comparisons?",
  "Tell me about F2F calls performance",
  "Show me digital campaign insights",
  "What's the current situation with total sales?",
  "Show me the ROI analysis",
  "What are the top recommendations for optimization?"
];

console.log("🧪 Тестирование CLAIRE AI Assistant");
console.log("=====================================\n");

testQueries.forEach((query, index) => {
  console.log(`📝 Тест ${index + 1}: "${query}"`);
  console.log("Ожидаемый формат ответа:");
  
  switch(index) {
    case 0:
      console.log("✅ Sales Growth: [данные о росте]");
      console.log("🔍 Regional Performance: [региональные данные]");
      console.log("📉 Channel Challenges: [вызовы каналов]");
      console.log("💡 Recommendation: [рекомендации]");
      break;
    case 1:
      console.log("📊 Top Performing Channels – Current Performance:");
      console.log("	• [канал]: [доход] ([ROI]) - [описание]");
      console.log("🎯 Recommendation: [рекомендации]");
      break;
    case 2:
      console.log("🚶‍♂ F2F Rep Engagement – Regional Performance:");
      console.log("	• [регион]: [покрытие] ([script lift])");
      console.log("❗[проблема]");
      console.log("✅ Recommendation: [рекомендации]");
      break;
    case 3:
      console.log("💡 Marketing Optimization Recommendations:");
      console.log("🔥 High Impact:");
      console.log("	• [рекомендация]");
      console.log("⚡ Medium Impact:");
      console.log("	• [рекомендация]");
      console.log("📈 Low Impact:");
      console.log("	• [рекомендация]");
      console.log("🎯 Priority Actions: [действия]");
      break;
    case 4:
      console.log("📊 Scenario Comparison Analysis:");
      console.log("✅ Baseline Scenario: [данные]");
      console.log("🚀 Optimistic Scenario: [данные]");
      console.log("⚠ Pessimistic Scenario: [данные]");
      console.log("💡 Recommendation: [рекомендации]");
      break;
    default:
      console.log("Структурированный ответ с эмодзи и actionable insights");
  }
  
  console.log("\n" + "─".repeat(50) + "\n");
});

console.log("🎯 Критерии успешного тестирования:");
console.log("1. ✅ Ответ содержит эмодзи и структурированные секции");
console.log("2. 📊 Предоставлены конкретные данные и проценты");
console.log("3. 💡 Включены actionable рекомендации");
console.log("4. 🎨 Используется правильное цветовое кодирование");
console.log("5. 📈 Показываются соответствующие карточки метрик");
console.log("6. 🔄 Сохраняется обратная совместимость");

console.log("\n🚀 Для тестирования:");
console.log("1. Разверните функции: supabase functions deploy ai-assistant");
console.log("2. Запустите приложение: npm run dev");
console.log("3. Откройте чат с AI ассистентом");
console.log("4. Введите тестовые запросы");
console.log("5. Проверьте формат ответов");

console.log("\n📞 При проблемах:");
console.log("- Проверьте логи Supabase функций");
console.log("- Убедитесь в корректности OpenAI API ключа");
console.log("- Проверьте консоль браузера на ошибки"); 