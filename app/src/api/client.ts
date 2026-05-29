import axios from "axios";
import Constants from "expo-constants";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
  },
});
