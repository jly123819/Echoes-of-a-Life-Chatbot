
export enum LifePhase {
  CHILDHOOD = 'Childhood',
  YOUTH = 'Youth',
  ADULTHOOD = 'Adulthood',
  SENIORITY = 'Seniority'
}

export enum Visibility {
  PRIVATE = 'Private',
  FAMILY = 'Family Shared',
  LEGACY = 'Legacy'
}

export enum ArchiveType {
  INDIVIDUAL = 'Individual',
  FAMILY = 'Family'
}

export interface TimelineEvent {
  id: string;
  event: string;
  timeRange: string;
  phase: LifePhase;
  recordedAt: number;
  evidenceSessions: string[];
  description: string;
  confidence: number;
  visibility: Visibility;
}

export interface LifeWisdom {
  id: string;
  belief: string;
  explanation: string;
  recordedAt: number;
  evidenceSessions: string[];
  confidence: number;
  visibility: Visibility;
}

export interface MemorySession {
  id: string;
  timestamp: number;
  theme: string;
  transcript: string;
  polishedTranscript?: string;
  audioData?: string; // Base64 simulated storage
  mediaUrl?: string; // For local save
  mediaType?: 'audio' | 'upload';
  detectedLanguages?: string[];
  status: 'active' | 'completed';
}

export interface PersonProfile {
  id: string;
  displayName: string;
  ownerName: string;
  archiveType: ArchiveType;
  members: string[];
  password?: string;
  sessions: MemorySession[];
  timeline: TimelineEvent[];
  wisdoms: LifeWisdom[];
}

export interface LifeMemoryStore {
  activePersonId: string | null;
  people: { [id: string]: PersonProfile };
}

export type Step = 
  | 'cover' 
  | 'intro' 
  | 'identity_select' 
  | 'identity_init' 
  | 'identity_type'
  | 'identity_members'
  | 'identity_setup_password' 
  | 'identity_password' 
  | 'theme' 
  | 'listen' 
  | 'listen_wisdom'
  | 'reflect' 
  | 'distill' 
  | 'archive_choice'
  | 'approval_workflow'
  | 'local_archive_ask'
  | 'conflict_resolution'
  | 'time_collection'
  | 'timeline' 
  | 'wisdom'
  | 'legacy' 
  | 'search';

export type Language = 'en' | 'es' | 'zh';
