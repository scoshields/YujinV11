import React from 'react';
import { X, TrendingUp, Dumbbell, Target, Award } from 'lucide-react';
import { WeeklyProgress } from './WeeklyProgress';

interface PartnerStats {
  name: string;
  weeklyWorkouts: number;
  totalWeight: number;
  completionRate: number;
  streak: number;
}

interface PartnerComparisonModalProps {
  partner: PartnerStats;
  onClose: () => void;
}

const CURRENT_USER_STATS: PartnerStats = {
  name: 'You',
  weeklyWorkouts: 4,
  totalWeight: 2450,
  completionRate: 85,
  streak: 5
};

export function PartnerComparisonModal({ partner, onClose }: PartnerComparisonModalProps) {
  const stats = [
    { 
      icon: <Dumbbell className="w-5 h-5" />,
      label: 'Weekly Workouts',
      user: CURRENT_USER_STATS.weeklyWorkouts,
      partner: partner.weeklyWorkouts
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Total Weight (lbs)',
      user: CURRENT_USER_STATS.totalWeight,
      partner: partner.totalWeight
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Completion Rate',
      user: `${CURRENT_USER_STATS.completionRate}%`,
      partner: `${partner.completionRate}%`
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: 'Current Streak',
      user: CURRENT_USER_STATS.streak,
      partner: partner.streak
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/90 border border-blue-500/10 rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Weekly Progress Comparison</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-lg border border-blue-500/10">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  {stat.icon}
                </div>
                <h3 className="text-lg font-medium text-white">{stat.label}</h3>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-sm text-gray-400">You</p>
                  <p className="text-2xl font-bold text-white">{stat.user}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">{partner.name}</p>
                  <p className="text-2xl font-bold text-white">{stat.partner}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Weekly Progress</h3>
          <WeeklyProgress userData={[65, 72, 85, 90]} partnerData={[70, 75, 80, 85]} />
        </div>
      </div>
    </div>
  );
}