import { getSupabaseClient } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

/**
 * Get the current authenticated user
 */
export const getUser = async (): Promise<User | null> => {
  const { data } = await getSupabaseClient().auth.getUser();
  return data?.user || null;
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign up with email and password
 */
export const signUp = async (email: string, password: string) => {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
};

/**
 * Reset password for a user
 */
export const resetPassword = async (email: string) => {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
};

/**
 * Listen for authentication state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  return data.subscription.unsubscribe;
};
