import React from 'react';

interface WeeklyProgressProps {
  userData: number[];
  partnerData: number[];
}

export function WeeklyProgress({ userData, partnerData }: WeeklyProgressProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxDays = Math.max(userData.length, partnerData.length);
  const displayDays = days.slice(0, maxDays);

  return (
    <div className="relative h-64">
      <div className="absolute inset-0 flex items-end justify-between">
        {displayDays.map((day, index) => (
          <div key={day} className="flex flex-col items-center space-y-2 w-16">
            <div className="relative w-full h-48 flex items-end justify-center space-x-2">
              <div
                className="w-4 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                style={{ height: `${userData[index] || 0}%` }}
              />
              <div
                className="w-4 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                style={{ height: `${partnerData[index] || 0}%` }}
              />
            </div>
            <span className="text-gray-400 text-sm">{day}</span>
          </div>
        ))}
      </div>
      
      <div className="absolute top-0 right-0 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-sm text-gray-400">You</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-sm text-gray-400">Partner</span>
        </div>
      </div>
    </div>
  );
}