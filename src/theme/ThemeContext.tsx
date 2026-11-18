import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeModePreference } from '../types';

export interface ThemeColors {
  isNight: boolean;
  modeName: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  priorityHigh: string;
  priorityHighBg: string;
  priorityMedium: string;
  priorityMediumBg: string;
  priorityLow: string;
  priorityLowBg: string;
  statusCompleted: string;
  statusCompletedBg: string;
  statusOverdue: string;
  statusOverdueBg: string;
  statusInProgress: string;
  statusInProgressBg: string;
  statusCancelled: string;
  statusCancelledBg: string;
  tabBarBg: string;
  overlay: string;
}

export const MORNING_THEME: ThemeColors = {
  isNight: false,
  modeName: 'Pagi (Sunlit Catnap)',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F2ECE1',
  border: '#E6DEC8',
  textPrimary: '#231F20',
  textSecondary: '#5C544E',
  textMuted: '#7A716A',
  accent: '#D96B43',
  accentSoft: '#FCEEE8',
  onAccent: '#FFFFFF',
  priorityHigh: '#C93B3B',
  priorityHighBg: '#FDECEC',
  priorityMedium: '#B86E14',
  priorityMediumBg: '#FEF5E7',
  priorityLow: '#2E6A8E',
  priorityLowBg: '#EBF4FA',
  statusCompleted: '#247A54',
  statusCompletedBg: '#E8F6EF',
  statusOverdue: '#C93B3B',
  statusOverdueBg: '#FDECEC',
  statusInProgress: '#B86E14',
  statusInProgressBg: '#FEF5E7',
  statusCancelled: '#655D57',
  statusCancelledBg: '#EFECE6',
  tabBarBg: '#FFFFFF',
  overlay: 'rgba(35, 31, 32, 0.45)',
};

export const NIGHT_THEME: ThemeColors = {
  isNight: true,
  modeName: 'Malam (Midnight Purr)',
  background: '#12151E',
  surface: '#1B202E',
  surfaceElevated: '#23293B',
  surfaceMuted: '#252B3D',
  border: '#2E364D',
  textPrimary: '#F4F1EA',
  textSecondary: '#B2B8C9',
  textMuted: '#8B92A6',
  accent: '#F09A4B',
  accentSoft: '#2E241E',
  onAccent: '#12151E',
  priorityHigh: '#FF7A7A',
  priorityHighBg: '#3A1D22',
  priorityMedium: '#F5B056',
  priorityMediumBg: '#362919',
  priorityLow: '#6EB5DF',
  priorityLowBg: '#1A2B38',
  statusCompleted: '#5CD69E',
  statusCompletedBg: '#183328',
  statusOverdue: '#FF7A7A',
  statusOverdueBg: '#3A1D22',
  statusInProgress: '#F5B056',
  statusInProgressBg: '#362919',
  statusCancelled: '#9CA3B5',
  statusCancelledBg: '#252B3D',
  tabBarBg: '#171B26',
  overlay: 'rgba(9, 11, 16, 0.72)',
};

interface ThemeContextValue {
  theme: ThemeColors;
  themePreference: ThemeModePreference;
  setThemePreference: (pref: ThemeModePreference) => void;
  toggleMorningNight: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: MORNING_THEME,
  themePreference: 'auto_time',
  setThemePreference: () => {},
  toggleMorningNight: () => {},
});

export function isNightHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 18 || hour < 6;
}

export const ThemeProvider: React.FC<{
  initialPreference?: ThemeModePreference;
  onPreferenceChange?: (pref: ThemeModePreference) => void;
  children: React.ReactNode;
}> = ({ initialPreference = 'auto_time', onPreferenceChange, children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemeModePreference>(initialPreference);
  const [currentHourNight, setCurrentHourNight] = useState<boolean>(() => isNightHour());

  useEffect(() => {
    setThemePreferenceState(initialPreference);
  }, [initialPreference]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHourNight(isNightHour());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const setThemePreference = (pref: ThemeModePreference) => {
    setThemePreferenceState(pref);
    onPreferenceChange?.(pref);
  };

  const activeIsNight = useMemo(() => {
    if (themePreference === 'morning') return false;
    if (themePreference === 'night') return true;
    return currentHourNight;
  }, [themePreference, currentHourNight]);

  const toggleMorningNight = () => {
    const next: ThemeModePreference = activeIsNight ? 'morning' : 'night';
    setThemePreference(next);
  };

  const value = useMemo(
    () => ({
      theme: activeIsNight ? NIGHT_THEME : MORNING_THEME,
      themePreference,
      setThemePreference,
      toggleMorningNight,
    }),
    [activeIsNight, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
