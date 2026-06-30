export interface Subtask {
  title: string;
  completed: boolean;
  duration?: string;
  difficulty?: string;
  proTips?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  dueDate: string;
  category: string;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
  // Prioritization details from Gemini AI
  aiQuadrant?: string;
  aiLabel?: string;
  aiExplanation?: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: string; // 'daily' | 'weekly'
  streak: number;
  logs: string[]; // dates of logs, e.g. "2026-06-29"
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  progress: number; // 0 - 100
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  suggestedAction: string;
}

export interface UserProfile {
  displayName: string;
  theme: 'light' | 'dark';
  updatedAt: string;
}

export interface UserPrivateInfo {
  email: string;
  encryptedData: string;
  updatedAt: string;
}

export interface AIPlanResponse {
  subtasks: Array<{
    title: string;
    duration: string;
    difficulty: string;
    proTips: string;
  }>;
  motivation: string;
}

export interface AIPrioritizationResponse {
  prioritized: Array<{
    id: string;
    quadrant: string;
    label: string;
    explanation: string;
  }>;
  generalAdvice: string[];
}

export interface AIRecommendationResponse {
  recommendations: Array<{
    title: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
    suggestedAction: string;
  }>;
  productivityScore: number;
  scoreReason: string;
}
