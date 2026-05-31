import Constants from "expo-constants";

/**
 * Backend API base URL for the mobile app.
 * Set EXPO_PUBLIC_API_URL in .env (e.g. http://192.168.1.5:8000/api).
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  return extra?.apiUrl ?? "https://api.example.com/api";
}

export const API_BASE_URL = resolveApiBaseUrl();
