import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useRef } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, BookOpen, Code, Play } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { getLevelById } from '@/mocks/levels';

export default function LessonScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const router = useRouter();
  const { completeLesson, isLessonCompleted } = useGame();
  
  const level = getLevelById(levelId || '');
  const [currentSection, setCurrentSection] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  if (!level) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Level not found</Text>
      </SafeAreaView>
    );
  }

  const lesson = level.lesson;
  const isInExerciseMode = currentSection >= lesson.sections.length;
  const currentExercise = lesson.miniExercises[exerciseIndex];
  const lessonCompleted = isLessonCompleted(level.id);

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (currentSection < lesson.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else if (currentSection === lesson.sections.length - 1) {
      setCurrentSection(lesson.sections.length);
    }
  };

  const handlePrevious = () => {
    if (isInExerciseMode) {
      setCurrentSection(lesson.sections.length - 1);
      setExerciseIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    
    if (selectedAnswer !== Number(currentExercise.correctAnswer)) {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleNextExercise = () => {
    if (selectedAnswer === Number(currentExercise.correctAnswer)) {
      setExercisesCompleted(exercisesCompleted + 1);
    }
    
    if (exerciseIndex < lesson.miniExercises.length - 1) {
      setExerciseIndex(exerciseIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      if (!lessonCompleted) {
        completeLesson(level.id, 15);
      }
      router.push(`/problem/${levelId}`);
    }
  };

  const handleStartPractice = () => {
    router.push(`/problem/${levelId}`);
  };

  const progress = isInExerciseMode 
    ? (exerciseIndex + 1) / lesson.miniExercises.length
    : (currentSection + 1) / (lesson.sections.length + 1);

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
              {isInExerciseMode ? 'Mini Exercise' : 'Lesson'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <BookOpen color={Colors.primary} size={24} />
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {isInExerciseMode 
              ? `Exercise ${exerciseIndex + 1}/${lesson.miniExercises.length}`
              : `Section ${currentSection + 1}/${lesson.sections.length}`
            }
          </Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {!isInExerciseMode ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>
                {lesson.sections[currentSection].heading}
              </Text>
              <Text style={styles.sectionContent}>
                {lesson.sections[currentSection].content}
              </Text>
              
              {lesson.sections[currentSection].codeExample && (
                <View style={styles.codeBlock}>
                  <View style={styles.codeHeader}>
                    <Code color={Colors.textSecondary} size={16} />
                    <Text style={styles.codeLabel}>Example</Text>
                  </View>
                  <Text style={styles.codeText}>
                    {lesson.sections[currentSection].codeExample}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Animated.View 
              style={[
                styles.exerciseCard,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              <Text style={styles.exerciseQuestion}>
                {currentExercise.question}
              </Text>
              
              <View style={styles.optionsContainer}>
                {currentExercise.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === Number(currentExercise.correctAnswer);
                  const showCorrect = showResult && isCorrect;
                  const showIncorrect = showResult && isSelected && !isCorrect;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        isSelected && !showResult && styles.optionSelected,
                        showCorrect && styles.optionCorrect,
                        showIncorrect && styles.optionIncorrect,
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      activeOpacity={0.7}
                    >
                      <Text 
                        style={[
                          styles.optionText,
                          isSelected && !showResult && styles.optionTextSelected,
                          (showCorrect || showIncorrect) && styles.optionTextResult,
                        ]}
                      >
                        {option}
                      </Text>
                      {showCorrect && <CheckCircle color={Colors.surface} size={20} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showResult && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationTitle}>
                    {selectedAnswer === Number(currentExercise.correctAnswer) ? 'Correct!' : 'Not quite!'}
                  </Text>
                  <Text style={styles.explanationText}>
                    {currentExercise.explanation}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {!isInExerciseMode ? (
            <>
              <TouchableOpacity 
                style={[styles.navButton, currentSection === 0 && styles.navButtonDisabled]}
                onPress={handlePrevious}
                disabled={currentSection === 0}
              >
                <Text style={[styles.navButtonText, currentSection === 0 && styles.navButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>
                  {currentSection === lesson.sections.length - 1 ? 'Start Exercises' : 'Next'}
                </Text>
                <ChevronRight color={Colors.surface} size={20} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {!showResult ? (
                <TouchableOpacity 
                  style={[
                    styles.primaryButton, 
                    styles.fullWidthButton,
                    selectedAnswer === null && styles.primaryButtonDisabled
                  ]}
                  onPress={handleCheckAnswer}
                  disabled={selectedAnswer === null}
                >
                  <Text style={styles.primaryButtonText}>Check Answer</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.primaryButton, styles.fullWidthButton]}
                  onPress={handleNextExercise}
                >
                  <Text style={styles.primaryButtonText}>
                    {exerciseIndex === lesson.miniExercises.length - 1 ? 'Start Practice' : 'Continue'}
                  </Text>
                  <Play color={Colors.surface} size={18} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {lessonCompleted && !isInExerciseMode && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleStartPractice}
          >
            <Text style={styles.skipButtonText}>Skip to Practice →</Text>
          </TouchableOpacity>
        )}
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
  headerRight: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 26,
    color: Colors.textSecondary,
  },
  codeBlock: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 12,
    color: '#888',
    marginLeft: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#A6E3A1',
    lineHeight: 22,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  exerciseQuestion: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
    lineHeight: 28,
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
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  optionIncorrect: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  optionTextResult: {
    color: Colors.surface,
    fontWeight: '600' as const,
  },
  explanationBox: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 6,
  },
  explanationText: {
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
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  navButtonTextDisabled: {
    color: Colors.textLight,
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
  primaryButtonDisabled: {
    backgroundColor: Colors.locked,
    shadowOpacity: 0,
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  skipButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
});