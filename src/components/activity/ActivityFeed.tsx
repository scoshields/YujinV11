import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Flame, PartyPopper, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Activity {
  id: string;
  user: {
    name: string;
    username: string;
  };
  workout: {
    title: string;
    type: string;
  };
  content: string;
  created_at: string;
  reactions: {
    id: string;
    type: string;
    user_id: string;
  }[];
  comments: {
    id: string;
    content: string;
    user_name: string;
    created_at: string;
  }[];
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: activities, error: activitiesError } = await supabase
        .from('activity_feed')
        .select(`
          *,
          user:users!activity_feed_user_id_fkey (
            name,
            username
          ),
          workout:daily_workouts!activity_feed_workout_id_fkey (
            title,
            workout_type,
            difficulty
          ),
          content,
          created_at,
          reactions:activity_reactions!activity_feed_id_fkey (
            id,
            type,
            user_id
          ),
          comments:activity_comments!activity_feed_id_fkey (
            id,
            content,
            user_name,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleReaction = async (activityId: string, reactionType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user already reacted
      const { data: existingReaction } = await supabase
        .from('activity_reactions')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .single();

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('activity_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add reaction
        await supabase
          .from('activity_reactions')
          .insert({
            activity_id: activityId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }

      loadActivities();
    } catch (err) {
      console.error('Failed to update reaction:', err);
    }
  };

  const handleComment = async (activityId: string) => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('activity_comments')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          content: newComment.trim()
        });

      setNewComment('');
      setSelectedActivity(null);
      loadActivities();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-400">Loading activities...</div>;
  }

  if (error) {
    return <div className="text-center text-gray-400">No recent FitFam activity</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">FitFam Activity</h2>
      
      {activities.length === 0 ? (
        <div className="text-center text-gray-400 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
          <p>No recent activity from your FitFam.</p>
          <p className="mt-2 text-sm">Activities will appear here when your FitFam completes workouts.</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white font-medium">
                  {activity.user.name} <span className="text-gray-400">@{activity.user.username}</span>
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-sm text-gray-400">
                {activity.workout.type === 'strength' ? 'Strength' : 'Weight Loss'} Workout
              </div>
            </div>

            <p className="text-white mb-4">{activity.content}</p>

            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => handleReaction(activity.id, 'like')}
                className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{activity.reactions.filter(r => r.type === 'like').length}</span>
              </button>
              <button
                onClick={() => handleReaction(activity.id, 'fire')}
                className="flex items-center space-x-1 text-gray-400 hover:text-orange-400 transition-colors"
              >
                <Flame className="w-4 h-4" />
                <span>{activity.reactions.filter(r => r.type === 'fire').length}</span>
              </button>
              <button
                onClick={() => handleReaction(activity.id, 'celebrate')}
                className="flex items-center space-x-1 text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <PartyPopper className="w-4 h-4" />
                <span>{activity.reactions.filter(r => r.type === 'celebrate').length}</span>
              </button>
            </div>

            {activity.comments.length > 0 && (
              <div className="space-y-2 mb-4">
                {activity.comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-white/5 rounded-lg">
                    <p className="text-white">{comment.content}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {comment.user_name} • {new Date(comment.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {selectedActivity === activity.id ? (
              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
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
                    onClick={() => handleComment(activity.id)}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    Comment
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedActivity(activity.id)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Add Comment</span>
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}