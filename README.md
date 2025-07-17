# Groq Kimi Chat Test:

A Next.js chat application using Groq's Kimi K2 model with local storage persistence.

## Features

- 🤖 Chat with Groq's `moonshotai/kimi-k2-instruct` model (128K context)
- 💬 Multiple concurrent chat threads
- 🎯 Customizable system prompts
- 💾 Local storage persistence (no database required)
- 🔒 Secure API proxy (keeps your Groq API key server-side)
- ⚡ Real-time streaming responses
- 🔄 Automatic message trimming (100 messages per chat)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/groq-kimi-test.git
cd groq-kimi-test
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Groq API key:
```
GROQ_API_KEY=your-groq-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

- **New Chat**: Click "New Chat" in the sidebar
- **System Prompts**: Click the settings icon to change the system prompt for the current chat
- **Manage Prompts**: Click "Edit Prompts" to create and manage reusable system prompts
- **Delete Chat**: Hover over a chat in the sidebar and click the trash icon

## Architecture

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Vercel AI SDK** for streaming responses
- **localStorage** for data persistence

## Security

The application uses a server-side API proxy to keep your Groq API key secure. The key is never exposed to the client-side code.

## License

MIT
