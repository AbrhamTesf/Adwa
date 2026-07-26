const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 1. Load environment variables from root or backend/.env
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', '.env'),
  path.join(__dirname, '../backend/.env'),
  path.join(__dirname, '../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// Mask sensitive key for logging
function maskKey(key) {
  if (!key) return 'MISSING';
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// Generate dummy 0.5s silence WAV audio buffer for Groq Whisper test
function createDummyWavBuffer() {
  const sampleRate = 8000;
  const numSamples = sampleRate * 0.5;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // Mono channel
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

async function runVoiceKeysTest() {
  console.log('====================================================');
  console.log(' FEAT-009: Voice Guide RAG Pipeline API Key Tester ');
  console.log('====================================================\n');

  let overallSuccess = true;

  // ----------------------------------------------------
  // STEP 1: Environment Variable Check
  // ----------------------------------------------------
  console.log('[CHECK] 1. Validating Environment Variables...');

  const groqApiKey = process.env.GROQ_API_KEY;
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  let rawVoiceId = process.env.ELEVENLABS_VOICE_ID || process.env.ELEVENLABS_VOICE_ID_KIDS;
  const DEFAULT_PUBLIC_VOICE_ID = 'cgSgspJ2msm6clMCkdW9'; // Jessica (Playful, Bright, Warm - Kids Persona)

  if (groqApiKey) {
    console.log(`  [SUCCESS] GROQ_API_KEY found: ${maskKey(groqApiKey)}`);
  } else {
    console.log('  [FAIL] GROQ_API_KEY is missing in environment variables!');
    overallSuccess = false;
  }

  if (elevenLabsApiKey) {
    console.log(`  [SUCCESS] ELEVENLABS_API_KEY found: ${maskKey(elevenLabsApiKey)}`);
  } else {
    console.log('  [FAIL] ELEVENLABS_API_KEY is missing in environment variables!');
    overallSuccess = false;
  }

  let voiceId = rawVoiceId;
  if (!voiceId || voiceId.startsWith('voice_id_') || voiceId.length < 15) {
    console.log(`  [CHECK] Provided Voice ID '${rawVoiceId || 'undefined'}' is a placeholder/invalid format.`);
    console.log(`  [CHECK] Defaulting to standard public premade voice ID: ${DEFAULT_PUBLIC_VOICE_ID} (Jessica)`);
    voiceId = DEFAULT_PUBLIC_VOICE_ID;
  } else {
    console.log(`  [SUCCESS] ELEVENLABS_VOICE_ID configured: ${voiceId}`);
  }

  console.log('');

  // ----------------------------------------------------
  // STEP 2: Groq Verification (LLM & Whisper STT)
  // ----------------------------------------------------
  console.log('[CHECK] 2. Verifying Groq API Key & Services...');

  if (!groqApiKey) {
    console.log('  [SKIP] Skipping Groq tests due to missing API key.\n');
  } else {
    // Test 2A: Groq Llama 3.3 70B Chat Completion (Kids Persona)
    const llmModel = process.env.GROQ_LLM_MODEL || 'llama-3.3-70b-versatile';
    console.log(`  [CHECK] Test 2A: Testing Llama 3.3 70B Chat Completion (${llmModel})...`);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [
            {
              role: 'system',
              content: 'You are a friendly museum guide for young children (Kids Persona).'
            },
            {
              role: 'user',
              content: 'Explain what a sword is in 1 simple sentence for a 7-year-old explorer.'
            }
          ],
          max_tokens: 80,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        console.log(`  [SUCCESS] Groq LLM Response received (status 200):`);
        console.log(`            "${text}"`);
      } else {
        const errorText = await response.text();
        console.log(`  [FAIL] Groq LLM Error (status ${response.status}): ${errorText}`);
        overallSuccess = false;
      }
    } catch (err) {
      console.log(`  [FAIL] Groq LLM Request Exception: ${err.message}`);
      overallSuccess = false;
    }

    // Test 2B: Groq Whisper STT Endpoint Connectivity
    const sttModel = process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo';
    console.log(`  [CHECK] Test 2B: Testing Whisper STT Endpoint (${sttModel})...`);

    try {
      const wavBuffer = createDummyWavBuffer();
      const formData = new FormData();
      formData.append('file', new Blob([wavBuffer], { type: 'audio/wav' }), 'speech.wav');
      formData.append('model', sttModel);
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  [SUCCESS] Groq Whisper STT endpoint connected successfully (status 200).`);
        console.log(`            Transcribed output for test buffer: "${data.text || '(silence detected)'}"`);
      } else {
        const errorText = await response.text();
        console.log(`  [FAIL] Groq Whisper STT Error (status ${response.status}): ${errorText}`);
        overallSuccess = false;
      }
    } catch (err) {
      console.log(`  [FAIL] Groq Whisper STT Exception: ${err.message}`);
      overallSuccess = false;
    }
    console.log('');
  }

  // ----------------------------------------------------
  // STEP 3: ElevenLabs Verification (TTS Stream)
  // ----------------------------------------------------
  console.log('[CHECK] 3. Verifying ElevenLabs API Key & Streaming TTS...');

  if (!elevenLabsApiKey) {
    console.log('  [SKIP] Skipping ElevenLabs tests due to missing API key.\n');
  } else {
    const testText = 'Welcome to Adwa Lens Explorer!';
    console.log(`  [CHECK] Requesting TTS stream for Voice ID '${voiceId}'...`);

    const attemptTts = async (vId) => {
      return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vId}/stream`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: testText,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
    };

    try {
      let response = await attemptTts(voiceId);

      // Handle restricted/library voices on free tier by querying available premade voices
      if (!response.ok) {
        const errText = await response.text();
        console.log(`  [WARN] Initial Voice ID '${voiceId}' returned status ${response.status}: ${errText}`);
        console.log(`  [CHECK] Querying ElevenLabs account premade voices for key...`);

        const voicesRes = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': elevenLabsApiKey }
        });

        if (voicesRes.ok) {
          const voicesData = await voicesRes.json();
          const premadeVoice = voicesData.voices?.find(v => v.category === 'premade') || voicesData.voices?.[0];
          if (premadeVoice) {
            console.log(`  [CHECK] Retrying with available premade Voice ID: '${premadeVoice.id}' (${premadeVoice.name})...`);
            voiceId = premadeVoice.id;
            response = await attemptTts(voiceId);
          }
        }
      }

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        console.log(`  [SUCCESS] ElevenLabs TTS stream received successfully (status 200).`);
        console.log(`            Active Voice ID: ${voiceId}`);
        console.log(`            Audio Buffer Size: ${audioBuffer.byteLength} bytes.`);
      } else {
        const errorText = await response.text();
        console.log(`  [FAIL] ElevenLabs TTS Error (status ${response.status}): ${errorText}`);
        overallSuccess = false;
      }
    } catch (err) {
      console.log(`  [FAIL] ElevenLabs TTS Exception: ${err.message}`);
      overallSuccess = false;
    }
    console.log('');
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('====================================================');
  if (overallSuccess) {
    console.log(' [SUCCESS] ALL VOICE PIPELINE API KEYS & ENDPOINTS VERIFIED!');
  } else {
    console.log(' [FAIL] ONE OR MORE VOICE PIPELINE TESTS FAILED.');
  }
  console.log('====================================================');

  process.exit(overallSuccess ? 0 : 1);
}

runVoiceKeysTest();
