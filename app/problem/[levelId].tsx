import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, XCircle, Lightbulb, 
  Zap, Trophy, ChevronRight, RotateCcw, Shield,
  Star, Home, PartyPopper
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { getLevelById, getNextLevel } from '@/mocks/levels';
import { Problem } from '@/types/game';

export default function ProblemScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const router = useRouter();
  const { completeProblem, defeatBoss, isProblemCompleted, progress, recordAttempt } = useGame();
  
  const level = getLevelById(levelId || '');
  const nextLevel = getNextLevel(levelId || '');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [isBossMode, setIsBossMode] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const celebrateAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const modalScaleAnimation = useRef(new Animated.Value(0.8)).current;
  const modalOpacityAnimation = useRef(new Animated.Value(0)).current;
  const starAnimation1 = useRef(new Animated.Value(0)).current;
  const starAnimation2 = useRef(new Animated.Value(0)).current;
  const starAnimation3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (level) {
      const firstUnsolvedIndex = level.problems.findIndex(p => !isProblemCompleted(p.id));
      if (firstUnsolvedIndex !== -1) {
        setCurrentProblemIndex(firstUnsolvedIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (showCompletionModal) {
      Animated.parallel([
        Animated.spring(modalScaleAnimation, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.delay(300),
        Animated.stagger(150, [
          Animated.spring(starAnimation1, { toValue: 1, friction: 4, useNativeDriver: true }),
          Animated.spring(starAnimation2, { toValue: 1, friction: 4, useNativeDriver: true }),
          Animated.spring(starAnimation3, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompletionModal]);

  if (!level) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Level not found</Text>
      </SafeAreaView>
    );
  }

  const allProblems = level.problems;
  const currentProblem: Problem = isBossMode && level.bossLevel 
    ? level.bossLevel 
    : allProblems[currentProblemIndex];
  
  const isAlreadyCompleted = isProblemCompleted(currentProblem.id);

  const handleBack = () => {
    router.back();
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    
    Animated.sequence([
      Animated.timing(scaleAnimation, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scaleAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleCheckAnswer = async () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    setTotalAttempts(totalAttempts + 1);
    recordAttempt(currentProblem.id);
    
    const isCorrect = selectedAnswer === Number(currentProblem.correctAnswer);
    
    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectCount(correctCount + 1);
      setEarnedXP(prev => prev + currentProblem.xpReward);
      
      if (!isAlreadyCompleted) {
        if (isBossMode && level.bossLevel) {
          defeatBoss(currentProblem.id, currentProblem.xpReward);
        } else {
          completeProblem(currentProblem.id, currentProblem.xpReward);
        }
      }
      
      Animated.sequence([
        Animated.timing(celebrateAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(celebrateAnimation, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -15, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNext = async () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setHintIndex(0);
    
    if (isBossMode) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCompletionModal(true);
      return;
    }
    
    if (currentProblemIndex < allProblems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
    } else if (level.bossLevel && !progress.defeatedBosses.includes(level.bossLevel.id)) {
      setIsBossMode(true);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCompletionModal(true);
    }
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  const handleNextHint = () => {
    if (hintIndex < currentProblem.hints.length - 1) {
      setHintIndex(hintIndex + 1);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setHintIndex(0);
  };

  const handleGoHome = () => {
    setShowCompletionModal(false);
    router.replace('/');
  };

  const handleNextLevel = () => {
    setShowCompletionModal(false);
    if (nextLevel) {
      router.replace(`/lesson/${nextLevel.id}`);
    } else {
      router.replace('/');
    }
  };

  const progressValue = isBossMode ? 1 : (currentProblemIndex + 1) / allProblems.length;
  const isCorrectAnswer = selectedAnswer === Number(currentProblem.correctAnswer);
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={Colors.text} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{level.name}</Text>
            <Text style={styles.headerSubtitle}>
              {isBossMode ? 'Boss Challenge' : `Problem ${currentProblemIndex + 1}/${allProblems.length}`}
            </Text>
          </View>
          <View style={[styles.xpBadge, isBossMode && styles.xpBadgeBoss]}>
            <Zap color={isBossMode ? Colors.error : Colors.xpGold} size={16} />
            <Text style={[styles.xpText, isBossMode && styles.xpTextBoss]}>
              +{currentProblem.xpReward}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, isBossMode && styles.progressBarBoss]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressValue * 100}%` },
                isBossMode && styles.progressFillBoss
              ]} 
            />
          </View>
        </View>

        {isBossMode && (
          <View style={styles.bossHeader}>
            <Shield color={Colors.error} size={28} />
            <Text style={styles.bossTitle}>Boss Challenge</Text>
          </View>
        )}

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.problemCard,
              isBossMode && styles.problemCardBoss,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {currentProblem.difficulty.charAt(0).toUpperCase() + currentProblem.difficulty.slice(1)}
              </Text>
            </View>
            
            <Text style={styles.problemTitle}>{currentProblem.title}</Text>
            <Text style={styles.problemDescription}>{currentProblem.description}</Text>

            {isAlreadyCompleted && !showResult && (
              <View style={styles.completedBadge}>
                <CheckCircle color={Colors.success} size={16} />
                <Text style={styles.completedText}>Already Solved</Text>
              </View>
            )}

            <View style={styles.optionsContainer}>
              {currentProblem.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === Number(currentProblem.correctAnswer);
                const showCorrectStyle = showResult && isCorrect;
                const showIncorrectStyle = showResult && isSelected && !isCorrect;
                
                return (
                  <Animated.View 
                    key={`${currentProblem.id}-option-${index}`}
                    style={{ transform: [{ scale: isSelected ? scaleAnimation : 1 }] }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        isSelected && !showResult && styles.optionSelected,
                        showCorrectStyle && styles.optionCorrect,
                        showIncorrectStyle && styles.optionIncorrect,
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionContent}>
                        <View 
                          style={[
                            styles.optionIndex,
                            isSelected && !showResult && styles.optionIndexSelected,
                            (showCorrectStyle || showIncorrectStyle) && styles.optionIndexResult,
                          ]}
                        >
                          <Text 
                            style={[
                              styles.optionIndexText,
                              (isSelected || showCorrectStyle || showIncorrectStyle) && styles.optionIndexTextSelected,
                            ]}
                          >
                            {String.fromCharCode(65 + index)}
                          </Text>
                        </View>
                        <Text 
                          style={[
                            styles.optionText,
                            isSelected && !showResult && styles.optionTextSelected,
                            (showCorrectStyle || showIncorrectStyle) && styles.optionTextResult,
                          ]}
                        >
                          {option}
                        </Text>
                      </View>
                      {showCorrectStyle && <CheckCircle color={Colors.surface} size={22} />}
                      {showIncorrectStyle && <XCircle color={Colors.surface} size={22} />}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {showHint && !showResult && (
              <View style={styles.hintBox}>
                <View style={styles.hintHeader}>
                  <Lightbulb color={Colors.warning} size={18} />
                  <Text style={styles.hintTitle}>Hint {hintIndex + 1}/{currentProblem.hints.length}</Text>
                </View>
                <Text style={styles.hintText}>{currentProblem.hints[hintIndex]}</Text>
                {hintIndex < currentProblem.hints.length - 1 && (
                  <TouchableOpacity style={styles.nextHintButton} onPress={handleNextHint}>
                    <Text style={styles.nextHintText}>Show another hint</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {showResult && (
              <View style={[styles.resultBox, isCorrectAnswer ? styles.resultBoxCorrect : styles.resultBoxIncorrect]}>
                <Text style={styles.resultTitle}>
                  {isCorrectAnswer ? '🎉 Correct!' : '❌ Not quite right'}
                </Text>
                <Text style={styles.resultExplanation}>{currentProblem.explanation}</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {!showResult ? (
            <>
              {!showHint && currentProblem.hints.length > 0 && (
                <TouchableOpacity style={styles.hintButton} onPress={handleShowHint}>
                  <Lightbulb color={Colors.warning} size={20} />
                  <Text style={styles.hintButtonText}>Hint</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[
                  styles.primaryButton,
                  !showHint && styles.primaryButtonWide,
                  selectedAnswer === null && styles.primaryButtonDisabled
                ]}
                onPress={handleCheckAnswer}
                disabled={selectedAnswer === null}
              >
                <Text style={styles.primaryButtonText}>Check Answer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {!isCorrectAnswer && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <RotateCcw color={Colors.text} size={20} />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.primaryButton, isCorrectAnswer && styles.primaryButtonWide]}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>
                  {isBossMode ? 'Complete' : 
                   currentProblemIndex === allProblems.length - 1 && level.bossLevel && !progress.defeatedBosses.includes(level.bossLevel.id) 
                   ? 'Boss Level' : 
                   currentProblemIndex === allProblems.length - 1 ? 'Finish' : 'Next'}
                </Text>
                {currentProblemIndex === allProblems.length - 1 && level.bossLevel && !progress.defeatedBosses.includes(level.bossLevel.id) ? (
                  <Trophy color={Colors.surface} size={18} />
                ) : (
                  <ChevronRight color={Colors.surface} size={20} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <Animated.View 
          style={[
            styles.celebrateOverlay,
            {
              opacity: celebrateAnimation,
              transform: [{
                scale: celebrateAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.celebrateText}>🎉</Text>
        </Animated.View>

        <Modal
          visible={showCompletionModal}
          transparent
          animationType="none"
          onRequestClose={handleGoHome}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  opacity: modalOpacityAnimation,
                  transform: [{ scale: modalScaleAnimation }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <PartyPopper color={Colors.primary} size={48} />
                <Text style={styles.modalTitle}>Level Complete!</Text>
                <Text style={styles.modalSubtitle}>{level.name} Practice</Text>
              </View>

              <View style={styles.starsContainer}>
                <Animated.View style={[styles.starWrapper, { transform: [{ scale: starAnimation1 }] }]}>
                  <Star 
                    color={stars >= 1 ? Colors.xpGold : Colors.border} 
                    fill={stars >= 1 ? Colors.xpGold : 'transparent'}
                    size={40} 
                  />
                </Animated.View>
                <Animated.View style={[styles.starWrapper, styles.starCenter, { transform: [{ scale: starAnimation2 }] }]}>
                  <Star 
                    color={stars >= 2 ? Colors.xpGold : Colors.border} 
                    fill={stars >= 2 ? Colors.xpGold : 'transparent'}
                    size={52} 
                  />
                </Animated.View>
                <Animated.View style={[styles.starWrapper, { transform: [{ scale: starAnimation3 }] }]}>
                  <Star 
                    color={stars >= 3 ? Colors.xpGold : Colors.border} 
                    fill={stars >= 3 ? Colors.xpGold : 'transparent'}
                    size={40} 
                  />
                </Animated.View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{correctCount}</Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{accuracy}%</Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.xpEarned}>
                    <Zap color={Colors.xpGold} size={18} />
                    <Text style={styles.statValueXP}>{earnedXP}</Text>
                  </View>
                  <Text style={styles.statLabel}>XP Earned</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                  <Home color={Colors.text} size={20} />
                  <Text style={styles.homeButtonText}>Home</Text>
                </TouchableOpacity>
                
                {nextLevel && progress.totalXp >= nextLevel.xpToUnlock ? (
                  <TouchableOpacity style={styles.nextLevelButton} onPress={handleNextLevel}>
                    <Text style={styles.nextLevelButtonText}>Next Level</Text>
                    <ChevronRight color={Colors.surface} size={20} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.nextLevelButton} onPress={handleGoHome}>
                    <Text style={styles.nextLevelButtonText}>Continue</Text>
                    <ChevronRight color={Colors.surface} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.xpGold + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  xpBadgeBoss: {
    backgroundColor: Colors.error + '20',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.xpGold,
    marginLeft: 4,
  },
  xpTextBoss: {
    color: Colors.error,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBoss: {
    backgroundColor: Colors.error + '30',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressFillBoss: {
    backgroundColor: Colors.error,
  },
  bossHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.error + '15',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  bossTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.error,
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  problemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  problemCardBoss: {
    borderWidth: 2,
    borderColor: Colors.error,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  problemTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  problemDescription: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
    marginLeft: 6,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  optionIncorrect: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIndexSelected: {
    backgroundColor: Colors.primary,
  },
  optionIndexResult: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  optionIndexText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  optionIndexTextSelected: {
    color: Colors.surface,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  optionTextResult: {
    color: Colors.surface,
    fontWeight: '600' as const,
  },
  hintBox: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.warning,
    marginLeft: 8,
  },
  hintText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  nextHintButton: {
    marginTop: 12,
  },
  nextHintText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600' as const,
  },
  resultBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  resultBoxCorrect: {
    backgroundColor: Colors.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  resultBoxIncorrect: {
    backgroundColor: Colors.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  resultExplanation: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.warning + '15',
    gap: 8,
  },
  hintButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonWide: {
    flex: 1,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.locked,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  celebrateOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },
  celebrateText: {
    fontSize: 80,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 28,
  },
  starWrapper: {
    marginHorizontal: 4,
  },
  starCenter: {
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statValueXP: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.xpGold,
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  xpEarned: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nextLevelButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextLevelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
});
