// Test file for new AI assistant JSON format
// Run: node test-new-ai-format.js

const testQueries = [
  "Show key metrics",
  "What's the revenue performance?",
  "Tell me about patient acquisition",
  "Show me marketing ROI analysis",
  "What are the regional insights?"
];

console.log("🧪 Testing CLAIRE AI Assistant - New JSON Format");
console.log("===============================================\n");

async function testAIResponse(query) {
  try {
    console.log(`📝 Testing query: "${query}"`);
    
    const response = await fetch('https://thpnkluejymycxmiavjp.supabase.co/functions/v1/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5rbHVlanlteWN4bWlhdmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MzQ3NTEsImV4cCI6MjA2NjAxMDc1MX0.wAhVH9qzXNI9aQIDw2Oln3MdOq0x59QobzhZSNmnTyY'
      },
      body: JSON.stringify({ message: query })
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}`);
      console.error(`❌ Error response: ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('✅ Response received');
    console.log('📄 Raw response:', JSON.stringify(data, null, 2));
    
    // Check if response contains JSON structure
    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.report && parsed.report.sections) {
          console.log(`✅ Valid JSON structure found with ${parsed.report.sections.length} sections`);
          
          // Validate structure
          const isValid = parsed.report.sections.every(section => 
            section.title && 
            section.short && 
            section.full && 
            Array.isArray(section.full.snapshot) && 
            section.full.snapshot.length === 2 &&
            section.full.chart &&
            Array.isArray(section.full.recommendations) && 
            section.full.recommendations.length === 2
          );
          
          if (isValid) {
            console.log('✅ All sections have correct structure');
            console.log('📊 Sample section titles:');
            parsed.report.sections.forEach((section, index) => {
              console.log(`   ${index + 1}. ${section.title}`);
            });
          } else {
            console.log('❌ Invalid section structure');
          }
        } else {
          console.log('❌ No report.sections found in JSON');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON:', parseError.message);
      }
    } else {
      console.log('❌ No JSON structure found in response');
      console.log('📄 Response content:', data.response);
    }
    
    console.log('---\n');
    
  } catch (error) {
    console.error(`❌ Error testing query "${query}":`, error.message);
    console.log('---\n');
  }
}

// Run tests
async function runTests() {
  for (const query of testQueries) {
    await testAIResponse(query);
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎉 Testing completed!');
}

// Run a single test first
console.log('🚀 Running single test...\n');
testAIResponse("Show key metrics");

// Uncomment to run all tests
// runTests();
