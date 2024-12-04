import React, { useState } from 'react';
import { Dumbbell, Clock, Trophy, Trash2, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteWorkout, toggleFavorite } from '../../services/workouts';

interface Exercise {
  name: string;
  target_sets: number;
  target_reps: string;
  equipment?: string;
  exercise_sets?: {
    completed: boolean;
  }[];
}

interface WorkoutCardProps {
  id: string;
  title: string;
  duration: string;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  exercises: Exercise[];
  is_favorite?: boolean;
  completed?: boolean;
  partnerName?: string;
  onDelete?: () => void;
}

export function WorkoutCard({ 
  id, 
  title, 
  duration, 
  date,
  difficulty, 
  exercises,
  completed,
  is_favorite,
  partnerName, 
  onDelete 
}: WorkoutCardProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(is_favorite);

  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-orange-400',
    hard: 'text-red-400'
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this workout?')) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkout(id);
      onDelete?.();
    } catch (err) {
      console.error('Failed to delete workout:', err);
      alert('Failed to delete workout');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id, !isFavorite);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('Failed to update favorite status');
    }
  };

  return (
    <div
      onClick={() => navigate(`/workouts/${id}`)}
      className={`${
        completed 
          ? 'border-green-500/30 bg-green-500/5' 
          : 'border-blue-500/10 bg-white/5 hover:border-blue-500/30'
      } relative p-6 backdrop-blur-sm rounded-lg transition-colors select-none cursor-pointer`}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3 min-w-0">
            <Dumbbell className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-xl font-semibold text-white select-none truncate">{title}</h3>
              {completed && (
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Completed
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm shrink-0">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 select-none">{duration}</span>
            <button
              onClick={handleToggleFavorite}
              className={`p-1 z-10 transition-colors cursor-pointer ${
                isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'
              }`}
            >
              <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 z-10 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-400 border-t border-blue-500/10 pt-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{date ? new Date(date).toLocaleDateString() : 'No date'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className={`w-4 h-4 ${difficultyColors[difficulty]}`} />
            <span className="capitalize">{difficulty}</span>
          </div>
        </div>
        
        {partnerName && (
          <div className="mt-4 pt-4 border-t border-blue-500/10 select-none">
            <p className="text-sm text-gray-400">
              Partner: <span className="text-blue-400">{partnerName}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}