import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/",
});

api.interceptors.request.use((config) => {
  const storageData = localStorage.getItem("@mfo:token");

  if (storageData) {
    try {
      const parsedData = JSON.parse(storageData);

      const token = parsedData.state?.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao fazer parse do token:", error);
    }
  }

  return config;
});
