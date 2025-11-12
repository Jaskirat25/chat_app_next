import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // Example API
  timeout: 5000,
});

export default api;
