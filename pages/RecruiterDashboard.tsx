import React, { useState } from 'react';
import { JobProfile } from '../types';

interface RecruiterDashboardProps {
  jobs: JobProfile[];
  onAddJob: (job: JobProfile) => void;
  onExit: () => void;
}

const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ jobs, onAddJob, onExit }) => {
  const [showForm, setShowForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null); // Stores Job ID for invite
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // New Job State
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    techStack: '',
    softSkills: ''
  });

  // Invite State
  const [inviteData, setInviteData] = useState({
    candidateEmail: '',
    date: '',
    time: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const job: JobProfile = {
      id: `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      title: newJob.title,
      description: newJob.description,
      techStack: newJob.techStack.split(',').map(s => s.trim()).filter(Boolean),
      softSkills: newJob.softSkills.split(',').map(s => s.trim()).filter(Boolean)
    };
    onAddJob(job);
    setShowForm(false);
    setNewJob({ title: '', description: '', techStack: '', softSkills: '' });
  };

  const activeJobForInvite = jobs.find(j => j.id === showInviteModal);

  // Generates the link dynamically based on where the app is running
  const getInviteLink = () => {
    // Robustly construct the URL preserving the current path (e.g. /virtuhire/ or /preview-id/)
    // This handles cases where the app is not at the domain root.
    const protocol = window.location.protocol;
    const host = window.location.host;
    const path = window.location.pathname;
    
    // Ensure we don't double up slashes if pathname is just "/"
    const baseUrl = `${protocol}//${host}${path}`;
    
    // Append query params
    return `${baseUrl}?jobId=${activeJobForInvite?.id || ''}&s=${Math.floor(Math.random() * 1000000)}`;
  };

  // Date Logic
  const today = new Date().toISOString().split('T')[0];
  
  const getMinTime = () => {
    if (inviteData.date === today) {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    return undefined;
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate Backend API Call
    setInviteStatus('sending');

    // NOTE: Real SMTP requires a backend. This simulates the network request.
    setTimeout(() => {
        const link = getInviteLink();
        const subject = encodeURIComponent(`Interview Invitation: ${activeJobForInvite?.title} at NOVA`);
        const body = encodeURIComponent(
    `Hello,

You have been invited to a technical assessment for the role of ${activeJobForInvite?.title}.

Please access the interview portal using the secure link below:
${link}

Date: ${inviteData.date}
Time: ${inviteData.time}

Best regards,
NOVA Recruitment Team`
        );

        // Open default mail client as fallback since we don't have a backend
        window.location.href = `mailto:${inviteData.candidateEmail}?subject=${subject}&body=${body}`;

        setInviteStatus('sent');
        setTimeout(() => {
            setInviteStatus('idle');
            setShowInviteModal(null);
            setInviteData({ candidateEmail: '', date: '', time: '' });
        }, 2000);
    }, 1500);
  };

  const handleCopyLink = () => {
    try {
      const link = getInviteLink();
      navigator.clipboard.writeText(link).then(() => {
        alert("Interview link copied to clipboard!");
      }).catch(err => {
        console.error("Clipboard error:", err);
        // Fallback for manual copy
        alert(`Copy this link manually: ${link}`);
      });
    } catch (e) {
      console.error("Clipboard error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black p-6 font-sans text-white relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 border-b border-cyber-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center relative">
             {/* Round Logo */}
             <div className="absolute inset-0 rounded-full border-[2px] border-cyber-blue border-l-transparent animate-spin-slow"></div>
             <div className="w-6 h-6 bg-cyber-blue rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
             </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">NOVA <span className="text-cyber-blue text-sm font-normal">RECRUITER</span></h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Dashboard</p>
          </div>
        </div>
        <button onClick={onExit} className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
          Exit System
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* Actions Bar */}
        <div className="mb-8 flex items-center justify-between">
           <h2 className="text-white font-bold text-lg flex items-center gap-2">
             Active Job Requisitions
           </h2>
           <button 
             onClick={() => setShowForm(true)}
             className="px-5 py-2.5 bg-cyber-blue hover:bg-blue-600 text-white transition-all text-xs font-bold uppercase tracking-widest rounded shadow-lg shadow-blue-900/20 flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             Create New Position
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-cyber-900/30 border border-cyber-800 p-6 rounded-lg hover:border-cyber-blue/30 transition-all duration-300 flex flex-col h-full">
               <div className="flex justify-between items-start mb-4">
                 <div className="px-2 py-1 bg-cyber-900 border border-cyber-800 rounded text-[10px] font-mono text-gray-400">{job.id}</div>
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/30 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase">Active</span>
                 </div>
               </div>
               
               <h3 className="font-bold text-lg mb-2 text-white">{job.title}</h3>
               <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-grow">{job.description}</p>
               
               <div className="space-y-4">
                 <div>
                   <div className="flex flex-wrap gap-1">
                     {job.techStack.slice(0, 3).map(t => (
                       <span key={t} className="text-[10px] px-2 py-1 bg-cyber-black border border-cyber-800 rounded text-gray-300">{t}</span>
                     ))}
                     {job.techStack.length > 3 && <span className="text-[10px] px-2 py-1 text-gray-500">+{job.techStack.length - 3}</span>}
                   </div>
                 </div>

                 <button 
                    onClick={() => setShowInviteModal(job.id)}
                    className="w-full py-2 bg-cyber-black border border-cyber-700 hover:border-cyber-blue hover:text-cyber-blue text-gray-300 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Send Invitation
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && activeJobForInvite && (
        <div className="fixed inset-0 bg-cyber-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-cyber-900 border border-cyber-700 p-8 rounded-lg max-w-lg w-full relative shadow-2xl">
              <button onClick={() => setShowInviteModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {inviteStatus === 'idle' ? (
                <>
                  <div className="mb-6">
                    <h2 className="font-bold text-xl text-white mb-1">Invite Candidate</h2>
                    <p className="text-xs text-cyber-blue uppercase tracking-widest">{activeJobForInvite.title}</p>
                  </div>

                  <form onSubmit={handleSendInvite} className="space-y-4">
                     <div>
                        <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Candidate Email</label>
                        <input 
                           type="email" 
                           required
                           className="w-full bg-cyber-black border border-cyber-700 rounded p-3 text-sm text-white focus:border-cyber-blue focus:outline-none transition-colors"
                           placeholder="candidate@example.com"
                           value={inviteData.candidateEmail}
                           onChange={e => setInviteData({...inviteData, candidateEmail: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Interview Date</label>
                           <input 
                              type="date" 
                              required
                              min={today}
                              className="w-full bg-cyber-black border border-cyber-700 rounded p-3 text-sm text-white focus:border-cyber-blue focus:outline-none transition-colors"
                              value={inviteData.date}
                              onChange={e => setInviteData({...inviteData, date: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Time (Local)</label>
                           <input 
                              type="time" 
                              required
                              min={getMinTime()}
                              className="w-full bg-cyber-black border border-cyber-700 rounded p-3 text-sm text-white focus:border-cyber-blue focus:outline-none transition-colors"
                              value={inviteData.time}
                              onChange={e => setInviteData({...inviteData, time: e.target.value})}
                           />
                        </div>
                     </div>

                     <div className="p-4 bg-cyber-black rounded border border-cyber-800 mt-4">
                        <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2">Invite Link</label>
                        <div className="flex gap-2">
                            <div className="flex-1 text-xs text-cyber-blue font-mono break-all bg-cyber-900/50 p-2 rounded overflow-hidden whitespace-nowrap text-ellipsis">
                                {getInviteLink()}
                            </div>
                            <button type="button" onClick={handleCopyLink} className="px-3 py-1 bg-cyber-700 hover:bg-cyber-600 rounded text-xs font-bold text-white">
                                Copy
                            </button>
                        </div>
                     </div>

                     <button type="submit" className="w-full mt-2 bg-white text-cyber-black hover:bg-gray-200 font-bold py-3 rounded uppercase tracking-widest text-xs transition-colors">
                        Send Invitation via Email
                     </button>
                  </form>
                </>
              ) : (
                <div className="py-12 text-center">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${inviteStatus === 'sending' ? 'border-cyber-blue/30' : 'border-emerald-500/20 bg-emerald-500/10'}`}>
                      {inviteStatus === 'sending' ? (
                          <div className="w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      )}
                   </div>
                   <h3 className="text-white font-bold text-lg mb-2">{inviteStatus === 'sending' ? 'Connecting to Mail Server...' : 'Sent Successfully'}</h3>
                   <p className="text-gray-400 text-sm">
                       {inviteStatus === 'sending' ? 'Preparing secure invitation...' : 'Invitation dispatched.'}
                   </p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-cyber-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-900 border border-cyber-700 p-8 rounded-lg max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="font-bold text-2xl mb-6 text-white">Create Protocol</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Role Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-cyber-black border border-cyber-700 rounded p-3 text-sm text-white focus:border-cyber-blue focus:outline-none transition-all"
                  placeholder="e.g. Senior Data Engineer"
                  value={newJob.title}
                  onChange={e => setNewJob({...newJob, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Role Context</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full bg-cyber-black border border-cyber-700 rounded p-3 text-sm text-white focus:border-cyber-blue focus:outline-none transition-all"
                  placeholder="Requirements..."
                  value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Tech Stack</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-cyber-black border border-cyber-700 rounded p-3 text-sm text-white focus:border-cyber-blue focus:outline-none transition-all"
                  placeholder="e.g. React, TypeScript..."
                  value={newJob.techStack}
                  onChange={e => setNewJob({...newJob, techStack: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Soft Skills</label>
                <input 
                  type="text" 
                  className="w-full bg-cyber-black border border-cyber-700 rounded p-3 text-sm text-white focus:border-cyber-blue focus:outline-none transition-all"
                  placeholder="e.g. Leadership..."
                  value={newJob.softSkills}
                  onChange={e => setNewJob({...newJob, softSkills: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-cyber-blue hover:bg-blue-600 text-white font-bold py-3 rounded uppercase tracking-widest text-xs transition-colors">
                  Create Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;