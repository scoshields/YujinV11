import React, { useState, useEffect } from 'react';
import { DashboardStats } from '../components/DashboardStats';
import { ExerciseHistory } from '../components/ExerciseHistory';
import { getDashboardStats } from '../services/dashboard';
import { useAuthStore } from '../store/authStore';

export function Dashboard() {
  const user = useAuthStore(state => state.user);
  const [stats, setStats] = useState<{
    exerciseCompletion: {
      total: number;
      completed: number;
      rate: number;
    };
    fitFamCount: number;
    weeklyStreak: number;
    totalWeight: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
        
        <DashboardStats stats={stats} isLoading={isLoading} error={error} />
        
        <div className="mt-12 mb-12">
          <ExerciseHistory />
        </div>
      </div>
    </div>
  );
}