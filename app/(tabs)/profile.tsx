import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, Zap, Flame, Trophy, Target, Calendar, 
  RotateCcw, ChevronRight, BookOpen, Award
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { levels } from '@/mocks/levels';

export default function ProfileScreen() {
  const { progress, resetProgress, isProblemCompleted } = useGame();

  const completedLevelsCount = levels.filter(level => {
    return level.problems.every(p => isProblemCompleted(p.id));
  }).length;

  const totalProblems = levels.reduce((sum, level) => sum + level.problems.length, 0);

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => resetProgress(),
        },
      ]
    );
  };

  const stats = [
    {
      icon: Zap,
      label: 'Total XP',
      value: progress.totalXp.toLocaleString(),
      color: Colors.xpGold,
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${progress.currentStreak} days`,
      color: Colors.streakOrange,
    },
    {
      icon: Target,
      label: 'Problems Solved',
      value: `${progress.completedProblems.length}/${totalProblems}`,
      color: Colors.primary,
    },
    {
      icon: BookOpen,
      label: 'Lessons Completed',
      value: `${progress.completedLessons.length}/${levels.length}`,
      color: Colors.secondary,
    },
    {
      icon: Trophy,
      label: 'Bosses Defeated',
      value: progress.defeatedBosses.length.toString(),
      color: Colors.error,
    },
    {
      icon: Award,
      label: 'Achievements',
      value: progress.unlockedAchievements.length.toString(),
      color: Colors.success,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User color={Colors.surface} size={48} />
          </View>
          <Text style={styles.userName}>Code Learner</Text>
          <Text style={styles.userTitle}>
            {completedLevelsCount === 0 ? 'Beginner' : 
             completedLevelsCount < 3 ? 'Apprentice' :
             completedLevelsCount < 5 ? 'Developer' : 'Master'}
          </Text>
        </View>

        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Experience Points</Text>
            <View style={styles.xpBadge}>
              <Zap color={Colors.xpGold} size={18} />
              <Text style={styles.xpValue}>{progress.totalXp}</Text>
            </View>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>
              Level {completedLevelsCount + 1} • {completedLevelsCount < levels.length ? levels[completedLevelsCount].name : 'Master'}
            </Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Flame color={progress.currentStreak > 0 ? Colors.streakOrange : Colors.textLight} size={32} />
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{progress.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.longestStreak}>
            <Calendar color={Colors.textSecondary} size={18} />
            <Text style={styles.longestStreakText}>
              Longest: {progress.longestStreak} days
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Statistics</Text>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                  <IconComponent color={stat.color} size={24} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.settingItem} onPress={handleReset}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: Colors.error + '20' }]}>
              <RotateCcw color={Colors.error} size={20} />
            </View>
            <Text style={styles.settingText}>Reset Progress</Text>
          </View>
          <ChevronRight color={Colors.textSecondary} size={20} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  xpCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.xpGold + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginLeft: 6,
  },
  levelInfo: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
  },
  levelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakInfo: {
    marginLeft: 16,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  streakDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  longestStreak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  longestStreakText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});