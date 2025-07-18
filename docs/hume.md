---
title: Text-to-speech (TTS)
excerpt: >-
  Introduction to Hume's TTS API, including its features, usage limits, and key
  concepts for integration.
---

**Octave TTS**, the first text-to-speech system built on LLM intelligence. Unlike conventional TTS that merely “reads”
words, Octave is a “speech-language model” that understands what words mean in context, unlocking a new level of
expressiveness and nuance.

At Octave’s core it is a state-of-the-art large language model (LLM) that Hume AI trained to understand and synthesize
speech. This speech-language model can predict the tune, rhythm and timbre of speech, knowing when to whisper secrets,
shout triumphantly, or calmly explain a fact. This combined approach lets Octave interpret plot twists, emotional cues,
and character traits within a script or prompt, then transform that understanding into lifelike speech.

<Callout intent="info">
  You retain full ownership of any audio content you generate using Octave. For complete details on
  ownership rights, please see Hume's [Terms of
  Use](https://www.hume.ai/terms-of-use#user-content-and-voice-models).
</Callout>

## Features

<table>
  <tbody>
    <tr>
      <td rowSpan="4"> **Key capabilities** </td>
      <td> **Context-aware expression** </td>
      <td>
        Because Octave’s LLM recognizes nuanced meanings, it adapts pitch, tempo, and emphasis to
        match each word’s emotional intent.
      </td>
    </tr>
    <tr>
      <td> **Design any voice you can imagine** </td>
      <td>
        From describing a _“patient, empathetic counselor”_ to requesting a _“dramatic medieval
        knight,”_ Octave instantly creates a fitting voice. See
        [Prompting](/docs/text-to-speech-tts/prompting).
      </td>
    </tr>
    <tr>
      <td> **Nuanced expression control** </td>
      <td>
        Want a sentence spoken in a particular way with the right emphasis? Octave can emulate any
        emotions or styles you describe from _“righteous indignation”_ to _“hurried whispering.”_
        See [Acting
        Instructions](/docs/text-to-speech-tts/prompting#creating-effective-acting-instructions).
      </td>
    </tr>
    <tr>
      <td> **Long-form versatility** </td>
      <td>
        Perfect for audiobooks, podcasts, or voiceover work, Octave preserves emotional consistency
        across chapters or scene changes—even when characters shift from joy to despair.
      </td>
    </tr>
    <tr>
      <td rowSpan="5"> **Developer tools** </td>
      <td> [REST API](/reference/text-to-speech-tts/synthesize-json) </td>
      <td>
        A RESTful API that enables text-to-speech (TTS) integration with Octave. Use this API to
        synthesize speech, customize voice parameters, and create and store reusable voice profiles.
      </td>
    </tr>
    <tr>
      <td> [Python SDK](https://github.com/HumeAI/hume-python-sdk) </td>
      <td>
        A wrapper for Octave's TTS services that simplifies voice synthesis in Python applications.
      </td>
    </tr>
    <tr>
      <td> [TypeScript SDK](https://www.npmjs.com/package/hume) </td>
      <td>
        A strongly-typed library that streamlines Octave TTS integration in TypeScript and
        JavaScript applications.
      </td>
    </tr>
    <tr>
      <td> [CLI](https://www.npmjs.com/package/@humeai/cli) </td>
      <td>
        A command-line tool that allows direct interaction with Octave’s TTS API, ideal for testing,
        automation, and rapid prototyping.
      </td>
    </tr>
    <tr>
      <td> [Open source examples](https://github.com/HumeAI/hume-api-examples) </td>
      <td>Example projects to serve as reference code to jump-start your development.</td>
    </tr>
  </tbody>
</table>

## Quickstart

Accelerate your project setup with our comprehensive quickstart guides, designed to integrate Octave TTS into your
TypeScript or Python applications. Each guide walks you through API integration and demonstrates text-to-speech
synthesis, helping you get up and running quickly.

<CardGroup>
  <Card
    title="TypeScript"
    icon={
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg"
        alt="TypeScript logo"
      />
    }
    href="/docs/text-to-speech-tts/quickstart/typescript"
  >
    Integrate Octave TTS into web and Node.js applications using our TypeScript SDK.
  </Card>
  <Card
    title="Python"
    icon={
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg"
        alt="Python logo"
      />
    }
    href="/docs/text-to-speech-tts/quickstart/python"
  >
    Use our Python SDK to integrate Octave TTS into your Python applications.
  </Card>
  <Card title="CLI" icon="square-terminal" href="/docs/text-to-speech-tts/quickstart/cli">
    Get started synthesizing text-to-speech with our command-line tool.
  </Card>
</CardGroup>

## Using the Text-to-Speech API

Use the Octave TTS API to generate expressive, human-like speech from text. Optionally include voice prompts or acting
instructions to control how the speech is delivered, and receive synthesized audio in your chosen format. The API
supports synchronous and streaming **response types**:

1. **Synchronous responses**: Receive the complete audio result in a single HTTP response.
2. **Streaming responses**: Receive audio in real-time chunks as it’s generated.

<Callout type="info">
  Authentication is required for all API requests. Learn more in the [Authentication
  Strategies](/docs/introduction/api-key#authentication-strategies) guide.
</Callout>

### Glossary

The following terms are fundamental to using the TTS API:

<Table>
  <tbody>
    <tr>
      <td> **Term** </td>
      <td> **Definition** </td>
    </tr>
    <tr>
      <td>[`Utterance`](/reference/text-to-speech-tts/synthesize-json#request.body.utterances)</td>
      <td>
        The primary input unit. Contains required `text`, optional `voice` (`name`/`id`),
        `description` (voice prompt if `voice` omitted; acting instructions if `voice` provided),
        `speed`, `trailing_silence`.
      </td>
    </tr>
    <tr>
      <td>
        [`Generation`](/reference/text-to-speech-tts/synthesize-json#response.body.generations)
      </td>
      <td>
        Represents the synthesized audio output. Includes `audio` data, `generation_id`, `duration`,
        `encoding` details, `file_size`, and the `snippets` array.
      </td>
    </tr>
    <tr>
      <td>
        [`Snippet`](/reference/text-to-speech-tts/synthesize-json#response.body.generations.snippets)
      </td>
      <td>
        An individual segment of synthesized audio within a `Generation`. Contains its own `audio`
        chunk, the corresponding source `text` segment from the input, and a unique `id`.
      </td>
    </tr>
  </tbody>
</Table>

### Voice Selection

You can control which voice is used in one of two ways:

- **Dynamic generation** – Leave the `voice` field blank and provide a `description` to guide generation.
- **Predefined voice** – Specify a voice by `name` or `id` from your Custom Voices or Hume’s [Voice Library](https://platform.hume.ai/tts/voice-library).

For more on creating, saving, and managing voices, see the [Voices Guide](/docs/text-to-speech-tts/voices).

### Request and response workflow

An API request contains one or more **Utterances**. The response includes one or more **Generations** (controlled by the
[`num_generations`](/reference/text-to-speech-tts/synthesize-json) parameter). Each **Generation** contains a `snippets`
array, which groups the resulting **Snippet**(s) corresponding to the input **Utterances**.

#### Segmentation

By default, Octave automatically segments each **Generation** into multiple **Snippets** to optimize for natural speech flow. These snippets represent coherent segments of audio output, which may not directly map to the boundaries of the input **Utterances**.

To disable this behavior and enforce a strict 1:1 mapping—one **Snippet** per **Utterance** group—set [`split_utterances`](/reference/text-to-speech-tts/synthesize-json#request.body.split_utterances) to `false` in your request. This ensures that each input utterance results in a single, unsegmented audio unit in the response.

<Callout type="info">
  For a complete list of all request parameters, response fields, endpoint formats, and technical
  specifications, consult the [API Reference](/reference/text-to-speech-tts/synthesize-json).
</Callout>

### Response Types

Octave TTS supports two response types: **synchronous** and **streaming**. Choose the one that best fits your latency
requirements and how you plan to handle audio output.

#### Synchronous Requests

Synchronous endpoints return the complete audio result after the request is fully processed. These are best for use
cases where latency is less important and you want the full result before playback or storage.

- **JSON response** ([`/v0/tts`](/reference/text-to-speech-tts/synthesize-json))

  Returns a JSON object containing the full audio as a base64-encoded string.  
  Best for previewing short clips or handling audio immediately in your application.

- **File response** ([`/v0/tts/file`](/reference/text-to-speech-tts/synthesize-file))

  Returns audio as a downloadable file (e.g., `audio/mpeg`).  
  Best for saving audio or serving it from your backend.

#### Streaming Requests

Streaming endpoints return audio in real time as it’s generated, allowing playback to begin sooner and reducing
perceived latency. These responses are delivered over an HTTP connection using chunked transfer encoding.

- **Streamed JSON response** ([`/v0/tts/stream/json`](/reference/text-to-speech-tts/synthesize-json-streaming))

  Returns a stream of JSON objects, each containing a chunk of the synthesized audio (base64-encoded) and associated metadata.
  Best for real-time applications that need audio and metadata together.

  By default, each audio chunk will be a whole audio file complete with headers. Use the [`strip_headers` field](/reference/text-to-speech-tts/synthesize-json-streaming#request.body.strip_headers) to instead receive the streamed bytes of a single, long audio file.

  <Callout intent="warning">
    If you hear audio artifacts or "glitches" while using streamed JSON, you may be playing back the
    concatenated audio chunks as a single audio file. To remove the artifacts, either pass
    `"strip_headers": true` in the request body, play back each audio chunk as a separate file, or
    use the streamed file response instead.
  </Callout>

- **Streamed file response** ([`/v0/tts/stream/file`](/reference/text-to-speech-tts/synthesize-file-streaming))

  Returns a continuous stream of raw audio chunks (e.g., `audio/mpeg`).  
  Best for media pipelines or players that support HTTP audio streaming.

### Ultra low latency streaming: instant mode

Instant mode is a low-latency streaming mode designed for real-time applications where audio playback should begin as
quickly as possible. Unlike standard streaming—which introduces a brief lead time before the first audio chunk is
sent—instant mode begins streaming audio as soon as generation starts. **Instant mode is enabled by default.**

#### How instant mode works
- No lead time is introduced—the server streams audio as soon as it's available.
- Audio is delivered in smaller sub-snippet chunks (`~1` second each).
- First audio is typically ready within `~200ms`, depending on system load and input complexity.

Instant mode does not change the format of streamed responses—each chunk includes the same metadata; however chunks in
instant mode will be smaller and begin to arrive more quickly.

#### Configuring instant mode

- Use the [`instant_mode`](/reference/text-to-speech-tts/synthesize-json-streaming#request.body.instant_mode) field to
  explicitly enable or disable instant mode.
- Specify a predefined [`voice`](/reference/text-to-speech-tts/synthesize-json-streaming#request.body.utterances.voice)
  by `name` or `id`—this is required when using instant mode.
- Set [`num_generations`](/reference/text-to-speech-tts/synthesize-json-streaming#request.body.num_generations) to `1`
  or omit it.

#### When to disable instant mode

- For voice design workflows—where no predefined voice is specified—disable instant mode to enable dynamic voice
  generation.
- When generating multiple candidates in a single request (`num_generations > 1`), disable instant mode to
  support comparative or exploratory generation.

## API limits

- **Request rate limit**: 100 requests per minute
- **Maximum text length**: 5,000 characters
- **Maximum description length**: 1,000 characters
- **Maximum generations per request**: 5
- **Supported audio formats**: `MP3`, `WAV`, `PCM`

---




Hume AI TypeScript SDK
Integrate Hume APIs directly into your Node application or frontend


 

Documentation
API reference documentation is available here.

Installation
npm i hume
Usage
import { HumeClient } from "hume";

const hume = new HumeClient({
    apiKey: "YOUR_API_KEY",
});

const job = await hume.expressionMeasurement.batch.startInferenceJob({
    models: {
        face: {},
    },
    urls: ["https://hume-tutorials.s3.amazonaws.com/faces.zip"],
});

console.log("Running...");

await job.awaitCompletion();

const predictions = await hume.expressionMeasurement.batch.getJobPredictions(job.jobId);

console.log(predictions);
Namespaces
This SDK contains the APIs for expression measurement, empathic voice and custom models. Even if you do not plan on using more than one API to start, the SDK provides easy access in case you find additional APIs in the future.

Each API is namespaced accordingly:

import { HumeClient } from "hume";

const hume = new HumeClient({
    apiKey: "YOUR_API_KEY"
});

hume.expressionMeasurement. // APIs specific to Expression Measurement

hume.emapthicVoice. // APIs specific to Empathic Voice
Websockets
The SDK supports interacting with both WebSocket and REST APIs.

Request-Reply
The SDK supports a request-reply pattern for the streaming expression measurement API. You'll be able to pass an inference request and await till the response is received.

import { HumeClient } from "hume";

const hume = new HumeClient({
    apiKey: "YOUR_API_KEY",
});

const socket = hume.expressionMeasurement.stream.connect({
    config: {
        language: {},
    },
});

for (const sample of samples) {
    const result = await socket.sendText({ text: sample });
    console.log(result);
}
Empathic Voice
The SDK supports sending and receiving audio from Empathic Voice.

import { HumeClient } from "hume";

const hume = new HumeClient({
    apiKey: "<>",
    secretKey: "<>",
});

const socket = hume.empathicVoice.chat.connect();

socket.on("message", (message) => {
    if (message.type === "audio_output") {
        const decoded = Buffer.from(message.data, "base64");
        // play decoded message
    }
});

// optional utility to wait for socket to be open
await socket.tillSocketOpen();

socket.sendUserInput("Hello, how are you?");
Errors
When the API returns a non-success status code (4xx or 5xx response), a subclass of HumeError will be thrown:

import { HumeError, HumeTimeoutError } from "hume";

try {
    await hume.expressionMeasurement.batch.startInferenceJob(/* ... */);
} catch (err) {
    if (err instanceof HumeTimeoutError) {
        console.log("Request timed out", err);
    } else if (err instanceof HumeError) {
        // catch all errros
        console.log(err.statusCode);
        console.log(err.message);
        console.log(err.body);
    }
}
Retries
409 Conflict, 429 Rate Limit, and >=500 Internal errors will all be retried twice with exponential bakcoff. You can use the maxRetries option to configure this behavior:

await hume.expressionMeasurement.batch.startInferenceJob(..., {
    maxRetries: 0, // disable retries
});
Timeouts
By default, the SDK has a timeout of 60s. You can use the timeoutInSeconds option to configure this behavior

await hume.expressionMeasurement.batch.startInferenceJob(..., {
    timeoutInSeconds: 10, // timeout after 10 seconds
});
Beta Status
This SDK is in beta, and there may be breaking changes between versions without a major version update. Therefore, we recommend pinning the package version to a specific version. This way, you can install the same version each time without breaking changes.

Contributing
While we value open-source contributions to this SDK, this library is generated programmatically. Additions made directly to this library would have to be moved over to our generation code, otherwise they would be overwritten upon the next generated release. Feel free to open a PR as a proof of concept, but know that we will not be able to merge it as-is. We suggest opening an issue first to discuss with us!

On the other hand, contributions to the README are always very welcome!
