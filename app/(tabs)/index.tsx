import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import { 
  LayoutGrid, Type, Link, GitBranch, Share2, Layers, 
  Lock, CheckCircle, Flame, Zap, ChevronRight 
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { levels } from '@/mocks/levels';

const iconMap: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  LayoutGrid,
  Type,
  Link,
  GitBranch,
  Share2,
  Layers,
};

export default function HomeScreen() {
  const router = useRouter();
  const { progress, isLevelUnlocked, getXpForNextLevel, xpGained, isProblemCompleted } = useGame();
  const xpAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const xpInfo = getXpForNextLevel();
  const xpProgress = xpInfo.needed > 0 ? Math.min(xpInfo.current / xpInfo.needed, 1) : 1;

  useEffect(() => {
    if (xpGained) {
      Animated.sequence([
        Animated.timing(xpAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(xpAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [xpGained, xpAnimation]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnimation]);

  const handleLevelPress = (levelId: string) => {
    if (isLevelUnlocked(levelId)) {
      router.push(`/lesson/${levelId}`);
    }
  };

  const getLevelProgress = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return 0;
    const completed = level.problems.filter(p => isProblemCompleted(p.id)).length;
    return completed / level.problems.length;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.title}>Devingo</Text>
        </View>
        <View style={styles.streakContainer}>
          <Flame color={progress.currentStreak > 0 ? Colors.streakOrange : Colors.textLight} size={24} />
          <Text style={[styles.streakText, progress.currentStreak > 0 && styles.streakActive]}>
            {progress.currentStreak}
          </Text>
        </View>
      </View>

      <View style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <View style={styles.xpInfo}>
            <Zap color={Colors.xpGold} size={20} />
            <Text style={styles.xpText}>{progress.totalXp} XP</Text>
          </View>
          <Text style={styles.xpNext}>Next: {xpInfo.levelName}</Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
        </View>
        <Text style={styles.xpProgress}>{xpInfo.current} / {xpInfo.needed} XP</Text>
      </View>

      {xpGained && (
        <Animated.View 
          style={[
            styles.xpGainedPopup,
            {
              opacity: xpAnimation,
              transform: [
                {
                  translateY: xpAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.xpGainedText}>+{xpGained} XP!</Text>
        </Animated.View>
      )}

      <Text style={styles.sectionTitle}>Skill Tree</Text>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pathContainer}>
          {levels.map((level, index) => {
            const unlocked = isLevelUnlocked(level.id);
            const levelProgress = getLevelProgress(level.id);
            const isCompleted = levelProgress === 1;
            const IconComponent = iconMap[level.icon] || LayoutGrid;
            const isCurrentLevel = progress.currentLevelId === level.id;

            return (
              <View key={level.id} style={styles.levelWrapper}>
                {index > 0 && (
                  <View style={[styles.connector, !unlocked && styles.connectorLocked]} />
                )}
                
                <TouchableOpacity
                  style={[
                    styles.levelNode,
                    !unlocked && styles.levelNodeLocked,
                    isCurrentLevel && styles.levelNodeCurrent,
                    isCompleted && styles.levelNodeCompleted,
                  ]}
                  onPress={() => handleLevelPress(level.id)}
                  disabled={!unlocked}
                  activeOpacity={0.8}
                >
                  <Animated.View 
                    style={[
                      styles.levelIconContainer,
                      !unlocked && styles.levelIconLocked,
                      isCompleted && styles.levelIconCompleted,
                      isCurrentLevel && { transform: [{ scale: pulseAnimation }] },
                    ]}
                  >
                    {!unlocked ? (
                      <Lock color={Colors.locked} size={28} />
                    ) : isCompleted ? (
                      <CheckCircle color={Colors.surface} size={28} />
                    ) : (
                      <IconComponent 
                        color={isCurrentLevel ? Colors.surface : Colors.primary} 
                        size={28} 
                      />
                    )}
                  </Animated.View>
                  
                  <View style={styles.levelInfo}>
                    <Text style={[styles.levelName, !unlocked && styles.levelNameLocked]}>
                      {level.name}
                    </Text>
                    <Text style={[styles.levelDifficulty, !unlocked && styles.levelDifficultyLocked]}>
                      {level.difficulty.charAt(0).toUpperCase() + level.difficulty.slice(1)}
                    </Text>
                    
                    {unlocked && !isCompleted && (
                      <View style={styles.progressBarMini}>
                        <View style={[styles.progressBarMiniFill, { width: `${levelProgress * 100}%` }]} />
                      </View>
                    )}
                  </View>
                  
                  {unlocked && (
                    <ChevronRight color={Colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
                
                {!unlocked && (
                  <Text style={styles.unlockText}>
                    {level.xpToUnlock} XP to unlock
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginLeft: 6,
    color: Colors.textLight,
  },
  streakActive: {
    color: Colors.streakOrange,
  },
  xpCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginLeft: 8,
  },
  xpNext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  xpBarContainer: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  xpProgress: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  xpGainedPopup: {
    position: 'absolute',
    top: 180,
    alignSelf: 'center',
    backgroundColor: Colors.xpGold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
  },
  xpGainedText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pathContainer: {
    alignItems: 'center',
  },
  levelWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  connector: {
    width: 4,
    height: 30,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginVertical: 4,
  },
  connectorLocked: {
    backgroundColor: Colors.locked,
  },
  levelNode: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelNodeLocked: {
    backgroundColor: Colors.surfaceElevated,
    opacity: 0.7,
  },
  levelNodeCurrent: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  levelNodeCompleted: {
    borderColor: Colors.success,
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  levelIconLocked: {
    backgroundColor: Colors.border,
  },
  levelIconCompleted: {
    backgroundColor: Colors.success,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  levelNameLocked: {
    color: Colors.textLight,
  },
  levelDifficulty: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  levelDifficultyLocked: {
    color: Colors.locked,
  },
  progressBarMini: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarMiniFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  unlockText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 6,
  },
});