import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = 'https://mfsouacioxszzlliysba.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mc291YWNpb3hzenpsbGl5c2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MTk2MTksImV4cCI6MjA0ODQ5NTYxOX0.faMorsGQz9D-vBe0xBjQ8yJRN1NcMZ50vyR-jcb6mEs';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  db: {
    schema: 'public'
  }
});