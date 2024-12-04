import React from 'react';
import { Users, Medal, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PartnerCardProps {
  id: string;
  name: string;
  username: string;
  workoutCount: number;
  joinedDate: string;
  status: 'pending' | 'accepted' | 'rejected'; 
  direction: 'sent' | 'received' | 'accepted';
  onCancel?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function PartnerCard({
  id,
  name,
  username,
  workoutCount,
  joinedDate,
  status,
  direction,
  onCancel,
  onAccept,
  onDecline
}: PartnerCardProps) {
  const navigate = useNavigate();

  const statusColors = {
    pending: 'text-orange-400',
    accepted: 'text-green-400',
    rejected: 'text-red-400'
  };

  return (
    <div 
      className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10 cursor-pointer hover:border-blue-500/30 transition-colors"
      onClick={() => {
        if (status === 'accepted') {
          console.log('Partner ID:', id); // Debug log
          navigate(`/partners/${id}`);
        }
      }}
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            {name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">@{username}</span>
            <span className={`text-sm ${statusColors[status]}`}>
              {direction === 'accepted' ? '' : 
               direction === 'sent' ? `Invite ${status}` : 
               status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Medal className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">{workoutCount} workouts completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">Joined {new Date(joinedDate.replace(/-/g, '/')).toLocaleDateString()}</span>
        </div>
      </div>

      {status === 'pending' && direction === 'received' && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.();
            }}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecline?.();
            }}
            className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Decline
          </button>
        </div>
      )}
      
      {status === 'pending' && direction === 'sent' && (
        <div className="mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.();
            }}
            className="w-full py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Cancel Invite
          </button>
        </div>
      )}
    </div>
  );
}