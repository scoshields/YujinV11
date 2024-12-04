import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WorkoutSet {
  weight: number;
  reps: number;
}

interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

interface Workout {
  date: string;
  exercises: Exercise[];
}

interface PartnerWorkoutsProps {
  partnerId: string;
}

export function PartnerWorkouts({ partnerId }: PartnerWorkoutsProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSets: 0,
    totalReps: 0,
    totalWeight: 0
  });

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current week's start date
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Get completed exercise sets for this week
        const { data: exerciseSets, error: setsError } = await supabase
          .from('exercise_sets')
          .select(`
            id,
            weight,
            reps,
            created_at,
            workout_exercises!inner (
              id,
              name
            )
          `)
          .eq('user_id', partnerId)
          .eq('completed', true)
          .gte('created_at', startOfWeek.toISOString())
          .order('created_at', { ascending: false });

        if (setsError) throw setsError;

        // Group exercise sets by date and exercise
        const workoutsByDate = new Map<string, Exercise[]>();
        let totalSets = 0;
        let totalReps = 0;
        let totalWeight = 0;

        exerciseSets?.forEach(set => {
          const date = new Date(set.created_at).toLocaleDateString();

          if (!workoutsByDate.has(date)) {
            workoutsByDate.set(date, []);
          }

          const exercises = workoutsByDate.get(date)!;
          const exerciseName = set.workout_exercises.name;

          let exercise = exercises.find(e => e.name === exerciseName);
          if (!exercise) {
            exercise = { name: exerciseName, sets: [] };
            exercises.push(exercise);
          }

          exercise.sets.push({
            weight: set.weight,
            reps: set.reps
          });

          totalSets++;
          totalReps += set.reps;
          totalWeight += set.weight;
        });

        const sortedWorkouts = Array.from(workoutsByDate.entries())
          .map(([date, exercises]) => ({
            date,
            exercises
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setWorkouts(sortedWorkouts);
        setStats({ totalSets, totalReps, totalWeight });

      } catch (err) {
        console.error('Failed to load workouts:', err);
        setError('Failed to load workout data');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkouts();
  }, [partnerId]);

  if (isLoading) {
    return <div className="text-center text-gray-400">Loading workout data...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (workouts.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Weekly Exercise Summary</h2>
        <p className="text-sm text-gray-500">FitFam ID: {partnerId}</p>
        <div className="text-center text-gray-400 mt-4">
          No completed exercises this week.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl font-semibold text-white">Weekly Exercise Summary</h2>
        <p className="text-sm text-gray-500">FitFam ID: {partnerId}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white/5 rounded-lg border border-blue-500/10">
          <div className="text-sm text-gray-400 mb-1">Total Sets</div>
          <div className="text-xl font-bold text-white">{stats.totalSets}</div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg border border-blue-500/10">
          <div className="text-sm text-gray-400 mb-1">Total Reps</div>
          <div className="text-xl font-bold text-white">{stats.totalReps}</div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg border border-blue-500/10">
          <div className="text-sm text-gray-400 mb-1">Total Weight</div>
          <div className="text-xl font-bold text-white">{stats.totalWeight.toFixed(1)} lbs</div>
        </div>
      </div>
      
      {workouts.map((workout) => (
        <div
          key={workout.date}
          className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10"
        >
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-blue-400 mr-2" />
            <h3 className="text-lg font-medium text-white">{workout.date}</h3>
          </div>

          <div className="space-y-4">
            {workout.exercises.map((exercise, index) => (
              <div key={index} className="border-t border-blue-500/10 pt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white">{exercise.name}</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="p-3 rounded-lg bg-green-500/10"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">Set {setIndex + 1}</span>
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="text-white">
                        {set.weight.toFixed(1)} lbs × {set.reps} reps
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}