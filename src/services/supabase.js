import { missingSupabaseConfig, supabase } from '../lib/supabaseClient';
import { API_ROUTES } from '../routes/apiRoutes';

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('App configuration is missing. Please contact support.');
  }

  return supabase;
}

async function getErrorMessage(response, fallbackMessage) {
  try {
    const errorPayload = await response.json();
    return errorPayload?.error ?? errorPayload?.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function fetchRationItems() {
  const response = await fetch(API_ROUTES.rationItems);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to load ration items.'));
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function signUpWithEmail({ email, password, fullName }) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        setup_complete: false,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail({ email, password }) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function updateCurrentUserProfile(userMetadata) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.updateUser({
    data: userMetadata,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session ?? null;
}

export function subscribeToAuthChanges(callback) {
  const client = getSupabaseClient();
  return client.auth.onAuthStateChange(callback);
}

export { missingSupabaseConfig };


