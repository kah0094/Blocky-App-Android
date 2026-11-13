import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://hoftddhcsgsbtnujryfi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZnRkZGhjc2dzYnRudWpyeWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODgzMDAsImV4cCI6MjA4Mjk2NDMwMH0.tTC6Hx_rUbwYHLBUS1BpvBiXxZVlsBnoaXGim_U_TjE';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
