import { useCallback, useEffect, useState, useRef } from 'react';

interface TTSOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

/**
 * Robust Web Speech API TTS hook with chunking and Chrome bug workarounds
 * - Chunks long text to prevent 15-second WebView cutoff
 * - Uses pause/resume heartbeat to prevent Chrome from stopping
 * - Proper promise handling and voice selection
 */
export const useNativeTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef(0);
  const isCancelledRef = useRef(false);
  const isWebViewRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.log('TTS: speechSynthesis not supported');
      return;
    }

    // Detect WebView-like environments (Android WebView / in-app browsers)
    try {
      const ua = navigator.userAgent || '';
      const isAndroidWebView = /;\s*wv\)/.test(ua) || /\bwv\b/.test(ua) || (/Android/.test(ua) && /Version\/[0-9.]+/.test(ua) && /Chrome\/[0-9.]+/.test(ua));
      isWebViewRef.current = isAndroidWebView;
      console.log('TTS: WebView detected =', isWebViewRef.current);
    } catch {
      isWebViewRef.current = false;
    }

    setIsSupported(true);
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('TTS: Loaded', voices.length, 'voices');
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.cancel();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  const sanitizeText = useCallback((text: string): string => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Split text into chunks
  // Note: In Android WebView, a single very long utterance often gets cut off mid-way.
  // So we keep maxLength configurable and choose a WebView-safe value at runtime.
  const splitIntoChunks = useCallback((text: string, maxLength: number = 1200): string[] => {
    // For shorter text, don't chunk at all
    if (text.length <= maxLength) {
      return [text];
    }
    
    const sentences = text.split(/(?<=[।.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    
    return chunks.filter(c => c.trim().length > 0);
  }, []);

  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = availableVoices.length > 0 
      ? availableVoices 
      : window.speechSynthesis.getVoices();
    
    if (voices.length === 0) return null;

    const hindiVoices = voices.filter(v => v.lang.startsWith('hi') || v.lang === 'en-IN');
    console.log('TTS: Hindi/Indian voices:', hindiVoices.map(v => `${v.name} (${v.lang})`).join(', ') || 'None');

    const hindiMaleNames = [
      'google हिन्दी', 'google hindi', 'madhur', 'hemant', 'prabhat', 
      'microsoft madhur', 'samsung hindi male', 'hindi male', 'hindi india male', 'male hindi', 'vani'
    ];
    
    const hindiMaleVoice = voices.find(v => {
      const nameLower = v.name.toLowerCase();
      const isHindi = v.lang === 'hi-IN' || v.lang.startsWith('hi');
      const isMale = hindiMaleNames.some(name => nameLower.includes(name)) || 
                     (!nameLower.includes('female') && !nameLower.includes('swara') && !nameLower.includes('lekha'));
      return isHindi && isMale;
    });
    
    if (hindiMaleVoice) return hindiMaleVoice;

    const hindiVoice = voices.find(v => v.lang === 'hi-IN');
    if (hindiVoice) return hindiVoice;

    const hindiAnyLocale = voices.find(v => v.lang.startsWith('hi'));
    if (hindiAnyLocale) return hindiAnyLocale;
    
    const indianEnglishMale = voices.find(v => {
      const nameLower = v.name.toLowerCase();
      return v.lang === 'en-IN' && 
             (nameLower.includes('ravi') || nameLower.includes('male') || 
              (!nameLower.includes('female') && !nameLower.includes('heera')));
    });
    if (indianEnglishMale) return indianEnglishMale;

    const indianEnglish = voices.find(v => v.lang === 'en-IN');
    if (indianEnglish) return indianEnglish;
    
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;
    
    return voices[0] || null;
  }, [availableVoices]);

  // Speak a single chunk with auto-retry on early stop
  const speakChunk = useCallback((
    text: string, 
    voice: SpeechSynthesisVoice | null, 
    rate: number, 
    pitch: number, 
    volume: number,
    retryWithSmallerChunks: boolean = true
  ): Promise<{ completed: boolean; stoppedEarly: boolean }> => {
    return new Promise((resolve) => {
      if (isCancelledRef.current) {
        resolve({ completed: false, stoppedEarly: false });
        return;
      }

      const startTime = Date.now();
      const minExpectedDuration = 2500; // If speech stops before 2.5 seconds, it's suspicious

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'hi-IN';
      }
      
      utterance.rate = Math.max(0.1, Math.min(10, rate));
      utterance.pitch = Math.max(0, Math.min(2, pitch));
      utterance.volume = Math.max(0, Math.min(1, volume));

      utterance.onend = () => {
        const elapsed = Date.now() - startTime;
        // If text is long but speech ended too quickly, it likely stopped early
        const textLengthThreshold = 100; // ~100 chars should take more than 2.5s to speak
        const stoppedEarly = text.length > textLengthThreshold && elapsed < minExpectedDuration;
        
        if (stoppedEarly) {
          console.log(`TTS: Possible early stop detected (${elapsed}ms for ${text.length} chars)`);
        }
        
        resolve({ completed: true, stoppedEarly });
      };

      utterance.onerror = (event) => {
        console.error('TTS chunk error:', event.error);
        resolve({ completed: false, stoppedEarly: false });
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const speak = useCallback((options: TTSOptions): Promise<void> => {
    const { text, rate = 0.9, pitch = 1.0, volume = 1.0, voiceName } = options;
    
    return new Promise(async (resolve) => {
      if (!isSupported) {
        resolve();
        return;
      }

      const cleanText = sanitizeText(text);
      if (!cleanText) {
        resolve();
        return;
      }

       // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      
      isCancelledRef.current = false;
      
       // Small delay to ensure cancel completes (WebView needs a bit more)
       await new Promise(r => setTimeout(r, isWebViewRef.current ? 140 : 60));

      try {
        // Get voice
        const targetVoiceName = voiceName || selectedVoiceName;
        let voice: SpeechSynthesisVoice | null = null;
        
        if (targetVoiceName) {
          const voices = window.speechSynthesis.getVoices();
          voice = voices.find(v => v.name === targetVoiceName) || null;
        }
        
        if (!voice) {
          voice = getBestVoice();
        }

         // Chunking strategy:
         // - WebView: smaller chunks to prevent mid-speech cutoff
         // - Regular browsers: allow large chunks (up to 5k) for smoother playback
         const chunkMax = isWebViewRef.current ? 900 : 5000;
         const chunks = splitIntoChunks(cleanText, chunkMax);
        chunksRef.current = chunks;
        currentChunkIndexRef.current = 0;

        console.log(`TTS: Speaking ${chunks.length} chunks`);
        setIsSpeaking(true);

         // Start heartbeat only for WebView (prevents Chromium/WebView from stopping mid-utterance)
         if (isWebViewRef.current) {
           heartbeatRef.current = setInterval(() => {
             if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
               window.speechSynthesis.pause();
               window.speechSynthesis.resume();
             }
           }, 8000);
         }

        // Speak each chunk sequentially with auto-retry on early stop
        let consecutiveEarlyStops = 0;
        let currentChunkSize = chunkMax;
        
        for (let i = 0; i < chunks.length; i++) {
          if (isCancelledRef.current) break;
          
          currentChunkIndexRef.current = i;
          const chunkText = chunks[i];
          
          // If we've had early stops, use smaller sub-chunks
          if (consecutiveEarlyStops >= 1 && chunkText.length > 200) {
            console.log(`TTS: Using smaller sub-chunks due to early stops`);
            const subChunks = splitIntoChunks(chunkText, 200);
            
            for (const subChunk of subChunks) {
              if (isCancelledRef.current) break;
              
              const result = await speakChunk(subChunk, voice, rate, pitch, volume, false);
              
              if (result.stoppedEarly) {
                // Cancel and retry with even smaller chunk
                window.speechSynthesis.cancel();
                await new Promise(r => setTimeout(r, 100));
                await speakChunk(subChunk, voice, rate, pitch, volume, false);
              }
              
              if (!isCancelledRef.current) {
                await new Promise(r => setTimeout(r, 50));
              }
            }
          } else {
            const result = await speakChunk(chunkText, voice, rate, pitch, volume, true);
            
            if (result.stoppedEarly) {
              consecutiveEarlyStops++;
              console.log(`TTS: Early stop #${consecutiveEarlyStops}, will retry remaining text with smaller chunks`);
              
              // Re-chunk remaining text with smaller size and retry current chunk
              if (consecutiveEarlyStops <= 2) {
                window.speechSynthesis.cancel();
                await new Promise(r => setTimeout(r, 100));
                
                // Retry current chunk with smaller sub-chunks
                const subChunks = splitIntoChunks(chunkText, 200);
                for (const subChunk of subChunks) {
                  if (isCancelledRef.current) break;
                  await speakChunk(subChunk, voice, rate, pitch, volume, false);
                  await new Promise(r => setTimeout(r, 50));
                }
              }
            } else {
              consecutiveEarlyStops = 0; // Reset on successful chunk
            }
          }
          
          // Minimal gap between chunks
          if (i < chunks.length - 1 && !isCancelledRef.current) {
            await new Promise(r => setTimeout(r, 30));
          }
        }

      } catch (error) {
        console.error('TTS: Exception during speak:', error);
      } finally {
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      }
    });
  }, [isSupported, sanitizeText, getBestVoice, selectedVoiceName, splitIntoChunks, speakChunk]);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    utteranceRef.current = null;
    chunksRef.current = [];
    currentChunkIndexRef.current = 0;
    setIsSpeaking(false);
  }, []);

  const getHindiVoices = useCallback((): SpeechSynthesisVoice[] => {
    const voices = availableVoices.length > 0 
      ? availableVoices 
      : window.speechSynthesis.getVoices();
    
    return voices.filter(v => 
      v.lang.startsWith('hi') || 
      v.lang === 'en-IN' || 
      v.lang.startsWith('en')
    );
  }, [availableVoices]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    isNative: false,
    availableVoices,
    sanitizeText,
    selectedVoiceName,
    setSelectedVoiceName,
    getHindiVoices,
  };
};

export default useNativeTTS;
