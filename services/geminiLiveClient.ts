import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './audioUtils';
import { TranscriptItem } from '../types';

interface LiveClientConfig {
  systemInstruction: string;
  onTranscriptUpdate: (item: TranscriptItem) => void;
  onVolumeUpdate: (volume: number) => void;
  onDisconnect: () => void;
  onSilenceTimeout?: () => void; // New callback for silence
}

export class GeminiLiveClient {
  private ai: GoogleGenAI;
  private config: LiveClientConfig;
  private session: any = null;
  
  // Audio Contexts
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;

  // State
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private currentInputTranscription = '';
  private currentOutputTranscription = '';
  
  // Silence Detection
  private lastUserActivityTime: number = 0;
  private silenceCheckInterval: any = null;
  // Increased to 15 minutes to prevent premature timeouts during thinking/drawing
  private readonly SILENCE_TIMEOUT_MS = 15 * 60 * 1000; 

  constructor(config: LiveClientConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(stream: MediaStream) {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    // Initialize silence timer
    this.lastUserActivityTime = Date.now();
    this.startSilenceCheck();

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("NOVA Connection Opened");
          this.startAudioInput(stream, sessionPromise);
        },
        onmessage: (msg) => this.handleMessage(msg),
        onclose: () => {
          console.log("NOVA Connection Closed");
          this.config.onDisconnect();
        },
        onerror: (err) => {
          console.error("NOVA Error", err);
          this.config.onDisconnect();
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: this.config.systemInstruction,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } // Fenrir sounds authoritative yet professional
        },
        // Corrected: Passing empty objects enables transcription. 
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });

    this.session = await sessionPromise;
  }

  private startSilenceCheck() {
    this.silenceCheckInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastUserActivityTime;
      if (timeSinceLastActivity > this.SILENCE_TIMEOUT_MS) {
        console.warn("Silence timeout reached. Ending session.");
        this.stopSilenceCheck();
        if (this.config.onSilenceTimeout) {
          this.config.onSilenceTimeout();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private stopSilenceCheck() {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
  }

  private startAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputAudioContext) return;

    // Ensure context is active to prevent dropped frames
    if (this.inputAudioContext.state === 'suspended') {
      this.inputAudioContext.resume().catch(console.error);
    }

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.inputAudioContext) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.config.onVolumeUpdate(rms * 5); // Scale up for visibility

      // Check for user activity (speaking) based on volume threshold
      // LOWERED THRESHOLD: 0.002 (was 0.02) to detect quiet voices/bad mics
      if (rms > 0.002) {
        this.lastUserActivityTime = Date.now();
      }

      const pcmBlob = createPcmBlob(inputData);
      
      sessionPromise.then(session => {
        // DIRECT SESSION USAGE: Access session from promise result instead of this.session
        // This prevents race conditions where this.session is not yet assigned.
        session.sendRealtimeInput({ media: pcmBlob });
      }).catch(err => {
        console.error("Error sending audio chunk:", err);
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // 1. Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode) {
        
        // Visualize output audio
        this.config.onVolumeUpdate(0.8); // Simulate high volume when bot speaks

        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        try {
          const audioBytes = base64ToUint8Array(base64Audio);
          const audioBuffer = await decodeAudioData(audioBytes, this.outputAudioContext, 24000, 1);
          
          const source = this.outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.outputNode);
          source.addEventListener('ended', () => {
            this.sources.delete(source);
            this.config.onVolumeUpdate(0); // Reset volume
          });
          
          source.start(this.nextStartTime);
          this.nextStartTime += audioBuffer.duration;
          this.sources.add(source);
        } catch (e) {
          console.error("Error decoding audio", e);
        }
    }

    // 2. Handle Interruption
    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => {
        try { source.stop(); } catch (e) {}
      });
      this.sources.clear();
      this.nextStartTime = 0;
      this.config.onVolumeUpdate(0);
    }

    // 3. Handle Transcripts
    if (message.serverContent?.outputTranscription) {
      this.currentOutputTranscription += message.serverContent.outputTranscription.text;
    } else if (message.serverContent?.inputTranscription) {
      this.currentInputTranscription += message.serverContent.inputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      if (this.currentInputTranscription.trim()) {
        this.config.onTranscriptUpdate({
          speaker: 'user',
          text: this.currentInputTranscription,
          timestamp: Date.now()
        });
        this.currentInputTranscription = '';
        // Explicitly update activity time on transcript received
        this.lastUserActivityTime = Date.now();
      }
      if (this.currentOutputTranscription.trim()) {
        this.config.onTranscriptUpdate({
          speaker: 'agent',
          text: this.currentOutputTranscription,
          timestamp: Date.now()
        });
        this.currentOutputTranscription = '';
      }
    }
  }

  async sendVideoFrame(base64Image: string) {
    if (this.session) {
      // Clean base64 string if it contains headers
      const data = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
      try {
        await this.session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: data
          }
        });
      } catch (e) {
        console.error("Frame send error", e);
      }
    }
  }

  async disconnect() {
    this.stopSilenceCheck();

    // 1. Disconnect Nodes
    if (this.inputSource) {
      try { this.inputSource.disconnect(); } catch (e) {}
      this.inputSource = null;
    }
    if (this.processor) {
      try { this.processor.disconnect(); } catch (e) {}
      this.processor = null;
    }
    
    // 2. Close Contexts Safely
    if (this.inputAudioContext) {
      if (this.inputAudioContext.state !== 'closed') {
        try { await this.inputAudioContext.close(); } catch (e) {}
      }
      this.inputAudioContext = null;
    }

    if (this.outputAudioContext) {
      if (this.outputAudioContext.state !== 'closed') {
         try { await this.outputAudioContext.close(); } catch (e) {}
      }
      this.outputAudioContext = null;
    }

    // 3. Stop Sources
    this.sources.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    this.sources.clear();
    
    // 4. Nullify session
    this.session = null;
  }
}