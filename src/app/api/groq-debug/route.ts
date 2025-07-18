import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    console.log('\n🔍 GROQ DEBUG - Making test request...');
    
    // Make a raw fetch request to capture all headers
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
        temperature: 0,
      }),
    });

    // Capture all response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Log headers to terminal
    console.log('\n📋 RESPONSE HEADERS:');
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Parse response body
    const data = await response.json();

    // Try to determine region from various sources
    const regionInfo = {
      headers,
      possibleRegion: headers['x-region'] || headers['x-groq-region'] || 'Not exposed',
      cfRay: headers['cf-ray'] || 'N/A',
      server: headers['server'] || 'N/A',
      via: headers['via'] || 'N/A',
      responseTime: headers['x-response-time'] || 'N/A',
    };

    // If cf-ray exists, parse it
    if (headers['cf-ray']) {
      const cfParts = headers['cf-ray'].split('-');
      if (cfParts.length >= 2) {
        regionInfo.cfDatacenter = cfParts[cfParts.length - 1];
      }
    }

    console.log('\n🌍 REGION ANALYSIS:');
    console.log(JSON.stringify(regionInfo, null, 2));

    return NextResponse.json({
      debug: true,
      regionInfo,
      response: data,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ GROQ DEBUG ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to debug Groq connection', details: String(error) },
      { status: 500 }
    );
  }
}