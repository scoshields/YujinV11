export interface User {
  id: string;
  name: string;
  email: string;
  height: number;
  weight: number;
  username: string;
  partnerId?: string;
}

export interface Exercise {
  id: string;
  name: string;
  userId: string;
  date: string;
  targetSets: number;
  targetReps: string;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutPartner {
  userId: string;
  partnerId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface WorkoutGoal {
  id: string;
  name: string;
  description: string;
}

export interface BodyPart {
  id: string;
  name: string;
  exercises: string[];
}

export interface GeneratedWorkout {
  id: string;
  title: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    bodyPart: string;
  }[];
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  date: string;
}