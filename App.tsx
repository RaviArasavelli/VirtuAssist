import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import InterviewRoom from './pages/InterviewRoom';
import ReportView from './pages/ReportView';
import { JobProfile, TranscriptItem } from './types';

const MOCK_JOB: JobProfile = {
  id: 'REQ-2025-001',
  title: 'Senior Azure Data Engineer',
  description: 'We are looking for an experienced Data Engineer proficient in the Azure ecosystem including Databricks, Data Factory, SQL Server, and PowerBI reporting.',
  techStack: ['PowerBI', 'Azure Data Engineering', 'Azure Databricks', 'Azure Data Factory', 'SQL Server', 'ADLS 2'],
  softSkills: ['Communication', 'Problem Solving', 'Leadership']
};

function App() {
  const [view, setView] = useState<'landing' | 'interview' | 'report'>('landing');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);

  // Handle API Key selection for the "Best possible" solution using Veo/Gemini Pro logic
  const ensureApiKey = async () => {
    // If env var is set, use it (dev mode)
    if (process.env.API_KEY) {
      return true;
    }

    // Otherwise use the requested window.aistudio method
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
      // Assuming env is injected after selection.
      return true;
    }
    
    // Fallback if running locally without the studio wrapper
    console.warn("No API Key found. Ensure process.env.API_KEY is set.");
    return !!process.env.API_KEY;
  };

  const handleStartInterview = async () => {
    const ready = await ensureApiKey();
    if (ready) {
      setView('interview');
    } else {
        alert("API Key is required to run Veritas AI.");
    }
  };

  const handleFinishInterview = (data: TranscriptItem[]) => {
    setTranscripts(data);
    setView('report');
  };

  return (
    <main className="antialiased text-gray-100 bg-veritas-900 min-h-screen">
      {view === 'landing' && <LandingPage onStart={handleStartInterview} />}
      {view === 'interview' && (
        <InterviewRoom 
          jobProfile={MOCK_JOB} 
          onFinish={handleFinishInterview} 
        />
      )}
      {view === 'report' && (
        <ReportView 
          transcripts={transcripts} 
          onRestart={() => setView('landing')} 
        />
      )}
    </main>
  );
}

export default App;