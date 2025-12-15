import React, { useEffect, useRef, useState } from 'react';
import { GeminiLiveClient } from '../services/geminiLiveClient';
import { JobProfile, TranscriptItem, InterviewStatus, CandidateProfile } from '../types';
import Avatar from '../components/Avatar';
import FraudMonitor from '../components/FraudMonitor';

interface InterviewRoomProps {
  jobProfile: JobProfile;
  candidateProfile: CandidateProfile;
  onFinish: (transcripts: TranscriptItem[], duration: number, endReason?: 'completed' | 'timeout') => void;
}

const InterviewRoom: React.FC<InterviewRoomProps> = ({ jobProfile, candidateProfile, onFinish }) => {
  const [status, setStatus] = useState<InterviewStatus>(InterviewStatus.IDLE);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [audioVolume, setAudioVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true); // Track configuration phase
  
  // Use ref for start time to avoid stale closure issues in callbacks
  const startTimeRef = useRef<number>(0);

  // Media Status State
  const [mediaPermissions, setMediaPermissions] = useState({
    camera: false,
    mic: false
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // UPDATED SYSTEM INSTRUCTION WITH STRICTER TIMING GUARDS
  const systemInstruction = `
    You are NOVA, an expert Senior Technical Interviewer.
    
    CANDIDATE: ${candidateProfile.name}
    ROLE: ${jobProfile.title}
    STACK: ${jobProfile.techStack.join(', ')}
    
    GOAL: Conduct a structured technical interview to assess proficiency.
    
    DYNAMIC DURATION STRATEGY:
    1. CRITICAL: MINIMUM DURATION IS 15 MINUTES.
       - Do NOT conclude the interview before the 15-minute mark under any circumstances, even if the candidate struggles. 
       - If they struggle, pivot to easier questions to assess basic knowledge instead of quitting.

    2. EARLY TERMINATION (15-20 Mins):
       - Only after 15 minutes, if the candidate has consistently failed to answer basic questions, you may politely wrap up.
       - Phrase it as: "Thank you for sharing that. I think I have gathered enough information for this stage of the assessment. We will end the session here."

    3. FULL SESSION (Good Fit): 
       - If the candidate demonstrates competence:
       - Continue diving deeper into complex topics, architecture, and problem-solving.
       - Aim to conduct a 45-minute session.

    4. WRAP-UP (At 40 Minutes):
       - If the interview is going well and reaching the 40-minute mark:
       - Stop asking technical questions.
       - Transition to closing: "We are approaching the end of our time. Do you have any questions for me regarding the role or the team?"
    
    BEHAVIOR:
    - Be professional, objective, and concise.
    - Dig deeper when answers are surface-level.
    - Do not give away answers.
    - Maintain a neutral but polite tone.
  `;

  const checkMediaStatus = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const audioTrack = streamRef.current.getAudioTracks()[0];
      
      const hasVideo = videoTrack && videoTrack.enabled && videoTrack.readyState === 'live';
      const hasAudio = audioTrack && audioTrack.enabled && audioTrack.readyState === 'live';
      
      setMediaPermissions({ camera: !!hasVideo, mic: !!hasAudio });
      
      // We generally require both to start
      setIsMediaReady(!!hasVideo && !!hasAudio);
    } else {
      setMediaPermissions({ camera: false, mic: false });
      setIsMediaReady(false);
    }
  };

  const setupMedia = async () => {
    setError(null);
    try {
      // Check if navigator.mediaDevices exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices API not available. Ensure you are using HTTPS.");
      }

      // Stop existing tracks to ensure clean slate if re-requesting
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      // Request both audio and video
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Video play failed", e));
      }
      
      checkMediaStatus();

    } catch (err: any) {
      // If setup failed, ensure we clean up partials
      if (streamRef.current) {
         streamRef.current.getTracks().forEach(t => t.stop());
         streamRef.current = null;
      }
      checkMediaStatus(); // Will set everything to false

      let errorMessage = "Camera/Microphone access required.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Permission denied. Please allow camera and microphone access in your browser settings.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "No camera or microphone found. Please connect a device.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = "Camera/Mic is in use by another application.";
      } else {
        if (err.message) errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const toggleMedia = async (type: 'camera' | 'mic') => {
    // If no stream exists, try to set it up from scratch
    if (!streamRef.current) {
      await setupMedia();
      return;
    }

    const track = type === 'camera' 
      ? streamRef.current.getVideoTracks()[0] 
      : streamRef.current.getAudioTracks()[0];

    if (track) {
      // Toggle the 'enabled' property
      track.enabled = !track.enabled;
      checkMediaStatus(); // Update UI state
    } else {
      // If the track is missing (e.g. only audio was captured), we need to re-request full media
      await setupMedia();
    }
  };

  useEffect(() => {
    setupMedia();
    return () => {
      clientRef.current?.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      // Final check
      if (!streamRef.current) {
        await setupMedia(); 
        if (!streamRef.current) return; 
      }
      
      setStatus(InterviewStatus.CONNECTING);
      setIsConfiguring(false);
      setError(null);
      
      // Reset start time ref
      startTimeRef.current = Date.now();
      
      const client = new GeminiLiveClient({
        systemInstruction,
        onTranscriptUpdate: (item) => setTranscripts(prev => [...prev, item]),
        onVolumeUpdate: (vol) => setAudioVolume(vol),
        onDisconnect: () => handleEnd('completed'), 
        onSilenceTimeout: () => handleEnd('timeout')
      });

      await client.connect(streamRef.current);
      clientRef.current = client;
      setStatus(InterviewStatus.ACTIVE);

      const sendFrame = () => {
        if (status === InterviewStatus.COMPLETED) return;
        if (videoRef.current && canvasRef.current && clientRef.current) {
           const ctx = canvasRef.current.getContext('2d');
           if (ctx) {
             canvasRef.current.width = videoRef.current.videoWidth / 4; 
             canvasRef.current.height = videoRef.current.videoHeight / 4;
             ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
             clientRef.current.sendVideoFrame(canvasRef.current.toDataURL('image/jpeg', 0.5));
           }
        }
        setTimeout(sendFrame, 1000); 
      };
      sendFrame();

    } catch (err) {
      console.error(err);
      setError("Connection Failed. Check API Key or Network.");
      setStatus(InterviewStatus.FAILED);
      setIsConfiguring(true); // Go back to config on fail
    }
  };

  const handleEnd = (reason: 'completed' | 'timeout' = 'completed') => {
    if (status === InterviewStatus.COMPLETED) return; 
    
    clientRef.current?.disconnect();
    setStatus(InterviewStatus.COMPLETED);
    
    const endTime = Date.now();
    // Use the Ref value to calculate duration to avoid stale closures
    const start = startTimeRef.current > 0 ? startTimeRef.current : endTime; 
    const duration = (endTime - start) / 1000;
    
    console.log(`Interview Ended. Duration: ${duration}s. Reason: ${reason}`);
    onFinish(transcripts, duration, reason);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-cyber-black overflow-hidden font-sans">
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Stage */}
      <div className="flex-1 relative flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-cyber-black/90 border-b border-cyber-800 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-cyber-blue border-t-transparent animate-spin"></div>
                <div className="w-5 h-5 bg-cyber-blue rounded-full flex items-center justify-center">
                   <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                </div>
             </div>
             <h1 className="font-bold text-lg tracking-wider text-white">NOVA <span className="text-cyber-blue text-xs font-normal">LIVE SESSION</span></h1>
             {status === InterviewStatus.ACTIVE && (
                <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded bg-red-950/20 border border-red-900 text-[10px] text-red-500 font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Recording
                </div>
             )}
          </div>
          
          <div className="flex items-center gap-4">
             {/* In-Call Controls */}
             {status === InterviewStatus.ACTIVE && (
               <div className="flex items-center gap-2 mr-4 border-r border-gray-700 pr-4">
                 <button 
                    onClick={() => toggleMedia('mic')} 
                    title={mediaPermissions.mic ? "Mute Microphone" : "Unmute Microphone"}
                    className={`p-2 rounded-full transition-colors ${mediaPermissions.mic ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
                 >
                    {mediaPermissions.mic ? (
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    ) : (
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM3 3l18 18" /></svg>
                    )}
                 </button>
                 <button 
                    onClick={() => toggleMedia('camera')}
                    title={mediaPermissions.camera ? "Turn Off Camera" : "Turn On Camera"}
                    className={`p-2 rounded-full transition-colors ${mediaPermissions.camera ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
                 >
                    {mediaPermissions.camera ? (
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    ) : (
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" /></svg>
                    )}
                 </button>
               </div>
             )}

             <button onClick={() => handleEnd('completed')} className="px-5 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider transition-all rounded">
               End Session
             </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="relative flex-1 bg-cyber-black flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-[length:30px_30px] opacity-10"></div>
          
          <video ref={videoRef} autoPlay muted playsInline className="absolute min-w-full min-h-full object-cover opacity-20" />
          
          {/* Config / Active State */}
          <div className="z-20 transform scale-110">
            {status === InterviewStatus.ACTIVE ? (
              <Avatar volume={audioVolume} isActive={true} />
            ) : (
               <div className="text-center space-y-4 relative z-30 bg-cyber-900/80 p-8 rounded-2xl border border-cyber-800 backdrop-blur-lg shadow-2xl w-[420px]">
                 <div className="mb-6">
                    <p className="text-cyber-blue font-bold text-xs uppercase tracking-widest mb-1">System Check</p>
                    <h2 className="text-2xl font-bold text-white">{candidateProfile.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">{jobProfile.title}</p>
                 </div>

                 {/* Permissions Toggle UI */}
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Camera Toggle */}
                    <button 
                      type="button"
                      onClick={() => toggleMedia('camera')}
                      className={`group p-4 rounded border flex flex-col items-center gap-3 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-900 ${mediaPermissions.camera ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 focus:ring-emerald-500' : 'bg-red-500/10 border-red-500/50 text-red-400 focus:ring-red-500 hover:bg-red-500/20'}`}
                    >
                       <div className="w-full flex justify-end">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${mediaPermissions.camera ? 'bg-emerald-500 border-emerald-500' : 'border-red-400/50'}`}>
                             {mediaPermissions.camera && <svg className="w-3 h-3 text-cyber-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                       </div>
                       <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {mediaPermissions.camera ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          )}
                       </svg>
                       <span className="text-[10px] font-bold uppercase tracking-wider">{mediaPermissions.camera ? 'Camera Ready' : 'Enable Camera'}</span>
                    </button>

                    {/* Mic Toggle */}
                    <button 
                      type="button"
                      onClick={() => toggleMedia('mic')}
                      className={`group p-4 rounded border flex flex-col items-center gap-3 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-900 ${mediaPermissions.mic ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 focus:ring-emerald-500' : 'bg-red-500/10 border-red-500/50 text-red-400 focus:ring-red-500 hover:bg-red-500/20'}`}
                    >
                       <div className="w-full flex justify-end">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${mediaPermissions.mic ? 'bg-emerald-500 border-emerald-500' : 'border-red-400/50'}`}>
                             {mediaPermissions.mic && <svg className="w-3 h-3 text-cyber-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                       </div>
                       <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {mediaPermissions.mic ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="2 2" />
                          )}
                       </svg>
                       <span className="text-[10px] font-bold uppercase tracking-wider">{mediaPermissions.mic ? 'Mic Ready' : 'Enable Mic'}</span>
                    </button>
                 </div>

                 <div className="flex flex-col gap-3">
                   {!isMediaReady && (
                      <p className="text-[10px] text-gray-500 text-center animate-pulse">
                         Media access required to begin assessment.
                      </p>
                   )}
                   
                   <button 
                      onClick={handleStart}
                      disabled={!isMediaReady || status === InterviewStatus.CONNECTING}
                      className={`px-12 py-4 rounded bg-white text-cyber-black font-bold uppercase tracking-widest text-sm transition-all hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                   >
                      {status === InterviewStatus.CONNECTING ? 'Connecting...' : 'Start Interview'}
                   </button>
                 </div>
                 
                 {error && <p className="text-red-400 text-xs mt-2 max-w-xs mx-auto text-center">{error}</p>}
               </div>
            )}
          </div>
        </div>

        {/* Transcript Log */}
        <div className="h-48 bg-cyber-900 border-t border-cyber-800 p-6 overflow-y-auto z-20 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-3">
             {transcripts.map((t, idx) => (
               <div key={idx} className={`flex ${t.speaker === 'agent' ? 'justify-start' : 'justify-end'}`}>
                 <div className={`max-w-[80%] p-3 rounded text-sm leading-relaxed ${t.speaker === 'agent' ? 'text-cyber-blue' : 'text-gray-300'}`}>
                   <span className="text-[10px] opacity-50 block mb-1 uppercase font-bold tracking-wider">{t.speaker === 'agent' ? 'NOVA' : 'CANDIDATE'}</span>
                   {t.text}
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-80 bg-cyber-black border-l border-cyber-800 p-6 flex flex-col gap-8 z-30">
        <div className="pb-4 border-b border-cyber-800">
          <h2 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Interview Context</h2>
          <p className="text-white font-bold text-lg">{jobProfile.title}</p>
        </div>

        <FraudMonitor isStreaming={status === InterviewStatus.ACTIVE} />

        <div className="flex-1">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {jobProfile.techStack.map(tech => (
              <span key={tech} className="text-[10px] px-3 py-1 rounded bg-cyber-900 border border-cyber-700 text-gray-300">
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