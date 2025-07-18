export function splitMessageIntoChunks(text: string): string[] {
  // If the message is short, return as is
  if (text.length < 100) {
    return [text.trim()];
  }

  // Split by multiple newlines first (paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  const chunks: string[] = [];
  
  for (const paragraph of paragraphs) {
    // If paragraph is short enough, add as is
    if (paragraph.length < 150) {
      chunks.push(paragraph.trim());
      continue;
    }
    
    // Split longer paragraphs by sentences
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
    
    let currentChunk = '';
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // If adding this sentence would make chunk too long, push current and start new
      if (currentChunk && (currentChunk.length + trimmedSentence.length > 200)) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk = currentChunk ? `${currentChunk} ${trimmedSentence}` : trimmedSentence;
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
  }
  
  // Filter out empty chunks and return
  return chunks.filter(chunk => chunk.length > 0);
}

export function shouldSplitMessage(content: string, role: 'user' | 'assistant' | 'system'): boolean {
  // Only split assistant messages in text mode
  // User messages typically are shorter and more natural as single bubbles
  return role === 'assistant' && content.length > 100;
}