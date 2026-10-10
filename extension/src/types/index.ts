export interface VideoDetails {
  videoId: string;
  title: string;
  channel: string;
  url: string;
  duration: string;
  thumbnail: string;
  description?: string;
}

export interface TimelineItem {
  time: string;
  seconds: number;
  title: string;
}

export interface ConceptItem {
  concept: string;
  detail: string;
}

export interface AnalysisData {
  summary: string;
  timeline: TimelineItem[];
  key_points: string[];
  important_concepts: ConceptItem[];
  notes: string;
}

export interface TranscriptSegment {
  start: number;
  duration: number;
  end: number;
  text: string;
  formatted_time: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamps?: number[];
  sources?: { start: string; end: string; seconds: number; text: string }[];
  time: string;
}

export interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correct_option: number;
  explanation: string;
  timestamp: string;
  seconds: number;
}
