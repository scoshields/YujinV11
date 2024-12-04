import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface NotificationState {
  pendingInvites: number;
  loadPendingInvites: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  pendingInvites: 0,
  loadPendingInvites: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the user's database ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      // Get pending invites count
      const { data: invites, error } = await supabase
        .from('workout_partners')
        .select('id', { count: 'exact' })
        .eq('partner_id', userData.id)
        .eq('status', 'pending');

      if (error) throw error;
      
      set({ pendingInvites: invites?.length || 0 });
    } catch (err) {
      console.error('Failed to load pending invites:', err);
      set({ pendingInvites: 0 });
    }
  }
}));