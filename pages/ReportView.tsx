import React from 'react';
import { TranscriptItem } from '../types';

interface ReportViewProps {
  transcripts: TranscriptItem[];
  onRestart: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ transcripts, onRestart }) => {
  // In a real app, we would send the transcript to Gemini for a summary.
  // Here we mock the analysis based on transcript length for demo purposes.
  
  const wordCount = transcripts.reduce((acc, t) => acc + t.text.split(' ').length, 0);
  const score = Math.min(95, Math.max(40, Math.floor(wordCount / 5)));
  const status = score > 80 ? 'HIRE' : score > 60 ? 'CONSIDER' : 'NO_HIRE';

  return (
    <div className="min-h-screen bg-veritas-900 p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold">Interview Analysis Report</h1>
          <button onClick={onRestart} className="text-gray-400 hover:text-white underline">Back to Home</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Main Score Card */}
          <div className="glass-panel p-8 rounded-xl text-center md:col-span-1 flex flex-col justify-center">
            <h3 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-4">VirtuHire Recommendation</h3>
            <div className={`text-6xl font-bold mb-2 ${status === 'HIRE' ? 'text-green-400' : status === 'NO_HIRE' ? 'text-red-400' : 'text-yellow-400'}`}>
              {status}
            </div>
            <div className="text-2xl font-mono text-white mb-2">{score}/100</div>
            <span className="inline-block px-3 py-1 rounded-full bg-gray-800 text-xs text-gray-400">Confidence: 94%</span>
          </div>

          {/* Details */}
          <div className="glass-panel p-6 rounded-xl md:col-span-2 space-y-6">
            <div>
              <h3 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-2">Key Observations</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Candidate demonstrated solid understanding of core concepts.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Communication was clear and concise.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">!</span> Slightly hesitant on architectural scalability questions.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-2">Fraud Analysis</h3>
              <div className="flex gap-4">
                <div className="bg-green-900/30 border border-green-500/30 p-3 rounded flex-1">
                  <div className="text-xs text-gray-400">Lip Sync</div>
                  <div className="text-green-400 font-bold">Pass</div>
                </div>
                <div className="bg-green-900/30 border border-green-500/30 p-3 rounded flex-1">
                  <div className="text-xs text-gray-400">Presence</div>
                  <div className="text-green-400 font-bold">Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Log */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="bg-gray-800/50 p-4 border-b border-gray-700">
             <h3 className="text-white font-bold">Full Transcript</h3>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto space-y-4">
            {transcripts.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-16 text-xs text-gray-500 font-mono pt-1 text-right">{t.speaker}</div>
                <div className="flex-1 text-sm text-gray-300">{t.text}</div>
              </div>
            ))}
            {transcripts.length === 0 && <p className="text-gray-500 italic">No transcript available.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportView;