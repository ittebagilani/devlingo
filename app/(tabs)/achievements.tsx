import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Sparkles, Target, Award, Flame, Zap, Crown, 
  Shield, Trophy, CheckCircle, Star, Gem, Sword, Lock 
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { achievements } from '@/mocks/achievements';
import React from "react";

const iconMap: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  Sparkles,
  Target,
  Award,
  Flame,
  Zap,
  Crown,
  Shield,
  Trophy,
  CheckCircle,
  Star,
  Gem,
  Sword,
};

export default function AchievementsScreen() {
  const { progress, newAchievement } = useGame();
  
  const unlockedCount = progress.unlockedAchievements.length;
  const totalCount = achievements.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.countBadge}>
          <Trophy color={Colors.xpGold} size={18} />
          <Text style={styles.countText}>{unlockedCount}/{totalCount}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {achievements.map((achievement) => {
          const isUnlocked = progress.unlockedAchievements.includes(achievement.id);
          const isNew = newAchievement?.id === achievement.id;
          const IconComponent = iconMap[achievement.icon] || Star;

          return (
            <View 
              key={achievement.id}
              style={[
                styles.achievementCard,
                isUnlocked && styles.achievementUnlocked,
                isNew && styles.achievementNew,
              ]}
            >
              <View 
                style={[
                  styles.iconContainer,
                  isUnlocked ? styles.iconUnlocked : styles.iconLocked,
                ]}
              >
                {isUnlocked ? (
                  <IconComponent color={Colors.surface} size={28} />
                ) : (
                  <Lock color={Colors.locked} size={24} />
                )}
              </View>

              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, !isUnlocked && styles.textLocked]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDesc, !isUnlocked && styles.textLockedLight]}>
                  {achievement.description}
                </Text>
                <View style={styles.rewardBadge}>
                  <Zap color={isUnlocked ? Colors.xpGold : Colors.locked} size={14} />
                  <Text style={[styles.rewardText, !isUnlocked && styles.textLockedLight]}>
                    +{achievement.xpReward} XP
                  </Text>
                </View>
              </View>

              {isUnlocked && (
                <View style={styles.checkmark}>
                  <CheckCircle color={Colors.success} size={24} />
                </View>
              )}
            </View>
          );
        })}
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
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  countText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  achievementUnlocked: {
    borderColor: Colors.success,
  },
  achievementNew: {
    borderColor: Colors.xpGold,
    shadowColor: Colors.xpGold,
    shadowOpacity: 0.3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconUnlocked: {
    backgroundColor: Colors.primary,
  },
  iconLocked: {
    backgroundColor: Colors.border,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.xpGold,
    marginLeft: 4,
  },
  textLocked: {
    color: Colors.textLight,
  },
  textLockedLight: {
    color: Colors.locked,
  },
  checkmark: {
    marginLeft: 8,
  },
});