import { supabase } from '../lib/supabase';
import type { WorkoutExercise } from '../types/workout';

export async function getWorkoutStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current week's workouts and exercises
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data: workouts, error: workoutsError } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      completed,
      date,
      workout_exercises (
        id,
        exercise_sets (
          weight,
          completed
        )
      )
    `)
    .eq('user_id', user.id) // Using auth.users id directly
    .gte('date', startOfWeek.toISOString());

  if (workoutsError) throw workoutsError;
  return workouts || [];
}

export async function getCurrentWeekWorkouts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      title,
      date,
      duration,
      difficulty,
      completed,
      is_favorite,
      workout_exercises!inner (
        id,
        name,
        target_sets,
        target_reps,
        notes,
        exercise_sets!inner (
          id,
          completed
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startOfWeek.toISOString())
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function generateWorkout(
  workoutType: 'strength' | 'weight_loss',
  difficulty: 'easy' | 'medium' | 'hard',
  exercises: WorkoutExercise[],
  sharing?: {
    isShared: boolean;
    sharedWith: string[];
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Calculate workout difficulty based on:
  // 1. Number of exercises
  // 2. Total sets
  // 3. Number of muscle groups
  const totalSets = exercises.reduce((sum, ex) => sum + ex.targetSets, 0);
  const muscleGroups = new Set(exercises.map(ex => ex.bodyPart)).size;
  
  // Calculate difficulty score based on:
  // 1. Number of exercises
  // 2. Total sets
  // 3. Number of muscle groups
  // 4. Workout type
  let score = 0;
  
  if (workoutType === 'strength') {
    // For strength workouts:
    // Exercise count: 2-3 (0), 4-5 (1), 6+ (2)
    score += exercises.length <= 3 ? 0 : exercises.length >= 6 ? 2 : 1;
    
    // Total sets: ≤15 (0), 16-24 (1), ≥25 (2)
    score += totalSets <= 15 ? 0 : totalSets >= 25 ? 2 : 1;
    
    // Muscle groups: 1-2 (0), 3 (1), 4+ (2)
    score += muscleGroups <= 2 ? 0 : muscleGroups >= 4 ? 2 : 1;
  } else {
    // For weight loss workouts:
    // Exercise count: 2-4 (0), 5-6 (1), 7+ (2)
    score += exercises.length <= 4 ? 0 : exercises.length >= 7 ? 2 : 1;
    
    // Total sets: ≤12 (0), 13-18 (1), ≥19 (2)
    score += totalSets <= 12 ? 0 : totalSets >= 19 ? 2 : 1;
    
    // Muscle groups: 1-2 (0), 3 (1), 4+ (2)
    score += muscleGroups <= 2 ? 0 : muscleGroups >= 4 ? 2 : 1;
  }
  
  // Convert score to difficulty level
  // Score range: 0-6
  // Easy: 0-1
  // Medium: 2-4
  // Hard: 5-6
  const workoutDifficulty = score <= 1 ? 'easy' : score >= 5 ? 'hard' : 'medium';

  // Create workout title from selected body parts
  const bodyPartsTitle = exercises
    .map(ex => ex.bodyPart)
    .filter((value, index, self) => self.indexOf(value) === index)
    .join('/');
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  });

  // Create daily workout
  const { data: dailyWorkout, error: dayError } = await supabase
    .from('daily_workouts')
    .insert({
      user_id: user.id,
      date: new Date().toISOString(),
      title: `${bodyPartsTitle} (${formattedDate})`,
      workout_type: workoutType,
      difficulty: workoutDifficulty,
      duration: 1, // Will be updated by trigger
      is_shared: sharing?.isShared ?? false,
      shared_with: sharing?.sharedWith || [],
      completed: false,
      is_favorite: false
    })
    .select()
    .single();

  if (dayError) throw dayError;
  if (!dailyWorkout) throw new Error('Failed to create workout');

  // Insert exercises
  for (const exercise of exercises) {
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert({
        daily_workout_id: dailyWorkout.id,
        name: exercise.name,
        target_sets: exercise.targetSets,
        target_reps: exercise.targetReps,
        notes: exercise.notes || ''
      })
      .select()
      .single();

    if (exerciseError) throw exerciseError;
    if (!exerciseData) throw new Error('Failed to create exercise');

    // Check if this is a bodyweight exercise
    let defaultWeight = 0;
    const isBodyweight = exercise.notes?.toLowerCase().includes('equipment: bodyweight') ||
                        exercise.notes?.toLowerCase().includes('bodyweight');
    
    if (isBodyweight) {
      const { data: userData } = await supabase
        .from('users')
        .select('weight')
        .eq('id', user.id)
        .single();
      
      if (userData?.weight) {
        defaultWeight = userData.weight;
        
        // Update exercise notes to indicate bodyweight
        await supabase
          .from('workout_exercises')
          .update({
            notes: `${exercise.notes || ''} (Using bodyweight: ${defaultWeight} lbs)`
          })
          .eq('id', exerciseData.id);
      }
    }

    // Create exercise sets
    const exerciseSets = Array.from(
      { length: exercise.targetSets },
      (_, i) => ({
        exercise_id: exerciseData.id,
        user_id: user.id,
        set_number: i + 1,
        weight: defaultWeight,
        reps: 0,
        completed: false
      })
    );

    const { error: setsError } = await supabase
      .from('exercise_sets')
      .insert(exerciseSets);

    if (setsError) throw setsError;
  }

  return dailyWorkout;
}

export async function deleteWorkout(workoutId: string) {
  const { error } = await supabase
    .from('daily_workouts')
    .delete()
    .eq('id', workoutId);

  if (error) throw error;
}

export async function deleteExercise(exerciseId: string) {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) throw error;
}

export async function getFavoriteWorkouts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      title,
      date,
      duration,
      difficulty,
      completed,
      is_favorite,
      workout_exercises!inner (
        id,
        name,
        target_sets,
        target_reps,
        notes,
        exercise_sets!inner (
          id,
          completed
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function toggleFavorite(workoutId: string, isFavorite: boolean) {
  const { error } = await supabase
    .from('daily_workouts')
    .update({ is_favorite: isFavorite })
    .eq('id', workoutId);

  if (error) throw error;
}

export async function updateExerciseSet(
  setId: string,
  data: { weight?: number; reps?: number; completed?: boolean }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Update the exercise set
  const { error: updateError } = await supabase
    .from('exercise_sets')
    .update({
      weight: data.weight !== undefined ? Number(data.weight) : undefined,
      reps: data.reps !== undefined ? Number(data.reps) : undefined,
      completed: data.completed !== undefined ? data.completed : undefined
    })
    .eq('id', setId)
    .eq('user_id', user.id);

  if (updateError) throw updateError;
}