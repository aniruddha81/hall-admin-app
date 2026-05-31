/** Normalize remote image URLs for React Native (HTTPS-only on Android/iOS). */
export function resolveRemoteImageUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://')) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }
  return trimmed;
}
