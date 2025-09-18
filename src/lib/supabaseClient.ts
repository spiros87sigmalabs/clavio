import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tdjrjgavqmsfbbodavtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanJqZ2F2cW1zZmJib2RhdnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NTkzOTAsImV4cCI6MjA3MzMzNTM5MH0.shu79zCddbzVwomkHHZNJ5XXS0JqQM0Vy_F-poGzTdQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
