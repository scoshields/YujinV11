import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Target, Award, Calendar, Star, Clock, Trophy } from 'lucide-react';
import { WeeklyProgress } from '../components/partners/WeeklyProgress';
import { getPartnerStats, toggleFavoritePartner } from '../services/partners';
import { getWorkoutStats } from '../services/workouts';

interface PartnerStats {
  name: string;
  username: string;
  weeklyWorkouts: number;
  totalWeight: number;
  completionRate: number;
  streak: number;
  isFavorite: boolean;
}

export function FitFamComparison() {
  const { partnerId } = useParams();
  const [partnerData, setPartnerData] = useState<PartnerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<{
    userData: number[];
    partnerData: number[];
  }>({ userData: [], partnerData: [] });
  const [userStats, setUserStats] = useState<{
    weeklyWorkouts: number;
    totalWeight: number;
    completionRate: number;
    streak: number;
  } | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (!partnerId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user's stats
        const { data: currentStats } = await getWorkoutStats();
        if (currentStats) {
          setUserStats({
            weeklyWorkouts: currentStats.exerciseCompletion.total,
            totalWeight: currentStats.totalWeight,
            completionRate: currentStats.exerciseCompletion.rate,
            streak: currentStats.weeklyStreak
          });
        }

        // Get partner's stats
        const partnerStats = await getPartnerStats(partnerId);
        
        setPartnerData(partnerStats);
        setWeeklyData({
          userData: partnerStats.userProgress,
          partnerData: partnerStats.weeklyProgress
        });
      } catch (err) {
        console.error('Partner data error:', err);
        setError('No workout data available for this week');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [partnerId]);

  const handleToggleFavorite = async () => {
    if (!partnerId || !partnerData) return;
    
    try {
      setIsTogglingFavorite(true);
      await toggleFavoritePartner(partnerId, !partnerData.isFavorite);
      setPartnerData(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite status');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading comparison data...</div>
        </div>
      </div>
    );
  }

  if (error || !partnerData) {
    return (
      <div className="min-h-screen bg-black pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-400">
            {error || 'Failed to load partner data. Please try again.'}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      icon: <Dumbbell className="w-6 h-6 text-blue-500" />,
      label: 'Weekly Workouts',
      user: userStats?.weeklyWorkouts || 0,
      partner: partnerData?.weeklyWorkouts || 0
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-400" />,
      label: 'Total Weight (lbs)',
      user: userStats?.totalWeight || 0,
      partner: partnerData?.totalWeight || 0
    },
    {
      icon: <Target className="w-6 h-6 text-orange-400" />,
      label: 'Completion Rate',
      user: userStats?.completionRate || 0,
      partner: partnerData?.completionRate || 0,
      isPercentage: true
    },
    {
      icon: <Award className="w-6 h-6 text-purple-400" />,
      label: 'Current Streak',
      user: userStats?.streak || 0,
      partner: partnerData?.streak || 0
    }
  ];

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link 
            to="/partners"
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to FitFam</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Progress with your FitFam: {partnerData.name}</h1>
            <div className="space-y-1">
              <p className="text-gray-400">Compare your workout progress and stay motivated together</p>
              <p className="text-sm text-gray-500">User ID: {partnerId}</p>
            </div>
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              partnerData.isFavorite
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
          >
            <Star className={`w-5 h-5 ${partnerData.isFavorite ? 'fill-current' : ''}`} />
            <span>{partnerData.isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Weekly Workouts</h2>
            {partnerData.workouts.length > 0 ? (
              <div className="space-y-6">
                {partnerData.workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className={`p-6 rounded-lg border ${
                      workout.completed
                        ? 'border-green-500/30 bg-green-500/5 backdrop-blur-sm'
                        : 'border-blue-500/10 bg-white/5 backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">{workout.title}</h3>
                        <p className="text-sm text-gray-400">
                          <Calendar className="w-4 h-4 inline-block mr-2" />
                          {new Date(workout.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{workout.duration} min</span>
                        <Trophy className={`w-4 h-4 ${
                          workout.difficulty === 'easy' ? 'text-green-400' :
                          workout.difficulty === 'medium' ? 'text-orange-400' :
                          'text-red-400'
                        }`} />
                        <span className={`text-sm capitalize ${
                          workout.difficulty === 'easy' ? 'text-green-400' :
                          workout.difficulty === 'medium' ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {workout.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {workout.exercises.map((exercise, index) => (
                        <div key={index} className="border-t border-blue-500/10 pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Dumbbell className="w-4 h-4 text-blue-400" />
                                <h4 className="text-white">{exercise.name}</h4>
                              </div>
                              <p className="text-sm text-gray-400">
                                Target: {exercise.targetSets} sets × {exercise.targetReps} reps
                              </p>
                            </div>
                            <div className="text-sm">
                              {exercise.sets.length > 0 ? (
                                <span className={`${
                                  exercise.sets.every(s => s.completed)
                                    ? 'text-green-400'
                                    : 'text-blue-400'
                                }`}>
                                  {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} sets completed
                                </span>
                              ) : (
                                <span className="text-gray-400">Not started</span>
                              )}
                            </div>
                          </div>
                          
                          {exercise.sets.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {exercise.sets.map((set, setIndex) => (
                                <div
                                  key={setIndex}
                                  className={`p-2 rounded ${
                                    set.completed
                                      ? 'bg-green-500/10 border border-green-500/20'
                                      : 'bg-blue-500/10 border border-blue-500/20'
                                  } border`}
                                >
                                  <div className="text-sm text-gray-400">Set {setIndex + 1}</div>
                                  <div className="text-white">
                                    {set.weight} lbs × {set.reps} reps
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400">No workouts scheduled for this week</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/5 rounded-lg">
                  {stat.icon}
                </div>
                <h3 className="text-lg font-medium text-white">{stat.label}</h3>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">You</p>
                <p className="text-2xl font-bold text-white">
                  {stat.isPercentage ? `${stat.user}%` : stat.user}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">{partnerData.name}</p>
                <p className="text-2xl font-bold text-white">
                  {stat.isPercentage ? `${stat.partner}%` : stat.partner}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
            <h2 className="text-xl font-semibold text-white mb-6">Weekly Progress</h2>
            {weeklyData.partnerData.some(v => v > 0) ? (
              <WeeklyProgress
                userData={weeklyData.userData}
                partnerData={weeklyData.partnerData}
              />
            ) : (
              <p className="text-center text-gray-400">
                No workout data available for this week yet.
              </p>
            )}
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Exercise Comparisons</h2>
            <div className="space-y-4">
              <p className="text-center text-gray-400">
                {partnerData.weeklyWorkouts === 0 && partnerData.userWorkouts === 0 
                  ? "No workouts completed yet. Start exercising together to see comparisons!"
                  : "Exercise comparison history will be available soon"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}