export interface AiTaskItem {
  name: string;
  project?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

export interface AiLogItem {
  project?: string;
  task?: string;
  hours: number;
  description: string;
  challenges?: string;
  achievement?: string;
  tomorrowPlan?: string;
}

export interface WorkContext {
  date: string;
  hoursLogged: number;
  completedTasks: AiTaskItem[];
  pendingTasks: AiTaskItem[];
  logs: AiLogItem[];
}

export interface DailySummaryResult {
  headline: string;
  summary: string;
  completed: string[];
  pending: string[];
  highlights: string[];
}

export interface ProductivityResult {
  score: number;
  scoreLabel: string;
  rationale: string;
  strengths: string[];
  improvements: string[];
}

export interface TomorrowPlanResult {
  focus: string;
  schedule: { time: string; item: string; why?: string }[];
  watchOuts: string[];
}

export interface AiInsightsResult {
  summary: DailySummaryResult;
  productivity: ProductivityResult;
  plan: TomorrowPlanResult;
}

export interface AiResponse<T> {
  ok: boolean;
  configured: boolean;
  data?: T;
  error?: string;
}
