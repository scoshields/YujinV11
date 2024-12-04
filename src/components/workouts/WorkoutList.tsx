import React, { useState, useEffect } from 'react';
import { WorkoutCard } from './WorkoutCard';
import { getCurrentWeekWorkouts } from '../../services/workouts';

interface WorkoutListProps {
  onWorkoutChange?: () => void;
}

export function WorkoutList({ onWorkoutChange }: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCurrentWeekWorkouts();
      setWorkouts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadWorkouts();
  }, [onWorkoutChange]); // Only reload when onWorkoutChange is called

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 select-none">Loading workouts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-2">{error}</p>
        <p className="text-gray-400">Try refreshing the page</p>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10 p-6 select-none">
          <p className="text-gray-300 mb-4">No workouts found for this week</p>
          <p className="text-gray-400 select-none">Click "Generate Workout" above to create a new workout plan</p>
        </div>
      </div>
    );
  }

  // Sort workouts: incomplete first, then completed at the bottom
  const sortedWorkouts = [...workouts].sort((a, b) => {
    if (a.completed === b.completed) {
      // If completion status is the same, sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    // Put incomplete workouts first
    return a.completed ? 1 : -1;
  });

  return (
    <div className="space-y-6">
      {sortedWorkouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          id={workout.id}
          title={workout.title}
          date={workout.date}
          duration={`${workout.duration} min`}
          difficulty={workout.difficulty}
          completed={workout.completed}
          exercises={workout.exercises?.map((ex: any) => ({
            name: ex.name,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            notes: ex.notes,
            exercise_sets: ex.exercise_sets
          }))}
          onDelete={() => {
            loadWorkouts();
            onWorkoutChange?.();
          }}
          is_favorite={workout.is_favorite}
        />
      ))}
    </div>
  );
}