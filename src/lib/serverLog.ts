// Server-side logging utility
export async function serverLog(message: string, level: 'info' | 'error' | 'warn' | 'debug' | 'success' = 'info') {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, level }),
    });
  } catch (error) {
    // Fallback to console if server logging fails
    console.log(`[ServerLog Failed] ${message}`);
  }
}