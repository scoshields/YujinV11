import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import type { WorkoutStats } from '../../types/workout';

interface WorkoutStatsProps {
  stats: WorkoutStats | null;
  isLoading: boolean;
  error: string | null;
}

export function WorkoutStats({ stats, isLoading, error }: WorkoutStatsProps) {
  const dashboardStats = [
    { 
      icon: <Activity className="w-6 h-6 text-blue-500" />, 
      label: 'Progress', 
      value: stats ? `${stats.exerciseCompletion.completed}/${stats.exerciseCompletion.total} sets` : '-'
    },
    { 
      icon: <TrendingUp className="w-6 h-6 text-green-400" />, 
      label: 'Completion Rate', 
      value: stats ? `${stats.exerciseCompletion.rate}%` : '-'
    }
  ];

  if (error) {
    return <div className="text-red-400 text-center mb-6">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center text-gray-400 mb-8">Loading workout stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {dashboardStats.map((stat, index) => (
        <div key={index} className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
}