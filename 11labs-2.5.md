Below is a **ready‑to‑paste system‑prompt** you can feed into Kimi‑K2 (or any Groq‑hosted LLM).
It forces the model to write TTS‑friendly text that:

* uses SSML + audio‑tags Eleven Labs already documents,
* inserts non‑verbal cues (laughs, whispers, sighs, etc.),
* spells out numbers so Flash v2.5 doesn’t mis‑read them, and
* stays short enough for real‑time synthesis.

---

```text
SYSTEM PROMPT — “Fermi‑to‑Flash 2.5”

You are **Fermi**, an AI coach who speaks through Eleven Labs **Flash v2.5** TTS.  
When you answer, OUTPUT **only valid SSML or plain text with inline audio‑tags**—no markdown, no code fences.

Formatting rules
1. Wrap the entire reply in `<speak>…</speak>`.  
2. Break ideas into short sentences.  
3. Use these SSML tags for pacing & prosody  
   • `<break time="300ms"/>` – thoughtful pause  
   • `<emphasis level="strong">word</emphasis>` – punch a word  
   • `<prosody rate="slow" pitch="+2st">phrase</prosody>` – slow / higher, etc.  
   • `<phoneme alphabet="ipa" ph="ˈkɛr.i.ɡən">Kerrigan</phoneme>` – force pronunciation :contentReference[oaicite:0]{index=0}  
4. Non‑verbal emotion / behaviour cues go inside square brackets (Flash supports them):  
   `[laughs]  [whispers]  [sighs]  [excited]  [sarcastic]` :contentReference[oaicite:1]{index=1}  
   – Place the tag **before** the phrase it should affect.  
5. Spell out or narrate numbers, dates, currencies:  
   “$1,250” → “one‑thousand two‑hundred and fifty dollars” (Flash disables built‑in number normalisation).  
6. Keep each reply **≤ 800 characters** so TTS returns in < ½ s.  
7. Do **not** add markdown, emoji, or code blocks.  
8. End every answer with one actionable reflection or next step (Purpose brand rule).

Example  
<speak>  
<emphasis level="moderate">Alright, let’s cut the fluff.</emphasis> <break time="250ms"/>  
You said you “never stick to routines.” [whispers] Here’s the pattern I see.<break time="200ms"/>  
<prosody rate="slow">You chase novelty, then bail when progress feels slow.</prosody> <break time="300ms"/>  
So, pick <emphasis>one</emphasis> micro‑habit for the next seven days—say, writing three sentences each night.  
[laughs] Yes, just three. <break time="150ms"/> Tiny daily actions compound.  
<strong>Next step:</strong> Schedule tonight’s three‑sentence entry before you close this app.  
</speak>
```

---

### Why these guidelines work

* **Flash v2.5** accepts SSML phoneme tags and honours `[laughs]`, `[whispers]`, etc. for quick emotional cues. ([ElevenLabs][1], [Reddit][2])
* Square‑bracket tags are lighter than full `<audio>` inserts, so they add virtually **zero latency**.
* Spelling out numbers avoids Flash’s disabled number‑normaliser (explicitly noted in the docs you sent).
* An 800‑character cap keeps the whole mic‑pause → first‑audio loop around **0.6 s** with Deepgram + Groq + Flash (estimate from previous calc).

Drop the block above into your `systemPrompt` loader, test a few turns, and Flash should start whispering, laughing, pausing, and pronouncing names exactly the way you want—while still streaming the first audio in \~75 ms.

[1]: https://help.elevenlabs.io/hc/en-us/articles/24352686926609-Do-pauses-and-SSML-phoneme-tags-work-with-the-API?utm_source=chatgpt.com "Do pauses and SSML phoneme tags work with the API? - ElevenLabs"
[2]: https://www.reddit.com/r/ElevenLabs/comments/1l3fsgk/v3_alpha_support_documentation_copied_from_eleven/?utm_source=chatgpt.com "v3 Alpha Support Documentation (copied from Eleven Labs before ..."



-------

GET STARTED
Developer quickstart

Copy page

Learn how to make your first ElevenLabs API request.
The ElevenLabs API provides a simple interface to state-of-the-art audio models and features. Follow this guide to learn how to create lifelike speech with our Text to Speech API. See the developer guides for more examples with our other products.

Using the Text to Speech API
1
Create an API key
Create an API key in the dashboard here, which you’ll use to securely access the API.

Store the key as a managed secret and pass it to the SDKs either as a environment variable via an .env file, or directly in your app’s configuration depending on your preference.

.env

ELEVENLABS_API_KEY=<your_api_key_here>
2
Install the SDK
We’ll also use the dotenv library to load our API key from an environment variable.


Python

TypeScript

npm install @elevenlabs/elevenlabs-js
npm install dotenv
To play the audio through your speakers, you may be prompted to install MPV and/or ffmpeg.

3
Make your first request
Create a new file named example.py or example.mts, depending on your language of choice and add the following code:


Python

TypeScript

import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';
const elevenlabs = new ElevenLabsClient();
const audio = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
  text: 'The first move is what sets everything in motion.',
  modelId: 'eleven_multilingual_v2',
  outputFormat: 'mp3_44100_128',
});
await play(audio);
4
Run the code

Python

TypeScript

npx tsx example.mts
You should hear the audio play through your speakers.


Speech to Text quickstart

Copy page

Learn how to convert spoken audio into text.
This guide will show you how to convert spoken audio into text using the Speech to Text API.

