import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { TranscriptItem, JobProfile, CandidateProfile } from '../types';

interface ReportViewProps {
  transcripts: TranscriptItem[];
  jobProfile: JobProfile;
  candidateProfile: CandidateProfile;
  duration: number; // in seconds
  failureReason?: 'completed' | 'timeout';
  onRestart: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ transcripts, jobProfile, candidateProfile, duration, failureReason = 'completed', onRestart }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // LOGIC: If duration is less than 10 seconds or TIMEOUT occurred, Score is N/A (0 for display).
  const isTimeout = failureReason === 'timeout';
  const isDropOff = duration < 10 && !isTimeout;
  
  const wordCount = transcripts.reduce((acc, t) => acc + t.text.split(' ').length, 0);
  const calculatedScore = Math.min(95, Math.max(40, Math.floor(wordCount / 5)));
  
  const score = (isDropOff || isTimeout) ? 0 : calculatedScore;
  
  let status = 'NO_HIRE';
  if (isTimeout) status = 'NO_SHOW';
  else if (isDropOff) status = 'INCOMPLETE';
  else if (score > 80) status = 'HIRE';
  else if (score > 60) status = 'CONSIDER';

  let summaryText = `Candidate demonstrated ${score > 70 ? 'strong' : 'moderate'} proficiency in ${jobProfile.techStack.slice(0,3).join(', ')}. Communication was ${score > 70 ? 'clear and concise' : 'adequate'}.`;
  
  if (isTimeout) {
      summaryText = "Session terminated automatically. Candidate did not join or remained silent for 2 minutes after connection.";
  } else if (isDropOff) {
      summaryText = "Candidate disconnected or left the session immediately (under 10 seconds). No meaningful assessment data available.";
  }

  const generatePDFDocument = () => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();
        
        // --- STUNNING PDF THEME ---

        // 1. Header Background (Deep Blue)
        doc.setFillColor(15, 23, 42); // slate-900 like
        doc.rect(0, 0, 210, 50, 'F');

        // 2. Sidebar Accent (Cyan)
        doc.setFillColor(6, 182, 212); // Cyan
        doc.rect(0, 50, 6, 250, 'F');

        // 3. Header Text
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("NOVA REPORT", 20, 25);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`GENERATED: ${timestamp.toUpperCase()}`, 20, 35);
        doc.text(`REF ID: ${candidateProfile.id}`, 20, 40);

        // 4. Score Block (Right Side)
        doc.setFillColor(37, 99, 235); // Blue
        doc.roundedRect(140, 15, 50, 20, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text(isTimeout ? "N/A" : `${score}/100`, 165, 28, { align: 'center' });

        // 5. Candidate Info Section
        doc.setTextColor(15, 23, 42); // Black/Slate
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("CANDIDATE PROFILE", 20, 70);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(candidateProfile.name, 20, 80);
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(candidateProfile.email, 20, 86);
        doc.text(jobProfile.title, 20, 92);

        // 6. Visual Score Bar
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("ASSESSMENT RESULT", 100, 70);
        
        // Bar Background
        doc.setFillColor(226, 232, 240);
        doc.rect(100, 80, 80, 4, 'F');
        
        // Bar Foreground (Score)
        if (!isTimeout) {
            const scoreColor = score > 80 ? [16, 185, 129] : score > 60 ? [245, 158, 11] : [239, 68, 68];
            doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
            doc.rect(100, 80, 80 * (score / 100), 4, 'F');
        }
        
        const scoreColor = (isTimeout || isDropOff) ? [239, 68, 68] : [37, 99, 235];
        doc.setFontSize(14);
        doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.text(status, 100, 95);

        // 7. Executive Summary
        doc.setFillColor(248, 250, 252);
        doc.rect(20, 110, 170, 30, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(20, 110, 170, 30, 'S');
        
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`SUMMARY: ${summaryText}`, 25, 120, { maxWidth: 160 });

        // 8. Transcript Section
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("INTERVIEW TRANSCRIPT", 20, 160);
        
        doc.setDrawColor(37, 99, 235);
        doc.line(20, 163, 60, 163); // Underline

        let y = 175;
        doc.setFontSize(8);
        doc.setFont("courier", "normal");
        
        transcripts.forEach((t) => {
            const speaker = t.speaker === 'agent' ? 'NOVA' : 'CANDIDATE';
            const prefix = `${speaker}: `;
            const color = t.speaker === 'agent' ? [37, 99, 235] : [71, 85, 105]; // Blue vs Slate
            
            doc.setTextColor(color[0], color[1], color[2]);
            
            // Wrap text
            const textLines = doc.splitTextToSize(prefix + t.text, 170);
            
            // Page Break Check
            if (y + (textLines.length * 4) > 280) {
                doc.addPage();
                // Re-draw sidebar on new page
                doc.setFillColor(6, 182, 212);
                doc.rect(0, 0, 6, 297, 'F');
                y = 20;
            }
            
            doc.text(textLines, 20, y);
            y += (textLines.length * 4) + 3;
        });

        return doc;
  };

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
        try {
            const doc = generatePDFDocument();
            const fileName = `NOVA_REPORT_${candidateProfile.name.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);
        } catch (e) { console.error(e); } 
        finally { setIsGenerating(false); }
    }, 500);
  };

  const handleSaveToDrive = () => {
    setIsGenerating(true);
    setTimeout(() => {
        try {
             // 1. Trigger Download (so user has the file)
            const doc = generatePDFDocument();
            doc.save(`NOVA_REPORT_${candidateProfile.name.replace(/\s+/g, '_')}.pdf`);
            
            // 2. Open Drive Link
            window.open("https://drive.google.com/drive/u/0/folders/1a9pfMIDOgk6L8c-OY1x-fLj2sMbER8Zm", '_blank');
        } catch (e) { console.error(e); }
        finally { setIsGenerating(false); }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-cyber-black p-8 flex items-center justify-center font-sans text-white">
      <div className="max-w-5xl w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-cyber-800">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 flex items-center justify-center relative">
                {/* Round Logo */}
                <div className="absolute inset-0 rounded-full border-[2px] border-cyber-blue border-l-transparent animate-spin-slow"></div>
                <div className="w-6 h-6 bg-cyber-blue rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">ASSESSMENT REPORT</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-1">Confidential</p>
             </div>
           </div>
           <div className="flex gap-4">
              <button onClick={handleDownload} disabled={isGenerating} className="px-6 py-3 bg-white text-cyber-black font-bold uppercase text-xs tracking-widest rounded hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                 Download PDF
              </button>
              <button onClick={handleSaveToDrive} disabled={isGenerating} className="px-6 py-3 bg-cyber-blue text-white font-bold uppercase text-xs tracking-widest rounded hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                 Save to Drive
              </button>
              <button onClick={onRestart} className="px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-colors text-xs font-bold uppercase tracking-widest rounded">
                 Close
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Score Card */}
          <div className="bg-cyber-900 border border-cyber-800 p-8 rounded shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyber-blue opacity-10 blur-xl rounded-full translate-x-10 -translate-y-10"></div>
            <h3 className="text-gray-500 uppercase text-[10px] font-bold tracking-[0.2em] mb-6">Evaluation Result</h3>
            <div className={`text-4xl font-bold mb-2 tracking-wide ${status === 'HIRE' ? 'text-emerald-500' : (isDropOff || isTimeout) ? 'text-red-500' : 'text-gray-400'}`}>
              {status.replace('_', ' ')}
            </div>
            <div className="text-2xl font-mono text-white mb-6">
                {isTimeout ? "N/A" : score}<span className="text-sm text-gray-500">{isTimeout ? "" : "/100"}</span>
            </div>
            
            <div className="w-full bg-cyber-black h-2 rounded-full overflow-hidden">
                <div className={`h-full ${(isDropOff || isTimeout) ? 'bg-red-500' : 'bg-gradient-to-r from-cyber-blue to-cyber-cyan'}`} style={{width: `${score}%`}}></div>
            </div>
            {(isDropOff || isTimeout) && <p className="text-[10px] text-red-400 mt-2 font-bold uppercase">Critical: {isTimeout ? 'No Show / Timeout' : 'Session Aborted Early'}</p>}
          </div>

          {/* Analysis Data */}
          <div className="bg-cyber-900 border border-cyber-800 p-8 rounded md:col-span-2 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-gray-500 uppercase text-[10px] font-bold tracking-[0.2em] mb-4">Executive Summary</h3>
              <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-cyber-blue pl-4">
                {summaryText}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
               {['ID Verified', (isDropOff || isTimeout) ? 'Integrity: N/A' : 'Integrity: High', (isDropOff || isTimeout) ? 'Tech: N/A' : 'Tech: Reviewed'].map((item, i) => (
                 <div key={i} className="bg-cyber-black border border-cyber-800 p-3 rounded text-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="border border-cyber-800 rounded bg-cyber-900">
          <div className="p-4 border-b border-cyber-800 bg-cyber-black/30">
             <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Transcript</h3>
          </div>
          <div className="p-6 max-h-80 overflow-y-auto space-y-4 font-mono text-xs text-gray-400 custom-scrollbar">
            {transcripts.length === 0 ? (
               <div className="text-center text-gray-600 italic">No audio data recorded.</div>
            ) : (
                transcripts.map((t, i) => (
                <div key={i} className="flex gap-4">
                    <div className={`w-24 text-right font-bold flex-shrink-0 ${t.speaker === 'agent' ? 'text-cyber-blue' : 'text-gray-500'}`}>{t.speaker === 'agent' ? 'NOVA' : 'CAND'} ::</div>
                    <div className="flex-1">{t.text}</div>
                </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportView;