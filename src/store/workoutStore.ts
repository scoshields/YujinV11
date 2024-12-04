import { create } from 'zustand';
import { WeeklyWorkout, DailyWorkout, WorkoutProgress } from '../types/workout';

interface WorkoutState {
  currentWeek: WeeklyWorkout | null;
  workoutHistory: WeeklyWorkout[];
  progress: WorkoutProgress | null;
  setCurrentWeek: (workout: WeeklyWorkout) => void;
  updateWorkout: (workoutId: string, workout: DailyWorkout) => void;
  completeWorkout: (workoutId: string) => void;
  generateNewWeek: (partnerId?: string) => void;
}

const SAMPLE_EXERCISES = {
  chest: ['Bench Press', 'Incline Press', 'Dumbbell Flyes'],
  back: ['Pull-ups', 'Bent Over Rows', 'Lat Pulldowns'],
  legs: ['Squats', 'Deadlifts', 'Lunges'],
  shoulders: ['Shoulder Press', 'Lateral Raises', 'Front Raises'],
  arms: ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls'],
  core: ['Planks', 'Russian Twists', 'Leg Raises']
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentWeek: null,
  workoutHistory: [],
  progress: null,

  setCurrentWeek: (workout) => set({ currentWeek: workout }),

  updateWorkout: (workoutId, updatedWorkout) => {
    const currentWeek = get().currentWeek;
    if (!currentWeek) return;

    const newWorkouts = currentWeek.workouts.map(workout =>
      workout.id === workoutId ? updatedWorkout : workout
    );

    set({
      currentWeek: {
        ...currentWeek,
        workouts: newWorkouts
      }
    });
  },

  completeWorkout: (workoutId) => {
    const currentWeek = get().currentWeek;
    if (!currentWeek) return;

    const newWorkouts = currentWeek.workouts.map(workout =>
      workout.id === workoutId ? { ...workout, completed: true } : workout
    );

    const completedCount = newWorkouts.filter(w => w.completed).length;

    set({
      currentWeek: {
        ...currentWeek,
        workouts: newWorkouts,
        status: completedCount === newWorkouts.length ? 'completed' : 'active'
      },
      progress: {
        userId: newWorkouts[0].userId,
        weeklyWorkoutId: currentWeek.id,
        completedWorkouts: completedCount,
        totalWorkouts: newWorkouts.length,
        lastUpdated: new Date().toISOString()
      }
    });
  },

  generateNewWeek: (partnerId) => {
    const startDate = getWeekStartDate();
    const endDate = getWeekEndDate(startDate);
    
    const workouts: DailyWorkout[] = Array(5).fill(null).map((_, index) => ({
      id: `workout-${Date.now()}-${index}`,
      date: addDays(startDate, index).toISOString(),
      title: `Day ${index + 1} Workout`,
      duration: 45,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
      exercises: generateDailyExercises(),
      completed: false,
      userId: 'current-user-id' // TODO: Replace with actual user ID
    }));

    const newWeek: WeeklyWorkout = {
      id: `week-${Date.now()}`,
      weekStartDate: startDate.toISOString(),
      weekEndDate: endDate.toISOString(),
      workouts,
      partnerId,
      status: 'active'
    };

    set({
      currentWeek: newWeek,
      workoutHistory: [...get().workoutHistory, newWeek]
    });
  }
}));

// Helper functions
function getWeekStartDate(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(now.setDate(diff));
}

function getWeekEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  return endDate;
}

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function generateDailyExercises() {
  const exercises = [];
  const bodyParts = Object.keys(SAMPLE_EXERCISES);
  const selectedParts = bodyParts.sort(() => 0.5 - Math.random()).slice(0, 3);

  for (const part of selectedParts) {
    const exerciseList = SAMPLE_EXERCISES[part as keyof typeof SAMPLE_EXERCISES];
    const exercise = exerciseList[Math.floor(Math.random() * exerciseList.length)];
    
    exercises.push({
      id: `exercise-${Date.now()}-${exercises.length}`,
      name: exercise,
      targetSets: Math.floor(Math.random() * 2) + 3, // 3-4 sets
      targetReps: `${Math.floor(Math.random() * 4) + 8}-${Math.floor(Math.random() * 4) + 10}`, // 8-12 reps
      bodyPart: part,
      sets: [],
      notes: ''
    });
  }

  return exercises;
}