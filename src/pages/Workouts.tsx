import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus } from 'lucide-react';
import { WorkoutCard } from '../components/workouts/WorkoutCard';
import { WorkoutGenerator } from '../components/workouts/WorkoutGenerator';
import { getCurrentWeekWorkouts, getFavoriteWorkouts } from '../services/workouts';
import { WorkoutList } from '../components/workouts/WorkoutList';

export function Workouts() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const favoriteWorkouts = await getFavoriteWorkouts();
      setFavorites(favoriteWorkouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWorkoutChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 select-none">Your Workouts</h1>
            <p className="text-gray-400 select-none">Track and generate your weekly workout plans</p>
          </div>
          <button 
            onClick={() => setShowGenerator(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center select-none"
          >
            <Plus className="w-5 h-5 mr-2" />
            Generate Workout
          </button>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="bg-gradient-to-r from-blue-500 to-green-400 w-1 h-6 rounded mr-3"></span>
            Current Week's Workouts
          </h2>
          <WorkoutList key={refreshTrigger} onWorkoutChange={handleWorkoutChange} />
        </div>

        {favorites.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="bg-gradient-to-r from-yellow-500 to-orange-400 w-1 h-6 rounded mr-3"></span>
              Favorite Workouts
            </h2>
            <div className="space-y-4">
              {favorites.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  id={workout.id}
                  title={workout.title}
                  duration={`${workout.duration} min`}
                  difficulty={workout.difficulty}
                  exercises={workout.exercises}
                  is_favorite={true}
                />
              ))}
            </div>
          </div>
        )}

        {showGenerator && (
          <WorkoutGenerator onClose={() => {
            setShowGenerator(false);
            handleWorkoutChange();
          }} />
        )}
      </div>
    </div>
  );
}