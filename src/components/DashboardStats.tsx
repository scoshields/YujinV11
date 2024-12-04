import React from 'react';
import { Activity, TrendingUp, Calendar, Award } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    exerciseCompletion: {
      total: number;
      completed: number;
      rate: number;
    };
    weeklyStreak: number;
    totalWeight: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export function DashboardStats({ stats, isLoading, error }: DashboardStatsProps) {
  const dashboardStats = [
    { 
      icon: <Activity className="w-6 h-6 text-blue-500" />, 
      label: 'Weekly Progress', 
      value: stats ? `${stats.exerciseCompletion.completed}/${stats.exerciseCompletion.total} sets` : '-'
    },
    { 
      icon: <TrendingUp className="w-6 h-6 text-green-400" />, 
      label: 'Completion Rate', 
      value: stats ? `${stats.exerciseCompletion.rate}%` : '-'
    },
    {
      icon: <Award className="w-6 h-6 text-purple-400" />,
      label: 'Total Weight',
      value: stats ? `${stats.totalWeight} lbs` : '-'
    },
    {
      icon: <Calendar className="w-6 h-6 text-orange-400" />,
      label: 'Weekly Streak',
      value: stats ? `${stats.weeklyStreak} days` : '-'
    }
  ];

  if (error) {
    return <div className="text-red-400 text-center mb-6">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center text-gray-400 mb-8">Loading dashboard stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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