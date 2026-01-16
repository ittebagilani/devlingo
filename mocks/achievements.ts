import { Achievement } from '@/types/game';

export const achievements: Achievement[] = [
  {
    id: 'first-problem',
    title: 'First Steps',
    description: 'Solve your first problem',
    icon: 'Sparkles',
    xpReward: 10,
    requirement: { type: 'problems_solved', value: 1 },
  },
  {
    id: 'problem-solver-5',
    title: 'Problem Solver',
    description: 'Solve 5 problems',
    icon: 'Target',
    xpReward: 25,
    requirement: { type: 'problems_solved', value: 5 },
  },
  {
    id: 'problem-solver-10',
    title: 'Algorithm Apprentice',
    description: 'Solve 10 problems',
    icon: 'Award',
    xpReward: 50,
    requirement: { type: 'problems_solved', value: 10 },
  },
  {
    id: 'problem-solver-25',
    title: 'Code Warrior',
    description: 'Solve 25 problems',
    icon: 'Sword',
    xpReward: 100,
    requirement: { type: 'problems_solved', value: 25 },
  },
  {
    id: 'streak-3',
    title: 'Getting Warmed Up',
    description: 'Achieve a 3-day streak',
    icon: 'Flame',
    xpReward: 30,
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Achieve a 7-day streak',
    icon: 'Zap',
    xpReward: 75,
    requirement: { type: 'streak', value: 7 },
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: 'Achieve a 30-day streak',
    icon: 'Crown',
    xpReward: 200,
    requirement: { type: 'streak', value: 30 },
  },
  {
    id: 'first-boss',
    title: 'Boss Slayer',
    description: 'Defeat your first boss',
    icon: 'Shield',
    xpReward: 50,
    requirement: { type: 'boss_defeated', value: 1 },
  },
  {
    id: 'boss-master',
    title: 'Boss Master',
    description: 'Defeat 3 bosses',
    icon: 'Trophy',
    xpReward: 150,
    requirement: { type: 'boss_defeated', value: 3 },
  },
  {
    id: 'level-1',
    title: 'Array Adept',
    description: 'Complete the Arrays level',
    icon: 'CheckCircle',
    xpReward: 40,
    requirement: { type: 'level_completed', value: 1 },
  },
  {
    id: 'level-3',
    title: 'Data Structure Pro',
    description: 'Complete 3 levels',
    icon: 'Star',
    xpReward: 100,
    requirement: { type: 'level_completed', value: 3 },
  },
  {
    id: 'perfect-level',
    title: 'Perfectionist',
    description: 'Complete a level without any wrong answers',
    icon: 'Gem',
    xpReward: 75,
    requirement: { type: 'perfect_run', value: 1 },
  },
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return achievements.find((a) => a.id === id);
};