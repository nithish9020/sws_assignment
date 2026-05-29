import { MD3LightTheme } from "react-native-paper";

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#1E6FD9",
    primaryContainer: "#E6F1FF",
    secondary: "#3A8EF6",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceVariant: "#F0F6FF",
    onPrimary: "#FFFFFF",
    onBackground: "#1A1A1A",
    onSurface: "#1A1A1A",
    outline: "#D0E3FF",
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level2: "#F5F9FF",
    },
  },
  fonts: {
    ...MD3LightTheme.fonts,
  },
};

export type AppTheme = typeof theme;
