function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
}

export function getUserDisplayName(user) {
  const metadata = user?.user_metadata ?? {};
  const displayName = firstNonEmptyString(
    metadata.full_name,
    metadata.name,
    metadata.user_name,
    metadata.preferred_username,
  );

  if (displayName) {
    return displayName;
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  return 'Customer';
}

export function hasCompletedSetup(user) {
  return user?.user_metadata?.setup_complete === true;
}
