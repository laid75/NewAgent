/**
 * Audio player utility for Gemini TTS PCM 24kHz and procedural telephone sound effects
 */

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Ensures audio playback is unlocked by browser autoplay policies
 */
export async function unlockAudioContext(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch (e) {
    console.warn('AudioContext unlock note:', e);
  }
}

/**
 * Decodes base64 encoded 24kHz 16-bit PCM audio and plays it through Web Audio API
 */
export async function playPcmAudio(base64Data: string, sampleRate = 24000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit signed PCM to float32
      const pcm16 = new Int16Array(bytes.buffer);
      const numSamples = pcm16.length;
      const float32 = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Subtle telephone frequency filter to simulate a real phone line speaker
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800; // Algerian phone line acoustic frequency
      filter.Q.value = 0.8;

      source.connect(filter);
      filter.connect(audioCtx.destination);

      source.onended = () => resolve();
      source.start();
    } catch (err) {
      console.warn('PCM audio playback failed, falling back to speech synthesis', err);
      reject(err);
    }
  });
}

/**
 * Browser Speech Synthesis fallback for Arabic and French
 */
export function speakWithBrowser(text: string, langHint: 'ar' | 'fr' | 'darija' = 'ar'): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean text of markdown, asterisks, brackets, emojis
      const clean = text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[*_#`[\]()]/g, '')
        .trim();

      if (!clean) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(clean);

      const selectVoiceAndSpeak = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          let targetVoice = null;

          if (langHint === 'fr') {
            targetVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
            utterance.lang = 'fr-FR';
          } else {
            // Arabic / Darija: try Algerian voice first (ar-DZ), then any Arabic voice (ar-*), then fallback
            targetVoice = voices.find(v => v.lang && (v.lang.toLowerCase() === 'ar-dz' || v.lang.toLowerCase().includes('dz'))) ||
                          voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar')) ||
                          voices.find(v => v.name && v.name.toLowerCase().includes('arabic')) ||
                          voices.find(v => v.lang && (v.lang.toLowerCase().startsWith('en') || v.lang.toLowerCase().startsWith('fr')));
            utterance.lang = targetVoice ? targetVoice.lang : 'ar-SA';
          }

          if (targetVoice) {
            utterance.voice = targetVoice;
          }

          utterance.rate = 0.95;
          utterance.pitch = 1.0;

          utterance.onend = () => resolve();
          utterance.onerror = (e) => {
            console.warn('SpeechSynthesis error:', e);
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('SpeechSynthesis invocation notice:', e);
          resolve();
        }
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        selectVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          selectVoiceAndSpeak();
        };
        setTimeout(() => {
          selectVoiceAndSpeak();
        }, 150);
      }
    } catch {
      resolve();
    }
  });
}

export function stopCurrentAudio() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Procedural Phone Sounds
 */
export function playPhoneDialTone(): () => void {
  try {
    const ctx = getAudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = 350; // US/Algeria standard dial tone frequencies
    osc2.frequency.value = 440;

    gain.gain.value = 0.08;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    return () => {
      try {
        osc1.stop();
        osc2.stop();
      } catch {}
    };
  } catch {
    return () => {};
  }
}

export function playPhoneRingTone(): () => void {
  try {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(ctx.destination);

    let isPlaying = true;
    let timeoutId: any;

    const ringCycle = () => {
      if (!isPlaying) return;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.frequency.value = 400;
      osc2.frequency.value = 450;

      osc1.connect(gain);
      osc2.connect(gain);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
        } catch {}
      }, 1200);

      timeoutId = setTimeout(ringCycle, 3000);
    };

    ringCycle();

    return () => {
      isPlaying = false;
      clearTimeout(timeoutId);
    };
  } catch {
    return () => {};
  }
}

export function playCallConnectedBeep(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 600;
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export function playCallEndBeep(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 320;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}
