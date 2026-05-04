const DEFAULT_CREDS = { username: 'admin', password: 'admin123' };

export function getCredentials(): { username: string; password: string } {
  try {
    const stored = JSON.parse(localStorage.getItem('auth_credentials') || 'null');
    if (stored && stored.username && stored.password) return stored;
  } catch { /* ignore */ }
  return DEFAULT_CREDS;
}

export function saveCredentials(creds: { username: string; password: string }) {
  localStorage.setItem('auth_credentials', JSON.stringify(creds));
}
