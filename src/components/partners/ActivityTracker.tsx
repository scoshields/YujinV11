import React, { useState } from 'react';
import { Calendar, MessageSquare, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Activity {
  id: string;
  workout_id: string;
  workout_title: string;
  completed_at: string;
  exercises: {
    name: string;
    completed: boolean;
  }[];
  notes: {
    id: string;
    content: string;
    created_at: string;
    user_name: string;
  }[];
}

interface ActivityTrackerProps {
  partnerId: string;
  partnerName: string;
}

export function ActivityTracker({ partnerId, partnerName }: ActivityTrackerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddNote = async (activityId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('auth_id', user.id)
        .single();

      const { data: note, error: noteError } = await supabase
        .from('activity_notes')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          content: newNote,
          user_name: userData?.name || 'Anonymous'
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Update local state
      setActivities(prevActivities => 
        prevActivities.map(activity => {
          if (activity.id === activityId) {
            return {
              ...activity,
              notes: [...activity.notes, note]
            };
          }
          return activity;
        })
      );

      setNewNote('');
      setSelectedActivity(null);
    } catch (err) {
      console.error('Failed to add note:', err);
      setError('Failed to add note');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Daily Activity</h3>
      
      {activities.map((activity) => (
        <div 
          key={activity.id}
          className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-medium text-white">{activity.workout_title}</h4>
              <p className="text-sm text-gray-400">
                <Calendar className="w-4 h-4 inline-block mr-2" />
                {new Date(activity.completed_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {activity.exercises.map((exercise, index) => (
              <div key={index} className="flex items-center space-x-2">
                {exercise.completed ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
                <span className="text-gray-300">{exercise.name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {activity.notes.length > 0 && (
              <div className="space-y-2">
                {activity.notes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 bg-white/5 rounded-lg"
                  >
                    <p className="text-gray-300">{note.content}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {note.user_name} • {new Date(note.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {selectedActivity === activity.id ? (
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-4 py-2 bg-white/5 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white resize-none"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddNote(activity.id)}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedActivity(activity.id)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <p className="text-center text-gray-400">No activity recorded today</p>
      )}
    </div>
  );
}