export type Difficulty = 'beginner' | 'medium' | 'hard' | 'boss';

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  hints: string[];
  options: string[];
  correctAnswer: number;
  explanation: string;
  isBoss?: boolean;
}

export interface MiniExercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface LessonSection {
  heading: string;
  content: string;
  codeExample?: string;
}

export interface Lesson {
  title: string;
  sections: LessonSection[];
  miniExercises: MiniExercise[];
}

export interface Level {
  id: string;
  name: string;
  icon: string;
  difficulty: Difficulty;
  description: string;
  xpToUnlock: number;
  lesson: Lesson;
  problems: Problem[];
  bossLevel?: Problem;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Unit {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  lesson: {
    sections: LessonSection[];
  };
  quiz: QuizQuestion[];
}

export interface Chapter {
  id: string;
  name: string;
  icon: string;
  difficulty: Difficulty;
  description: string;
  xpToUnlock: number;
  color: string;
  units: Unit[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: {
    type: 'units_completed' | 'streak' | 'chapter_completed' | 'perfect_quiz' | 'problems_solved' | 'boss_defeated' | 'level_completed' | 'perfect_run';
    value: number;
  };
}

export interface UserProgress {
  currentLevelId: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  completedLessons: string[];
  completedProblems: string[];
  defeatedBosses: string[];
  unlockedAchievements: string[];
  problemAttempts: Record<string, number>;
}

export interface GameState extends UserProgress {
  isLoading: boolean;
}
