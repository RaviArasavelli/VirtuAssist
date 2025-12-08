import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500 rounded-full blur-[120px] opacity-20"></div>

      <div className="z-10 text-center max-w-4xl px-6">
        <div className="inline-block mb-4 px-3 py-1 border border-veritas-accent/30 rounded-full bg-veritas-accent/10">
          <span className="text-veritas-accent text-xs font-bold tracking-[0.2em] uppercase">Enterprise Grade AI Interviewer</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-display font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
          VIRTUHIRE
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          The autonomous interviewing engine that saves millions. Detect fraud, standardize quality, and hire the best talent 24/7 with zero human bias.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          <div className="glass-panel p-6 rounded-xl hover:border-veritas-accent/50 transition-colors">
            <div className="text-veritas-accent text-2xl mb-2">⚡</div>
            <h3 className="font-bold mb-2">90% Time Saved</h3>
            <p className="text-sm text-gray-400">Replace initial technical screens with an always-on expert agent.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl hover:border-veritas-accent/50 transition-colors">
            <div className="text-veritas-accent text-2xl mb-2">🛡️</div>
            <h3 className="font-bold mb-2">Anti-Fraud Core</h3>
            <p className="text-sm text-gray-400">Real-time lip-sync detection, proxy alerts, and identity verification.</p>
          </div>
          <div className="glass-panel p-6 rounded-xl hover:border-veritas-accent/50 transition-colors">
            <div className="text-veritas-accent text-2xl mb-2">📊</div>
            <h3 className="font-bold mb-2">Unbiased Data</h3>
            <p className="text-sm text-gray-400">Instant, structured transcripts and hiring matrices.</p>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-veritas-500 font-display rounded-lg hover:bg-veritas-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-veritas-500 focus:ring-offset-veritas-900"
        >
          <span>Launch Prototype</span>
          <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;