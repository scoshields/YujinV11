import { supabase } from '../lib/supabase';

export async function getDashboardStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current week's workouts and exercises
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get all workouts and their exercises
  const { data: workouts, error: workoutsError } = await supabase
    .from('daily_workouts')
    .select(`
      id,
      completed,
      workout_exercises (
        id,
        exercise_sets (
          weight,
          completed
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startOfWeek.toISOString());

  if (workoutsError) throw workoutsError;

  // Calculate exercise completion stats
  const exerciseCompletion = workouts?.reduce((acc, workout) => {
    const totalSets = workout.workout_exercises?.reduce((sets, ex) => 
      sets + (ex.exercise_sets?.length || 0), 0) || 0;
    const completedSets = workout.workout_exercises?.reduce((sets, ex) => 
      sets + (ex.exercise_sets?.filter(set => set.completed)?.length || 0), 0) || 0;
    
    return {
      total: acc.total + totalSets,
      completed: acc.completed + completedSets
    };
  }, { total: 0, completed: 0 }) || { total: 0, completed: 0 };

  // Get FitFam count - count accepted partnerships where user is either sender or receiver
const { data: partners, error: partnersError } = await supabase
  .from('workout_partners')
  .select('id', { count: 'exact' })
  .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
  .filter('status', 'eq', 'accepted');



  if (partnersError) throw partnersError;

  // Calculate total weight lifted
  const totalWeight = workouts?.reduce((sum, workout) => {
    return sum + (workout.workout_exercises?.reduce((exSum, ex) => {
      return exSum + (ex.exercise_sets?.reduce((setSum, set) => {
        return setSum + (set.completed ? (set.weight || 0) : 0);
      }, 0) || 0);
    }, 0) || 0);
  }, 0) || 0;

  // Calculate weekly streak
  const weeklyStreak = workouts?.filter(w => w.completed).length || 0;

  return {
    exerciseCompletion: {
      total: exerciseCompletion.total,
      completed: exerciseCompletion.completed,
      rate: Math.round((exerciseCompletion.completed / (exerciseCompletion.total || 1)) * 100)
    },
    fitFamCount: partners?.length || 0,
    weeklyStreak,
    totalWeight
  };
}