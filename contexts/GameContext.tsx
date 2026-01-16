import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { UserProgress, Achievement } from '@/types/game';
import { levels } from '@/mocks/levels';
import { achievements as allAchievements } from '@/mocks/achievements';

const STORAGE_KEY = 'devingo_progress';

const defaultProgress: UserProgress = {
  currentLevelId: 'arrays',
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  completedLessons: [],
  completedProblems: [],
  defeatedBosses: [],
  unlockedAchievements: [],
  problemAttempts: {},
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const [GameProvider, useGame] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UserProgress>(defaultProgress);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const progressQuery = useQuery({
    queryKey: ['gameProgress'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProgress;
        return parsed;
      }
      return defaultProgress;
    },
  });

  const { mutate: saveProgress } = useMutation({
    mutationFn: async (newProgress: UserProgress) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['gameProgress'], data);
    },
  });

  useEffect(() => {
    if (progressQuery.data) {
      const today = getTodayDate();
      const lastActive = progressQuery.data.lastActiveDate;
      
      let updatedProgress = { ...progressQuery.data };
      
      if (lastActive && lastActive !== today) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          updatedProgress.currentStreak = 0;
        }
      }
      
      setProgress(updatedProgress);
    }
  }, [progressQuery.data]);

  const checkAndUnlockAchievements = useCallback((currentProgress: UserProgress): string[] => {
    const newlyUnlocked: string[] = [];
    
    allAchievements.forEach((achievement) => {
      if (currentProgress.unlockedAchievements.includes(achievement.id)) return;
      
      let unlocked = false;
      switch (achievement.requirement.type) {
        case 'problems_solved':
          unlocked = currentProgress.completedProblems.length >= achievement.requirement.value;
          break;
        case 'streak':
          unlocked = currentProgress.currentStreak >= achievement.requirement.value;
          break;
        case 'boss_defeated':
          unlocked = currentProgress.defeatedBosses.length >= achievement.requirement.value;
          break;
        case 'level_completed':
          const completedLevels = levels.filter((level) => {
            const allProblemsCompleted = level.problems.every((p) =>
              currentProgress.completedProblems.includes(p.id)
            );
            return allProblemsCompleted;
          });
          unlocked = completedLevels.length >= achievement.requirement.value;
          break;
      }
      
      if (unlocked) {
        newlyUnlocked.push(achievement.id);
      }
    });
    
    return newlyUnlocked;
  }, []);

  const updateProgress = useCallback((updates: Partial<UserProgress>) => {
    const newProgress = { ...progress, ...updates, lastActiveDate: getTodayDate() };
    setProgress(newProgress);
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  const addXp = useCallback((amount: number) => {
    const newXp = progress.totalXp + amount;
    setXpGained(amount);
    setTimeout(() => setXpGained(null), 2000);
    
    const updatedProgress: UserProgress = {
      ...progress,
      totalXp: newXp,
      lastActiveDate: getTodayDate(),
    };
    
    const newAchievements = checkAndUnlockAchievements(updatedProgress);
    if (newAchievements.length > 0) {
      updatedProgress.unlockedAchievements = [
        ...progress.unlockedAchievements,
        ...newAchievements,
      ];
      
      const achievementXp = newAchievements.reduce((sum, id) => {
        const ach = allAchievements.find((a) => a.id === id);
        return sum + (ach?.xpReward || 0);
      }, 0);
      updatedProgress.totalXp += achievementXp;
      
      const firstNewAchievement = allAchievements.find((a) => a.id === newAchievements[0]);
      if (firstNewAchievement) {
        setNewAchievement(firstNewAchievement);
        setTimeout(() => setNewAchievement(null), 3000);
      }
    }
    
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
  }, [progress, saveProgress, checkAndUnlockAchievements]);

  const completeLesson = useCallback((lessonId: string, xpReward: number) => {
    if (progress.completedLessons.includes(lessonId)) return;
    
    updateProgress({
      completedLessons: [...progress.completedLessons, lessonId],
    });
    addXp(xpReward);
  }, [progress, updateProgress, addXp]);

  const completeProblem = useCallback((problemId: string, xpReward: number) => {
    if (progress.completedProblems.includes(problemId)) return;
    
    const today = getTodayDate();
    let newStreak = progress.currentStreak;
    
    if (progress.lastActiveDate !== today) {
      const lastDate = new Date(progress.lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak = progress.currentStreak + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      } else {
        newStreak = progress.currentStreak || 1;
      }
    } else if (progress.currentStreak === 0) {
      newStreak = 1;
    }
    
    const streakBonus = newStreak > 0 ? Math.floor(xpReward * 0.2) : 0;
    
    const updatedProgress: UserProgress = {
      ...progress,
      completedProblems: [...progress.completedProblems, problemId],
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, progress.longestStreak),
      lastActiveDate: today,
    };
    
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
    addXp(xpReward + streakBonus);
  }, [progress, saveProgress, addXp]);

  const defeatBoss = useCallback((bossId: string, xpReward: number) => {
    if (progress.defeatedBosses.includes(bossId)) return;
    
    updateProgress({
      defeatedBosses: [...progress.defeatedBosses, bossId],
    });
    addXp(xpReward);
  }, [progress, updateProgress, addXp]);

  const recordAttempt = useCallback((problemId: string) => {
    const attempts = progress.problemAttempts[problemId] || 0;
    updateProgress({
      problemAttempts: { ...progress.problemAttempts, [problemId]: attempts + 1 },
    });
  }, [progress, updateProgress]);

  const unlockNextLevel = useCallback(() => {
    const currentIndex = levels.findIndex((l) => l.id === progress.currentLevelId);
    if (currentIndex < levels.length - 1) {
      const nextLevel = levels[currentIndex + 1];
      if (progress.totalXp >= nextLevel.xpToUnlock) {
        updateProgress({ currentLevelId: nextLevel.id });
      }
    }
  }, [progress, updateProgress]);

  const isLevelUnlocked = useCallback((levelId: string): boolean => {
    const level = levels.find((l) => l.id === levelId);
    if (!level) return false;
    return progress.totalXp >= level.xpToUnlock;
  }, [progress.totalXp]);

  const isProblemCompleted = useCallback((problemId: string): boolean => {
    return progress.completedProblems.includes(problemId);
  }, [progress.completedProblems]);

  const isLessonCompleted = useCallback((lessonId: string): boolean => {
    return progress.completedLessons.includes(lessonId);
  }, [progress.completedLessons]);

  const getXpForNextLevel = useCallback((): { current: number; needed: number; levelName: string } => {
    const currentIndex = levels.findIndex((l) => l.id === progress.currentLevelId);
    if (currentIndex >= levels.length - 1) {
      return { current: progress.totalXp, needed: progress.totalXp, levelName: 'Max Level' };
    }
    const nextLevel = levels[currentIndex + 1];
    return {
      current: progress.totalXp,
      needed: nextLevel.xpToUnlock,
      levelName: nextLevel.name,
    };
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
    saveProgress(defaultProgress);
  }, [saveProgress]);

  return {
    progress,
    isLoading: progressQuery.isLoading,
    xpGained,
    newAchievement,
    addXp,
    completeLesson,
    completeProblem,
    defeatBoss,
    recordAttempt,
    unlockNextLevel,
    isLevelUnlocked,
    isProblemCompleted,
    isLessonCompleted,
    getXpForNextLevel,
    resetProgress,
  };
});