import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import InterviewRoom from './pages/InterviewRoom';
import ReportView from './pages/ReportView';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateLogin from './pages/CandidateLogin';
import { JobProfile, TranscriptItem, CandidateProfile } from './types';

const INITIAL_JOBS: JobProfile[] = [
  {
    id: 'REQ-2025-001',
    title: 'Senior Azure Data Engineer',
    description: 'Experienced Data Engineer proficient in the Azure ecosystem including Databricks, Data Factory, SQL Server, and PowerBI.',
    techStack: ['PowerBI', 'Azure Data Engineering', 'Azure Databricks', 'Azure Data Factory', 'SQL Server', 'ADLS 2'],
    softSkills: ['Communication', 'Problem Solving', 'Leadership']
  },
  {
    id: 'REQ-2025-002',
    title: 'PowerBI Developer',
    description: 'Specialist in designing and deploying high-impact business intelligence dashboards. Requires deep expertise in DAX, data modeling, and transforming complex data into actionable insights.',
    techStack: ['PowerBI', 'DAX', 'Power Query', 'SQL Server', 'Data Modeling', 'Excel'],
    softSkills: ['Data Storytelling', 'Analytical Thinking', 'Stakeholder Management']
  }
];

type ViewState = 'landing' | 'recruiter-dash' | 'candidate-login' | 'interview' | 'report';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  
  // App State
  const [jobs, setJobs] = useState<JobProfile[]>(INITIAL_JOBS);
  const [currentCandidate, setCurrentCandidate] = useState<CandidateProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobProfile | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [interviewDuration, setInterviewDuration] = useState<number>(0);
  const [failureReason, setFailureReason] = useState<'completed' | 'timeout'>('completed');
  
  // Stores ID from URL link
  const [preselectedJobId, setPreselectedJobId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check URL parameters on mount
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    
    if (jobId) {
      setPreselectedJobId(jobId);
      setView('candidate-login');
      // Optional: Clean URL so the user can navigate cleanly afterwards, 
      // but keeping it is also fine for refresh persistence.
      // window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const ensureApiKey = async () => {
    if (process.env.API_KEY) {
      return true;
    }
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
      return true;
    }
    console.warn("No API Key found. Ensure process.env.API_KEY is set.");
    return !!process.env.API_KEY;
  };

  const handleStartInterview = async () => {
    const ready = await ensureApiKey();
    if (ready && selectedJob && currentCandidate) {
      setFailureReason('completed'); // Reset
      setView('interview');
    } else {
      if (!ready) alert("API Key is required to run NOVA.");
    }
  };

  const handleFinishInterview = (data: TranscriptItem[], duration: number, reason: 'completed' | 'timeout' = 'completed') => {
    setTranscripts(data);
    setInterviewDuration(duration);
    setFailureReason(reason);
    setView('report');
  };

  const handleCandidateLogin = (candidate: CandidateProfile, jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setCurrentCandidate(candidate);
      setSelectedJob(job);
      handleStartInterview();
    }
  };

  const handleAddJob = (job: JobProfile) => {
    setJobs([...jobs, job]);
  };

  return (
    <main className="antialiased text-white bg-cyber-black min-h-screen selection:bg-cyber-blue selection:text-white">
      
      {view === 'landing' && (
        <LandingPage 
          onCandidateEnter={() => setView('candidate-login')} 
          onRecruiterEnter={() => setView('recruiter-dash')}
        />
      )}

      {view === 'recruiter-dash' && (
        <RecruiterDashboard 
          jobs={jobs}
          onAddJob={handleAddJob}
          onExit={() => setView('landing')}
        />
      )}

      {view === 'candidate-login' && (
        <CandidateLogin 
          jobs={jobs}
          initialJobId={preselectedJobId}
          onLogin={handleCandidateLogin}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'interview' && selectedJob && currentCandidate && (
        <InterviewRoom 
          jobProfile={selectedJob} 
          candidateProfile={currentCandidate}
          onFinish={handleFinishInterview} 
        />
      )}

      {view === 'report' && selectedJob && currentCandidate && (
        <ReportView 
          jobProfile={selectedJob}
          candidateProfile={currentCandidate}
          transcripts={transcripts}
          duration={interviewDuration}
          failureReason={failureReason}
          onRestart={() => setView('landing')} 
        />
      )}
    </main>
  );
}

export default App;