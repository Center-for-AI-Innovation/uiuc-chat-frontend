// Test script to verify logging is working
// Run this with: node test-logging.js (after starting your dev server)

const fetch = require('node-fetch');

async function testLogging() {
  console.log('🧪 Testing allNewRoutingChat endpoint logging...');
  
  const testData = {
    conversation: {
      id: 'test-123',
      name: 'Test Conversation',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello, this is a test message'
        }
      ],
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        tokenLimit: 8192,
        enabled: true
      },
      prompt: 'You are a helpful test assistant. This is a custom prompt for testing.',
      temperature: 0.7,
      folderId: null,
      customGptId: 'test-gpt-123'
    },
    course_name: 'test-course',
    stream: false, // Set to false for easier testing
    mode: 'chat'
  };

  try {
    console.log('📤 Sending test request...');
    const response = await fetch('http://localhost:3000/api/allNewRoutingChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    } else {
      console.log('✅ Request successful!');
      console.log('👀 Check your terminal running the dev server for the detailed logs!');
    }
  } catch (error) {
    console.error('❌ Error making request:', error.message);
    console.log('💡 Make sure your dev server is running on http://localhost:3000');
  }
}

testLogging(); 