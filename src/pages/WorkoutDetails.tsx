import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Clock, Trophy, Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { supabase } from '../lib/supabase';
import { deleteWorkout, deleteExercise } from '../services/workouts';

interface Exercise {
  id: string;
  name: string;
  daily_workout_id: string;
  target_sets: number;
  target_reps: string;
  equipment?: string;
  sets: ExerciseSet[];
}

interface ExerciseSet {
  id?: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutData {
  id: string;
  title: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  date: string;
  exercises: Exercise[];
  completed: boolean;
}

export function WorkoutDetails() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingExercise, setIsDeletingExercise] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      setIsDeletingExercise(exerciseId);
      await deleteExercise(exerciseId);
      setExercises(exercises.filter(ex => ex.id !== exerciseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
    } finally {
      setIsDeletingExercise(null);
    }
  };

  const handleAddSet = async (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const newSetNumber = exercise.sets.length + 1;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    try {
      const { data: newSet, error: setError } = await supabase
        .from('exercise_sets')
        .insert({
          exercise_id: exercise.id,
          set_number: newSetNumber,
          weight: 0,
          reps: 0,
          completed: false
        })
        .select()
        .single();

      if (setError) throw setError;
      if (!newSet) throw new Error('Failed to create set');

      const updatedExercises = [...exercises];
      const newSetData = {
        id: newSet.id,
        setNumber: newSetNumber,
        weight: 0,
        reps: 0,
        completed: false
      };
      
      updatedExercises[exerciseIndex].sets.push(newSetData);
      setExercises(updatedExercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add set');
    }
  };

  useEffect(() => {
    const loadWorkout = async () => {
      if (!workoutId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      try {
        setIsLoading(true);
        setError(null);
        
        const { data: workoutData, error: workoutError } = await supabase
          .from('daily_workouts')
          .select(`
            id,
            title,
            duration,
            difficulty,
            date,
            completed,
            workout_exercises (
              id,
              name,
              target_sets,
              target_reps,
              notes,
              exercise_sets (
                id,
                user_id,
                set_number,
                weight,
                reps,
                completed
              )
            )
          `)
          .eq('id', workoutId)
          .single();

        if (workoutError) throw workoutError;
        if (!workoutData) throw new Error('Workout not found');

        const formattedExercises = (workoutData.workout_exercises || []).map(ex => ({
          id: ex.id,
          daily_workout_id: workoutId,
          name: ex.name,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          equipment: ex.notes?.match(/Equipment: ([^,]+)/)?.[1]?.trim() || 'None',
          sets: (ex.exercise_sets?.filter(set => set.user_id === user.id) || [])
            .sort((a, b) => a.set_number - b.set_number)
            .map(set => ({
              id: set.id,
              setNumber: set.set_number,
              weight: set.weight,
              reps: set.reps,
              completed: set.completed
            }))
        }));

        setWorkout({
          id: workoutData.id,
          title: workoutData.title,
          duration: `${workoutData.duration} min`,
          difficulty: workoutData.difficulty,
          date: new Date(workoutData.date).toLocaleDateString(),
          exercises: formattedExercises,
          completed: workoutData.completed
        });

        setExercises(formattedExercises);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workout');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkout();
  }, [workoutId]);

  const handleSetUpdate = async (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: number) => {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    const oldValue = set[field];
    set[field] = value;
    
    // Mark set as complete if both weight and reps are entered
    const shouldComplete = set.weight > 0 && set.reps > 0;
    set.completed = shouldComplete;
    
    setExercises(newExercises);
    
    // Check if workout is complete
    const allSets = newExercises.flatMap(ex => ex.sets);
    const isWorkoutComplete = allSets.length > 0 && allSets.every(s => s.weight > 0 && s.reps > 0 && s.completed);
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        if (set.id) {
          // Update exercise set
          const { error } = await supabase
            .from('exercise_sets')
            .update({
              [field]: value,
              completed: shouldComplete,
              weight: set.weight,
              reps: set.reps,
              updated_at: new Date().toISOString()
            })
            .eq('id', set.id);

          if (error) throw error;
          
          // Update workout completion status if needed
          if (workoutId && isWorkoutComplete !== workout?.completed) {
            const { error: workoutError } = await supabase
              .from('daily_workouts')
              .update({
                completed: isWorkoutComplete,
                updated_at: new Date().toISOString()
              })
              .eq('id', workoutId);

            if (workoutError) throw workoutError;
            
            if (workout) {
              setWorkout({
                ...workout,
                completed: isWorkoutComplete
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to update set:', err);
        // Revert the value if save failed
        if (set) {
          set[field] = oldValue;
          setExercises([...newExercises]);
        }
        setError(err instanceof Error ? err.message : 'Failed to update set');
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handleRemoveSet = async (exerciseIndex: number, setIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    
    if (!set.id || !window.confirm('Are you sure you want to remove this set?')) return;
    
    try {
      const { error } = await supabase
        .from('exercise_sets')
        .delete()
        .eq('id', set.id);

      if (error) throw error;

      const newExercises = [...exercises];
      newExercises[exerciseIndex].sets.splice(setIndex, 1);
      
      // Update set numbers for remaining sets
      for (let i = setIndex; i < newExercises[exerciseIndex].sets.length; i++) {
        const currentSet = newExercises[exerciseIndex].sets[i];
        currentSet.setNumber = i + 1;
        
        if (currentSet.id) {
          await supabase
            .from('exercise_sets')
            .update({ set_number: currentSet.setNumber })
            .eq('id', currentSet.id);
        }
      }
      
      setExercises(newExercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove set');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-orange-400',
    hard: 'text-red-400'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading workout details...</div>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-400">{error || 'Workout not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link 
            to="/workouts"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Workouts</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{workout.title}</h1>
            <div className="flex items-center space-x-4 text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{workout?.duration}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className={`w-4 h-4 ${difficultyColors[workout?.difficulty || 'medium']}`} />
                <span className="capitalize">{workout?.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 mb-8">
          {exercises.map((exercise, index) => (
            <div
              key={index} 
              className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Dumbbell className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{exercise.name}</h3>
                    <p className="text-gray-400">
                      Target: {exercise.target_sets} sets × {exercise.target_reps} reps
                    </p>
                    <p className="text-gray-500 text-sm">
                      Equipment: {exercise.equipment || 'None'}
                    </p>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      disabled={isDeletingExercise === exercise.id}
                      className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleAddSet(index)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Set</span>
                </button>
              </div>
              
              <div className="mt-4 space-y-3">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={`p-4 rounded-lg border transition-colors ${
                      set.completed
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-blue-500/20 bg-white/5'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 relative">
                      <button
                        onClick={() => handleRemoveSet(index, setIndex)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full"
                        title="Remove set"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-400">Set {set.setNumber}</span>
                        <div className="flex items-center space-x-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Weight (lbs)
                            </label>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => handleSetUpdate(
                                index,
                                setIndex,
                                'weight',
                                parseInt(e.target.value) || 0
                              )}
                              className="w-24 px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Reps
                            </label>
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => handleSetUpdate(
                                index,
                                setIndex,
                                'reps',
                                parseInt(e.target.value) || 0
                              )}
                              className="w-24 px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-medium ${
                        set.completed ? 'bg-green-500 text-white' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {set.completed ? 'Completed' : 'Incomplete'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}