export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          name: string
          height: number
          weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          name: string
          height: number
          weight: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          name?: string
          height?: number
          weight?: number
          created_at?: string
          updated_at?: string
        }
      }
      workout_partners: {
        Row: {
          id: string
          user_id: string
          partner_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          partner_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          partner_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      weekly_workouts: {
        Row: {
          id: string
          week_start_date: string
          week_end_date: string
          user_id: string
          partner_id: string | null
          status: 'active' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          week_start_date: string
          week_end_date: string
          user_id: string
          partner_id?: string | null
          status?: 'active' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          week_start_date?: string
          week_end_date?: string
          user_id?: string
          partner_id?: string | null
          status?: 'active' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      daily_workouts: {
        Row: {
          id: string
          weekly_workout_id: string
          date: string
          title: string
          duration: number
          difficulty: 'easy' | 'medium' | 'hard'
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          weekly_workout_id: string
          date: string
          title: string
          duration: number
          difficulty: 'easy' | 'medium' | 'hard'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          weekly_workout_id?: string
          date?: string
          title?: string
          duration?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          daily_workout_id: string
          name: string
          target_sets: number
          target_reps: string
          body_part: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          daily_workout_id: string
          name: string
          target_sets: number
          target_reps: string
          body_part: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          daily_workout_id?: string
          name?: string
          target_sets?: number
          target_reps?: string
          body_part?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercise_sets: {
        Row: {
          id: string
          exercise_id: string
          set_number: number
          weight: number
          reps: number
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exercise_id: string
          set_number: number
          weight?: number
          reps?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exercise_id?: string
          set_number?: number
          weight?: number
          reps?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_progress: {
        Row: {
          id: string
          user_id: string
          weekly_workout_id: string
          completed_workouts: number
          total_workouts: number
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          weekly_workout_id: string
          completed_workouts?: number
          total_workouts: number
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          weekly_workout_id?: string
          completed_workouts?: number
          total_workouts?: number
          last_updated?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      workout_difficulty: 'easy' | 'medium' | 'hard'
      partner_status: 'pending' | 'accepted' | 'rejected'
      workout_status: 'active' | 'completed'
    }
  }
}