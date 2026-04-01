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

function extractRationItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.records)) {
    return payload.records;
  }

  return [];
}

const REQUEST_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchRationItems() {
  const response = await fetchWithTimeout(API_ROUTES.rationItems);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to load ration items.'));
  }

  const data = await response.json();
  return extractRationItems(data);
}

export async function updateRationItems(payload) {
  const response = await fetchWithTimeout(API_ROUTES.updateRationItem, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to update ration items.'));
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
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


