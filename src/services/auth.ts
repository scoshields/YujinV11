import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthResponse {
  user: User | null;
  error?: Error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function signUp(email: string, password: string, userData: Omit<User, 'id'>): Promise<AuthResponse> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name: userData.name,
        username: userData.username,
        height: userData.height,
        weight: userData.weight
      })
      .select()
      .single();
      
    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw here, just log the error
      console.error('Profile creation error:', profileError);
    }

    // Sign in immediately after signup
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) throw signInError;
    
    return { user: signInData.user };
  } catch (err) {
    throw err;
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw authError;
  if (!user) return null;

  const { data: userData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;
  return userData;
}