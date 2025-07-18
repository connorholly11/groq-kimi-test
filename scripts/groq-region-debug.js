const dns = require('dns').promises;
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function debugGroqRegion() {
  console.log('\n🔍 GROQ REGION DEBUGGING\n');
  
  // 1. DNS Resolution
  console.log('1️⃣ DNS RESOLUTION:');
  try {
    const addresses = await dns.resolve4('api.groq.com');
    console.log('   IP addresses for api.groq.com:', addresses);
    
    // Reverse DNS lookup
    for (const ip of addresses) {
      try {
        const hostnames = await dns.reverse(ip);
        console.log(`   ${ip} resolves to:`, hostnames);
      } catch (e) {
        console.log(`   ${ip} - No reverse DNS`);
      }
    }
  } catch (error) {
    console.error('   DNS resolution failed:', error.message);
  }

  // 2. Make HTTPS request with detailed logging
  console.log('\n2️⃣ HTTPS REQUEST DETAILS:');
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('   ❌ GROQ_API_KEY not found in environment');
    return;
  }

  const postData = JSON.stringify({
    model: 'moonshotai/kimi-k2-instruct',
    messages: [{ role: 'user', content: 'Hi' }],
    max_tokens: 1,
  });

  const options = {
    hostname: 'api.groq.com',
    port: 443,
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    console.log('   Status:', res.statusCode);
    console.log('   Headers:');
    Object.entries(res.headers).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });

    // Socket information
    const socket = res.socket;
    console.log('\n3️⃣ CONNECTION INFO:');
    console.log('   Local address:', socket.localAddress + ':' + socket.localPort);
    console.log('   Remote address:', socket.remoteAddress + ':' + socket.remotePort);

    // Consume response
    res.on('data', () => {});
    res.on('end', () => {
      console.log('\n✅ Request completed');
      analyzeResults(res.headers);
    });
  });

  req.on('error', (e) => {
    console.error('   Request error:', e);
  });

  req.write(postData);
  req.end();
}

function analyzeResults(headers) {
  console.log('\n📊 ANALYSIS:');
  
  // Check for Cloudflare
  if (headers['cf-ray']) {
    const ray = headers['cf-ray'];
    const parts = ray.split('-');
    const datacenter = parts[parts.length - 1];
    console.log('   Cloudflare Ray ID:', ray);
    console.log('   Cloudflare Datacenter:', datacenter);
    
    // Common CF datacenter codes
    const cfDatacenters = {
      'IAD': 'Ashburn, Virginia (US-East)',
      'ORD': 'Chicago, Illinois (US-Central)',
      'DFW': 'Dallas, Texas (US-South)',
      'SJC': 'San Jose, California (US-West)',
      'LAX': 'Los Angeles, California (US-West)',
      'SEA': 'Seattle, Washington (US-Northwest)',
      'LHR': 'London, UK',
      'CDG': 'Paris, France',
      'FRA': 'Frankfurt, Germany',
      'AMS': 'Amsterdam, Netherlands',
      'SIN': 'Singapore',
      'SYD': 'Sydney, Australia',
      'NRT': 'Tokyo, Japan',
    };
    
    if (cfDatacenters[datacenter]) {
      console.log('   📍 Likely Region:', cfDatacenters[datacenter]);
    }
  }
  
  // Check other headers
  if (headers['x-region'] || headers['x-groq-region']) {
    console.log('   Groq Region:', headers['x-region'] || headers['x-groq-region']);
  }
  
  if (headers['server']) {
    console.log('   Server:', headers['server']);
  }
}

// Run the debug
debugGroqRegion();