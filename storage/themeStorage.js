import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

export const saveTheme = async (theme) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme); // 'light' or 'dark'
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
};

export const loadTheme = async () => {
  try {
    const theme = await AsyncStorage.getItem(THEME_KEY);
    return theme || 'dark'; // default to dark
  } catch (e) {
    console.error('Failed to load theme:', e);
    return 'dark';
  }
};
