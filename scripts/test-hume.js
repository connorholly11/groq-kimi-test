#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testHumeAPI() {
  const { HUME_API_KEY, HUME_SECRET_KEY } = process.env;
  
  if (!HUME_API_KEY || !HUME_SECRET_KEY) {
    console.error('❌ Missing HUME_API_KEY or HUME_SECRET_KEY in environment');
    process.exit(1);
  }

  console.log('🎤 Testing Hume Octave TTS...\n');

  const testCases = [
    {
      name: 'With voice description',
      payload: {
        utterances: [{
          text: "Hello, this is a test of Hume's text to speech.",
          description: "Male voice, mid-30s, slightly gravelly, conversational"
        }],
        format: { type: 'mp3' },
        num_generations: 1
      }
    },
    {
      name: 'With voice name',
      payload: {
        utterances: [{
          text: "Testing with a named voice.",
          voice: { name: 'default' }
        }],
        format: { type: 'mp3' }
      }
    }
  ];

  for (const test of testCases) {
    console.log(`\n📊 Test: ${test.name}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch('https://api.hume.ai/v0/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hume-Api-Key': HUME_API_KEY,
          'X-Hume-Secret-Key': HUME_SECRET_KEY,
        },
        body: JSON.stringify(test.payload),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        console.log(`Generations: ${data.generations?.length || 0}`);
        if (data.generations?.[0]) {
          const gen = data.generations[0];
          console.log(`Audio size: ${gen.audio ? gen.audio.length : 0} chars (base64)`);
          console.log(`Duration: ${gen.duration}s`);
          console.log(`Sample rate: ${gen.sample_rate} Hz`);
        }
      } else {
        const error = await response.text();
        console.log('❌ Failed');
        try {
          const errorJson = JSON.parse(error);
          console.log('Error:', JSON.stringify(errorJson, null, 2));
        } catch {
          console.log('Error:', error);
        }
      }
    } catch (err) {
      console.log('❌ Exception:', err.message);
    }
  }
}

testHumeAPI().catch(console.error);