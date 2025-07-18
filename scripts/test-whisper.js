#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testWhisperTurbo() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🎤 Testing Groq Whisper Large v3 Turbo...\n');

  // Create a test audio file (you'll need to have one)
  const testAudioPath = path.join(__dirname, 'test-audio.mp3');
  
  if (!fs.existsSync(testAudioPath)) {
    console.log('⚠️  No test audio file found. Creating a test with web audio...');
    
    // Download a sample audio file
    const sampleUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    const response = await fetch(sampleUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(testAudioPath, Buffer.from(buffer));
    console.log('✅ Downloaded test audio file\n');
  }

  // Test different models
  const models = [
    'whisper-large-v3-turbo',  // Primary - fast, cheap, no translation
    'whisper-large-v3',        // Full model - supports translation
    'distil-whisper-large-v3-en', // English only, even faster
  ];

  for (const model of models) {
    console.log(`\n📊 Testing model: ${model}`);
    console.log('─'.repeat(50));
    
    try {
      const formData = new FormData();
      const audioBlob = new Blob([fs.readFileSync(testAudioPath)], { type: 'audio/mpeg' });
      formData.append('file', audioBlob, 'test.mp3');
      formData.append('model', model);
      
      const startTime = Date.now();
      
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const elapsed = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success!');
        console.log(`⏱️  Response time: ${elapsed}ms`);
        console.log(`📝 Transcription: "${result.text.substring(0, 100)}..."`);
        console.log(`⏰ Audio duration: ${result.duration}s`);
        console.log(`🚀 Real-time factor: ${(result.duration * 1000 / elapsed).toFixed(1)}x`);
      } else {
        const error = await response.text();
        console.log('❌ Failed:', response.status);
        console.log('Error:', error);
      }
      
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
  }

  // Test translation capability
  console.log('\n\n🌍 Testing Translation (should fail with turbo)');
  console.log('─'.repeat(50));
  
  try {
    const formData = new FormData();
    const audioBlob = new Blob([fs.readFileSync(testAudioPath)], { type: 'audio/mpeg' });
    formData.append('file', audioBlob, 'test.mp3');
    formData.append('model', 'whisper-large-v3-turbo');
    
    const response = await fetch('https://api.groq.com/openai/v1/audio/translations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      console.log('⚠️  Translation unexpectedly succeeded with turbo model');
    } else {
      const error = await response.text();
      console.log('✅ Translation correctly failed for turbo model');
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }

  // Get region info
  console.log('\n\n🌐 Groq API Region Detection');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    // Log response headers to detect region
    console.log('Response headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.includes('region') || key.includes('cf-') || key.includes('x-')) {
        console.log(`  ${key}: ${value}`);
      }
    }
  } catch (error) {
    console.log('Could not detect region:', error.message);
  }
}

// Run the test
testWhisperTurbo().catch(console.error);