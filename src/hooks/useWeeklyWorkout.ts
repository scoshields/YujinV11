import { useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';

export function useWeeklyWorkout() {
  const { currentWeek, generateNewWeek } = useWorkoutStore();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!currentWeek && user) {
      // Check if it's time for a new week
      const now = new Date();
      const currentWeekEnd = currentWeek?.weekEndDate ? new Date(currentWeek.weekEndDate) : null;
      
      if (!currentWeekEnd || now > currentWeekEnd) {
        generateNewWeek(user.partnerId);
      }
    }
  }, [currentWeek, user, generateNewWeek]);

  return currentWeek;
}