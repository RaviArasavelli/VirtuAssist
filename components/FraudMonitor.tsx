import React, { useEffect, useState } from 'react';

interface FraudMonitorProps {
  isStreaming: boolean;
}

const FraudMonitor: React.FC<FraudMonitorProps> = ({ isStreaming }) => {
  const [metrics, setMetrics] = useState({
    eyeContact: 98,
    voiceMatch: 99,
    lipSync: 97,
    presence: 'VERIFIED'
  });

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setMetrics({
        eyeContact: 85 + Math.random() * 15,
        voiceMatch: 95 + Math.random() * 5,
        lipSync: 90 + Math.random() * 10,
        presence: Math.random() > 0.99 ? 'ANOMALY' : 'VERIFIED'
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="glass-panel p-5 rounded-lg space-y-5 w-full border-l-2 border-l-cyber-cyan">
      <h3 className="text-cyber-cyan text-[10px] font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        BIOMETRIC SCAN
      </h3>
      
      <div className="space-y-5">
        {/* Eye Contact */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase tracking-wider font-mono">
            <span className="text-cyber-dim">Gaze Vectors</span>
            <span className="text-cyber-cyan font-bold drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
              {metrics.eyeContact.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-cyber-black border border-cyber-800 h-1.5 relative overflow-hidden">
             {/* Background Grid */}
             <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,#000_20%)] bg-[length:4px_100%] opacity-50"></div>
             <div className="bg-cyber-cyan h-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]" style={{width: `${metrics.eyeContact}%`}}></div>
          </div>
        </div>

        {/* Voice Match */}
        <div className="space-y-2">
           <div className="flex justify-between text-[10px] uppercase tracking-wider font-mono">
            <span className="text-cyber-dim">Voice Patterns</span>
            <span className="text-cyber-blue font-bold drop-shadow-[0_0_5px_rgba(37,99,235,0.5)]">
              {metrics.lipSync.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-cyber-black border border-cyber-800 h-1.5 relative">
            <div className="bg-cyber-blue h-full transition-all duration-300 shadow-[0_0_8px_rgba(37,99,235,0.8)]" style={{width: `${metrics.lipSync}%`}}></div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-cyber-cyan/10 mt-2">
        <div className="flex items-center justify-between">
           <span className="text-[10px] text-cyber-dim uppercase tracking-wider font-mono">Status Check</span>
           <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${metrics.presence === 'VERIFIED' ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' : 'bg-red-950/30 border-red-500/50 text-red-400 animate-pulse'}`}>
             {metrics.presence}
           </span>
        </div>
      </div>
    </div>
  );
};

export default FraudMonitor;