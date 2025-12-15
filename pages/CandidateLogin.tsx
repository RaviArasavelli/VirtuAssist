import React, { useState, useEffect } from 'react';
import { JobProfile, CandidateProfile } from '../types';

interface CandidateLoginProps {
  jobs: JobProfile[];
  onLogin: (candidate: CandidateProfile, jobId: string) => void;
  onBack: () => void;
  initialJobId?: string;
}

const CandidateLogin: React.FC<CandidateLoginProps> = ({ jobs, onLogin, onBack, initialJobId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Prefer initialJobId if it exists and matches a valid job, otherwise default to first job or empty
  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    if (initialJobId && jobs.some(j => j.id === initialJobId)) {
      return initialJobId;
    }
    return jobs[0]?.id || '';
  });

  // If initialJobId changes (e.g. deep linking happens after mount), update selection
  useEffect(() => {
    if (initialJobId && jobs.some(j => j.id === initialJobId)) {
      setSelectedJobId(initialJobId);
    }
  }, [initialJobId, jobs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;
    
    const candidate: CandidateProfile = {
      name,
      email,
      id: `CAND-${Math.floor(Math.random() * 10000)}`
    };
    onLogin(candidate, selectedJobId);
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
       {/* Simple Professional BG */}
       <div className="absolute inset-0 bg-cyber-900 opacity-50"></div>
       
       <div className="w-full max-w-md relative z-10">
         <button onClick={onBack} className="absolute -top-12 left-0 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Home
         </button>

         <div className="bg-cyber-black border border-cyber-800 p-8 rounded-xl shadow-2xl">
            <div className="text-center mb-8">
               <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center relative">
                  {/* Round Logo */}
                  <div className="absolute inset-0 rounded-full border-[2px] border-cyber-blue border-l-transparent animate-spin-slow"></div>
                  <div className="w-8 h-8 bg-cyber-blue rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
               </div>
               <h1 className="font-bold text-2xl text-white tracking-wide">Candidate Verification</h1>
               <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Enter Access Details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-cyber-900 border border-cyber-700 rounded p-3 text-white focus:border-cyber-blue focus:outline-none transition-all text-sm"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-cyber-900 border border-cyber-700 rounded p-3 text-white focus:border-cyber-blue focus:outline-none transition-all text-sm"
                      placeholder="jane@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                     <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Select Interview Protocol</label>
                     <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {jobs.length === 0 ? (
                           <div className="text-red-400 text-xs p-2 border border-red-900/50 bg-red-950/20 rounded">No protocols active.</div>
                        ) : (
                           jobs.map(job => (
                              <label key={job.id} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${selectedJobId === job.id ? 'bg-cyber-blue/10 border-cyber-blue' : 'bg-cyber-900 border-cyber-800 hover:border-gray-600'}`}>
                                 <input 
                                    type="radio" 
                                    name="job" 
                                    value={job.id}
                                    checked={selectedJobId === job.id}
                                    onChange={() => setSelectedJobId(job.id)}
                                    className="mt-1"
                                 />
                                 <div>
                                    <div className={`text-sm font-bold ${selectedJobId === job.id ? 'text-white' : 'text-gray-400'}`}>{job.title}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{job.techStack.slice(0, 3).join(', ')}</div>
                                 </div>
                              </label>
                           ))
                        )}
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                 <button 
                   type="submit" 
                   disabled={!selectedJobId}
                   className="w-full bg-white text-cyber-black hover:bg-gray-200 font-bold py-3 rounded uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Start Session
                 </button>
                 
                 <button 
                   type="button" 
                   onClick={onBack}
                   className="w-full py-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                 >
                   Return to Home
                 </button>
               </div>
            </form>
         </div>
       </div>
    </div>
  );
};

export default CandidateLogin;