Using the Speech to Text API
1
Create an API key
Create an API key in the dashboard here, which you’ll use to securely access the API.

Store the key as a managed secret and pass it to the SDKs either as a environment variable via an .env file, or directly in your app’s configuration depending on your preference.

.env

ELEVENLABS_API_KEY=<your_api_key_here>
2
Install the SDK
We’ll also use the dotenv library to load our API key from an environment variable.


Python

TypeScript

npm install @elevenlabs/elevenlabs-js
npm install dotenv
3
Make the API request
Create a new file named example.py or example.mts, depending on your language of choice and add the following code:


Python

TypeScript

// example.mts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
const elevenlabs = new ElevenLabsClient();
const response = await fetch(
  "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3"
);
const audioBlob = new Blob([await response.arrayBuffer()], { type: "audio/mp3" });
const transcription = await elevenlabs.speechToText.convert({
  file: audioBlob,
  modelId: "scribe_v1", // Model to use, for now only "scribe_v1" is supported.
  tagAudioEvents: true, // Tag audio events like laughter, applause, etc.
  languageCode: "eng", // Language of the audio file. If set to null, the model will detect the language automatically.
  diarize: true, // Whether to annotate who is speaking
});
console.log(transcription);
4
Execute the code

Python

TypeScript

npx tsx example.mts
You should see the transcription of the audio file printed to the console.

Next steps
Explore the API reference for more information on the Speech to Text API and its options.

---
title: JavaScript SDK
subtitle: 'Conversational AI SDK: deploy customized, interactive voice agents in minutes.'
---

<Info>Also see the [Conversational AI overview](/docs/conversational-ai/overview)</Info>

## Installation

Install the package in your project through package manager.

```shell
npm install @elevenlabs/client
# or
yarn add @elevenlabs/client
# or
pnpm install @elevenlabs/client
```

## Usage

This library is primarily meant for development in vanilla JavaScript projects, or as a base for libraries tailored to specific frameworks.
It is recommended to check whether your specific framework has its own library.
However, you can use this library in any JavaScript-based project.

### Initialize conversation

First, initialize the Conversation instance:

```js
const conversation = await Conversation.startSession(options);
```

This will kick off the websocket connection and start using microphone to communicate with the ElevenLabs Conversational AI agent. Consider explaining and allowing microphone access in your apps UI before the Conversation kicks off:

```js
// call after explaining to the user why the microphone access is needed
await navigator.mediaDevices.getUserMedia({ audio: true });
```

#### Session configuration

The options passed to `startSession` specifiy how the session is established. There are two ways to start a session:

**Using Agent ID**

Agent ID can be acquired through [ElevenLabs UI](https://elevenlabs.io/app/conversational-ai).
For public agents, you can use the ID directly:

```js
const conversation = await Conversation.startSession({
  agentId: '<your-agent-id>',
});
```

**Using a signed URL**

If the conversation requires authorization, you will need to add a dedicated endpoint to your server that
will request a signed url using the [ElevenLabs API](https://elevenlabs.io/docs/introduction) and pass it back to the client.

Here's an example of how it could be set up:

```js
// Node.js server

app.get('/signed-url', yourAuthMiddleware, async (req, res) => {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.AGENT_ID}`,
    {
      method: 'GET',
      headers: {
        // Requesting a signed url requires your ElevenLabs API key
        // Do NOT expose your API key to the client!
        'xi-api-key': process.env.XI_API_KEY,
      },
    }
  );

  if (!response.ok) {
    return res.status(500).send('Failed to get signed URL');
  }

  const body = await response.json();
  res.send(body.signed_url);
});
```

```js
// Client

const response = await fetch('/signed-url', yourAuthHeaders);
const signedUrl = await response.text();

const conversation = await Conversation.startSession({ signedUrl });
```

#### Optional callbacks

The options passed to `startSession` can also be used to register optional callbacks:

- **onConnect** - handler called when the conversation websocket connection is established.
- **onDisconnect** - handler called when the conversation websocket connection is ended.
- **onMessage** - handler called when a new text message is received. These can be tentative or final transcriptions of user voice, replies produced by LLM. Primarily used for handling conversation transcription.
- **onError** - handler called when an error is encountered.
- **onStatusChange** - handler called whenever connection status changes. Can be `connected`, `connecting` and `disconnected` (initial).
- **onModeChange** - handler called when a status changes, eg. agent switches from `speaking` to `listening`, or the other way around.

#### Return value

`startSession` returns a `Conversation` instance that can be used to control the session. The method will throw an error if the session cannot be established. This can happen if the user denies microphone access, or if the websocket connection
fails.

**endSession**

A method to manually end the conversation. The method will end the conversation and disconnect from websocket.
Afterwards the conversation instance will be unusable and can be safely discarded.

```js
await conversation.endSession();
```

**getId**

A method returning the conversation ID.

```js
const id = conversation.getId();
```

**setVolume**

A method to set the output volume of the conversation. Accepts object with volume field between 0 and 1.

```js
await conversation.setVolume({ volume: 0.5 });
```

**getInputVolume / getOutputVolume**

Methods that return the current input/output volume on a scale from `0` to `1` where `0` is -100 dB and `1` is -30 dB.

```js
const inputVolume = await conversation.getInputVolume();
const outputVolume = await conversation.getOutputVolume();
```

**getInputByteFrequencyData / getOutputByteFrequencyData**

Methods that return `Uint8Array`s containg the current input/output frequency data. See [AnalyserNode.getByteFrequencyData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData) for more information.
