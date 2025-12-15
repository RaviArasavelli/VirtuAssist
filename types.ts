
export enum InterviewStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface JobProfile {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  softSkills: string[];
}

export interface CandidateProfile {
  name: string;
  email: string;
  id: string;
}

export interface TranscriptItem {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface Recommendation {
  score: number;
  decision: 'HIRE' | 'NO_HIRE' | 'CONSIDER';
  strengths: string[];
  weaknesses: string[];
  fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'INTERVIEWED';
}
