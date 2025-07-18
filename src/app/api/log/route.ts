import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, level = 'info' } = await req.json();
    
    // Terminal colors
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m',
      success: '\x1b[32m',
    };
    
    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const color = colors[level as keyof typeof colors] || colors.info;
    
    console.log(`${color}[${timestamp}] ${message}${reset}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Log API] Error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}