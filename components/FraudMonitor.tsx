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

  // Simulation effect
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setMetrics({
        eyeContact: 85 + Math.random() * 15,
        voiceMatch: 95 + Math.random() * 5,
        lipSync: 90 + Math.random() * 10,
        presence: Math.random() > 0.99 ? 'SUSPICIOUS' : 'VERIFIED'
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="glass-panel p-4 rounded-lg space-y-3 w-full">
      <h3 className="text-veritas-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        Security Protocol
      </h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Gaze Tracking</span>
          <span className={metrics.eyeContact < 90 ? "text-yellow-400" : "text-green-400"}>
            {metrics.eyeContact.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 h-1 rounded">
          <div className="bg-veritas-accent h-1 rounded transition-all duration-500" style={{width: `${metrics.eyeContact}%`}}></div>
        </div>

        <div className="flex justify-between text-xs pt-1">
          <span className="text-gray-400">Audio/Lip Sync</span>
          <span className={metrics.lipSync < 92 ? "text-yellow-400" : "text-green-400"}>
            {metrics.lipSync.toFixed(1)}%
          </span>
        </div>
         <div className="w-full bg-gray-700 h-1 rounded">
          <div className="bg-purple-500 h-1 rounded transition-all duration-500" style={{width: `${metrics.lipSync}%`}}></div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-700 mt-2">
        <div className="flex items-center justify-between">
           <span className="text-xs text-gray-500">Identity Status</span>
           <span className={`text-xs font-bold px-2 py-0.5 rounded ${metrics.presence === 'VERIFIED' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
             {metrics.presence}
           </span>
        </div>
      </div>
    </div>
  );
};

export default FraudMonitor;