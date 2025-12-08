import React, { useEffect, useRef, useState } from 'react';
import { GeminiLiveClient } from '../services/geminiLiveClient';
import { JobProfile, TranscriptItem, InterviewStatus } from '../types';
import Avatar from '../components/Avatar';
import FraudMonitor from '../components/FraudMonitor';

interface InterviewRoomProps {
  jobProfile: JobProfile;
  onFinish: (transcripts: TranscriptItem[]) => void;
}

const InterviewRoom: React.FC<InterviewRoomProps> = ({ jobProfile, onFinish }) => {
  const [status, setStatus] = useState<InterviewStatus>(InterviewStatus.IDLE);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [audioVolume, setAudioVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize System Instruction
  const systemInstruction = `
    You are VirtuHire, an expert Senior Technical Interviewer for the role of ${jobProfile.title}.
    The Job Description is: ${jobProfile.description}.
    Tech Stack required: ${jobProfile.techStack.join(', ')}.
    Soft Skills: ${jobProfile.softSkills.join(', ')}.

    Your goal is to conduct a 5-minute screening interview.
    1. Start by welcoming the candidate and asking them to introduce themselves.
    2. Ask 1-2 technical questions specific to the tech stack.
    3. Ask 1 behavioral question related to soft skills.
    4. Keep your responses concise (under 20 words usually) to keep the conversation flowing naturally like a human.
    5. Be professional but slightly demanding.
    6. If the user gives a vague answer, drill down.
    7. After 3-4 questions, thank them and say you will process the results.
  `;

  useEffect(() => {
    // Setup Camera
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsMediaReady(true);
        }
      } catch (err) {
        setError("Camera/Mic access denied. Cannot proceed.");
      }
    };
    setupMedia();

    return () => {
      clientRef.current?.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      if (!streamRef.current) {
        throw new Error("No media stream available");
      }
      
      setStatus(InterviewStatus.CONNECTING);
      
      const client = new GeminiLiveClient({
        systemInstruction,
        onTranscriptUpdate: (item) => setTranscripts(prev => [...prev, item]),
        onVolumeUpdate: (vol) => setAudioVolume(vol),
        onDisconnect: () => setStatus(InterviewStatus.COMPLETED)
      });

      await client.connect(streamRef.current);
      clientRef.current = client;
      setStatus(InterviewStatus.ACTIVE);

      // Start video frame loop
      const sendFrame = () => {
        if (status === InterviewStatus.COMPLETED) return;
        
        if (videoRef.current && canvasRef.current && clientRef.current) {
           const ctx = canvasRef.current.getContext('2d');
           const vid = videoRef.current;
           canvasRef.current.width = vid.videoWidth / 4; // Downscale for bandwidth
           canvasRef.current.height = vid.videoHeight / 4;
           ctx?.drawImage(vid, 0, 0, canvasRef.current.width, canvasRef.current.height);
           const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5);
           clientRef.current.sendVideoFrame(base64);
        }
        setTimeout(sendFrame, 1000); // 1 FPS is enough for "presence" check
      };
      sendFrame();

    } catch (err: any) {
      console.error(err);
      setError("Failed to connect to AI Core. check API Key.");
      setStatus(InterviewStatus.FAILED);
    }
  };

  const handleEnd = () => {
    clientRef.current?.disconnect();
    setStatus(InterviewStatus.COMPLETED);
    onFinish(transcripts);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-veritas-900 overflow-hidden">
      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Stage (Video + AI) */}
      <div className="flex-1 relative flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="font-mono text-sm text-red-400">LIVE SESSION: {jobProfile.id}</span>
          </div>
          <button 
            onClick={handleEnd}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/50 rounded text-sm font-bold uppercase transition-colors"
          >
            Terminate Session
          </button>
        </div>

        {/* Video Feed Layer */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="absolute min-w-full min-h-full object-cover opacity-60" 
          />
          
          {/* Overlay Grid */}
          <div className="absolute inset-0 z-10 opacity-20 pointer-events-none" 
               style={{backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px'}}>
          </div>

          {/* AI Avatar Center Stage */}
          <div className="z-20 transform scale-150">
            {status === InterviewStatus.ACTIVE || status === InterviewStatus.CONNECTING ? (
              <Avatar volume={audioVolume} isActive={status === InterviewStatus.ACTIVE} />
            ) : (
               <div className="text-center">
                 <button 
                    onClick={handleStart}
                    disabled={!isMediaReady}
                    className={`px-8 py-4 font-bold rounded-lg transition-all transform ${isMediaReady ? 'bg-veritas-accent text-black hover:scale-105' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                 >
                    {isMediaReady ? 'INITIALIZE INTERVIEW' : 'ACCESSING CAMERA...'}
                 </button>
                 {error && <p className="mt-4 text-red-500 bg-black/50 p-2 rounded max-w-md mx-auto">{error}</p>}
               </div>
            )}
          </div>
        </div>

        {/* Transcript Overlay */}
        <div className="h-48 glass-panel border-t border-gray-700 p-4 overflow-y-auto z-20 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-2">
             {transcripts.length === 0 && <p className="text-gray-500 text-center italic">Waiting for connection...</p>}
             {transcripts.map((t, idx) => (
               <div key={idx} className={`flex ${t.speaker === 'agent' ? 'justify-start' : 'justify-end'}`}>
                 <div className={`max-w-[80%] p-2 rounded-lg text-sm ${t.speaker === 'agent' ? 'bg-veritas-700/80 text-cyan-100 border-l-2 border-cyan-400' : 'bg-blue-900/50 text-white'}`}>
                   <span className="text-xs opacity-50 block mb-1 uppercase font-bold">{t.speaker}</span>
                   {t.text}
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Sidebar: Diagnostics & Info */}
      <div className="w-full md:w-80 bg-veritas-800 border-l border-gray-700 p-4 flex flex-col gap-4 z-30">
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-1">Candidate View</h2>
          <p className="text-xs text-gray-400 mb-4">{jobProfile.title}</p>
        </div>

        <FraudMonitor isStreaming={status === InterviewStatus.ACTIVE} />

        <div className="glass-panel p-4 rounded-lg flex-1">
          <h3 className="text-veritas-400 text-xs font-bold uppercase tracking-wider mb-2">Tech Stack Verification</h3>
          <div className="flex flex-wrap gap-2">
            {jobProfile.techStack.map(tech => (
              <span key={tech} className="text-xs px-2 py-1 rounded bg-veritas-900 border border-gray-700 text-gray-300">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;