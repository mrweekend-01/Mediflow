import axios from "axios";

// URL base del backend.
// En Docker: VITE_API_URL=/api (nginx proxy) — en desarrollo: http://127.0.0.1:8003
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8003";

// Instancia de axios con configuración base
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request — agrega el token JWT automáticamente
// a cada llamada que se haga al backend
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de response — si el token expira (401)
// limpia el localStorage y redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
