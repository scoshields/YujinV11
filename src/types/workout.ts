import { User } from './index';

export interface WeeklyWorkout {
  id: string;
  weekStartDate: string; // ISO date string
  weekEndDate: string;   // ISO date string
  workouts: DailyWorkout[];
  partnerId?: string;    // If workout is shared with partner
  status: 'active' | 'completed';
}

export interface DailyWorkout {
  id: string;
  date: string;         // ISO date string
  title: string;
  duration: number;     // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  exercises: WorkoutExercise[];
  completed: boolean;
  userId: string;
  is_shared: boolean;    // Whether this workout is shared with partners
  shared_with: string[];  // Array of partner IDs this workout is shared with
}

export interface WorkoutExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  bodyPart: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutProgress {
  userId: string;
  weeklyWorkoutId: string;
  completedWorkouts: number;
  totalWorkouts: number;
  lastUpdated: string;  // ISO date string
}

export interface WorkoutStats {
  weeklyWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  exerciseCompletion: {
    total: number;
    completed: number;
    rate: number;
  };
  partner: {
    name: string;
    completedWorkouts: number;
    completionRate: number;
  } | null;
}