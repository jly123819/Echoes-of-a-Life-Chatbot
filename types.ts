
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

export interface TimelineEvent {
  id: string;
  event: string;
  timeRange: string;
  phase: LifePhase;
  evidenceSessions: string[];
  description: string;
  confidence: number;
  visibility: Visibility;
}

export interface LifeWisdom {
  id: string;
  belief: string;
  explanation: string;
  evidenceSessions: string[];
  confidence: number;
  visibility: Visibility;
}

export interface MemorySession {
  id: string;
  timestamp: number;
  theme: string;
  transcript: string;
  detectedLanguages?: string[];
  distilledStory?: string;
  status: 'active' | 'completed';
}

export interface PersonProfile {
  id: string;
  displayName: string;
  password?: string;
  sessions: MemorySession[];
  timeline: TimelineEvent[];
  wisdoms: LifeWisdom[];
}

export interface LifeMemoryStore {
  activePersonId: string | null;
  people: { [id: string]: PersonProfile };
}

export type Step = 'intro' | 'identity_select' | 'identity_init' | 'identity_password' | 'theme' | 'listen' | 'reflect' | 'distill' | 'timeline' | 'legacy';
