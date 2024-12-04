import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ExerciseRecord {
  name: string;
  maxWeight: number;
  date: string;
}

export function ExerciseHistory() {
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExerciseHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get all completed exercise sets with weights
        const { data, error } = await supabase
          .from('exercise_sets')
          .select(`
            weight,
            completed,
            exercise:workout_exercises!inner(
              name,
              daily_workout:daily_workouts!inner(
                date
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('completed', true)
          .gt('weight', 0)
          .order('weight', { ascending: false });

        if (error) throw error;

        // Process the data to get max weight per exercise
        const exerciseMap = new Map<string, ExerciseRecord>();
        
        data?.forEach(set => {
          const exerciseName = set.exercise.name;
          const currentRecord = exerciseMap.get(exerciseName);
          
          if (!currentRecord || set.weight > currentRecord.maxWeight) {
            exerciseMap.set(exerciseName, {
              name: exerciseName,
              maxWeight: set.weight,
              date: set.exercise.daily_workout.date
            });
          }
        });

        setRecords(Array.from(exerciseMap.values())
          .sort((a, b) => b.maxWeight - a.maxWeight));

      } catch (err) {
        console.error('Failed to load exercise history:', err);
        setError('Failed to load exercise history');
      } finally {
        setIsLoading(false);
      }
    };

    loadExerciseHistory();
  }, []);

  if (isLoading) {
    return <div className="text-center text-gray-400">Loading exercise history...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-gray-400">
        No completed exercises found. Start working out to track your progress!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
        Personal Records
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => (
          <div 
            key={record.name}
            className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10"
          >
            <h3 className="text-lg font-medium text-white mb-2">{record.name}</h3>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold text-blue-400">
                {record.maxWeight} <span className="text-sm text-gray-400">lbs</span>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(record.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}