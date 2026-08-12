import axios from "axios";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const api = axios.create({
  baseURL: isLocal
    ? "http://127.0.0.1:8000"
    : import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "https://ai-resume-analyzer-backend-xb4l.onrender.com",
  timeout: 90000, // 90 seconds timeout for Render cold starts
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;