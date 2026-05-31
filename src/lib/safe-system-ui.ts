import * as SystemUI from 'expo-system-ui';
import { AppState } from 'react-native';

/** Skip when the app is backgrounded or the activity was torn down (e.g. fast refresh). */
function canApplySystemUi() {
  return AppState.currentState === 'active';
}

export async function setRootBackgroundColor(color: string) {
  if (!canApplySystemUi()) return;
  try {
    await SystemUI.setBackgroundColorAsync(color);
  } catch {
    // Activity unavailable during reload or teardown
  }
}
