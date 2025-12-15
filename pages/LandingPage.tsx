
import React from 'react';

interface LandingPageProps {
  onCandidateEnter: () => void;
  onRecruiterEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onCandidateEnter, onRecruiterEnter }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-cyber-black font-sans">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-[0.05] pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyber-blue opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Main Content */}
      <div className="z-10 text-center max-w-5xl px-6 relative">
        
        {/* Animated Round Logo */}
        <div className="flex justify-center mb-10">
          <div className="relative w-32 h-32 flex items-center justify-center">
             {/* Spinning Border */}
             <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyber-blue border-l-cyber-cyan animate-spin-slow shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
             {/* Inner Static Ring */}
             <div className="absolute inset-2 rounded-full border border-gray-800"></div>
             {/* Center Core */}
             <div className="w-16 h-16 bg-gradient-to-br from-cyber-blue to-cyber-cyan rounded-full flex items-center justify-center shadow-lg shadow-cyber-blue/50 relative">
                <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
                {/* Candidate Icon */}
                <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
             </div>
             {/* Satellite Dot */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#fff] animate-pulse"></div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-cyber-900 border border-cyber-800 shadow-sm backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase">System Operational</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight text-white leading-none">
          NOVA
        </h1>
        <p className="text-xl font-light text-gray-400 mb-12 tracking-wide max-w-2xl mx-auto">
          Next-Gen Operational Virtual Assessment
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-left">
          {[
            { title: "Autonomous Interviewer", desc: "Latency-optimized AI agent conducting technical screenings.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            { title: "Fraud Prevention", desc: "Real-time biometric monitoring and identity verification.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { title: "Actionable Insights", desc: "Data-driven hiring recommendations based on tech stack metrics.", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }
          ].map((item, i) => (
            <div key={i} className="bg-cyber-900/40 border border-cyber-800 p-6 rounded-lg hover:border-cyber-blue/50 transition-colors duration-300 backdrop-blur-sm">
              <div className="w-10 h-10 rounded bg-cyber-900 border border-cyber-700 flex items-center justify-center mb-4">
                 <svg className="w-5 h-5 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
              </div>
              <h3 className="font-bold mb-2 text-white text-sm uppercase tracking-wider">{item.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Dual Action Buttons */}
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            
            {/* Candidate Button - Animated Border (Cyan Theme) */}
            <button 
              onClick={onCandidateEnter}
              className="group relative w-72 h-[66px] rounded-lg overflow-hidden flex items-center justify-center bg-cyber-black"
            >
               {/* Rotating Gradient Line Border - Uses custom spin-slow animation */}
               <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#06B6D4_360deg)] animate-spin-slow opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
               
               {/* Inner Content */}
               <div className="relative w-[calc(100%-2px)] h-[calc(100%-2px)] bg-cyber-black rounded-lg flex items-center justify-center gap-3 group-hover:bg-cyber-900 transition-colors z-10">
                 <span className="text-gray-400 group-hover:text-white font-mono text-sm font-bold uppercase tracking-widest z-10 transition-colors">Candidate Access</span>
                 <svg className="w-4 h-4 text-gray-500 group-hover:text-white z-10 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               </div>
            </button>

            {/* Recruiter Button - Animated Border (White/Blue Theme) */}
            <button 
              onClick={onRecruiterEnter}
              className="group relative w-72 h-[66px] rounded-lg overflow-hidden flex items-center justify-center bg-cyber-black"
            >
              {/* Rotating Gradient Line Border - Uses custom spin-slow animation */}
              <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-spin-slow opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Inner Content Block */}
              <div className="relative w-[calc(100%-2px)] h-[calc(100%-2px)] bg-cyber-black rounded-lg flex items-center justify-center gap-3 group-hover:bg-cyber-900 transition-colors z-10">
                 <span className="text-white font-mono text-sm font-bold uppercase tracking-widest">Recruiter Portal</span>
                 <svg className="w-4 h-4 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </div>
            </button>

        </div>
        
        <div className="mt-16 flex items-center justify-center gap-6 opacity-30">
           <span className="text-[10px] font-mono text-gray-500">POWERED BY GEMINI 2.0 FLASH</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;