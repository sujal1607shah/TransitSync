import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiPath";

const client = axios.create({
  baseURL: BASE_URL,
});

// Attach token (from AsyncStorage) to every request if present
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        
        try {
          const masked = token ? `${token.slice(0, 6)}...${token.slice(-4)}` : null;
          console.debug("axiosClient: attaching token", masked);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Expose 401/403 responses in console for debugging
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      console.warn("API auth error", status, err?.response?.data || err?.message);
    }
    return Promise.reject(err);
  }
);

export default client;
