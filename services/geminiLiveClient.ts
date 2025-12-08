import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './audioUtils';
import { TranscriptItem } from '../types';

interface LiveClientConfig {
  systemInstruction: string;
  onTranscriptUpdate: (item: TranscriptItem) => void;
  onVolumeUpdate: (volume: number) => void;
  onDisconnect: () => void;
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

  constructor(config: LiveClientConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(stream: MediaStream) {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log("VirtuHire Connection Opened");
          this.startAudioInput(stream, sessionPromise);
        },
        onmessage: (msg) => this.handleMessage(msg),
        onclose: () => {
          console.log("VirtuHire Connection Closed");
          this.config.onDisconnect();
        },
        onerror: (err) => {
          console.error("VirtuHire Error", err);
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
        // Passing { model: ... } causes "Invalid Argument" error.
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });

    this.session = await sessionPromise;
  }

  private startAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputAudioContext) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.config.onVolumeUpdate(rms * 5); // Scale up for visibility

      const pcmBlob = createPcmBlob(inputData);
      
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
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
    }

    // 2. Handle Interruption
    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => source.stop());
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
      await this.session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: data
        }
      });
    }
  }

  async disconnect() {
    // Close context
    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.sources.forEach(s => s.stop());
    
    // We cannot explicitly close the session in the SDK, but we stop sending data
    this.session = null;
    this.config.onDisconnect();
  }
}