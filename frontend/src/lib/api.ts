import axios, { AxiosInstance } from "axios";

const BASE_URL = "http://localhost:8000/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh_token = localStorage.getItem("refresh_token");
      if (refresh_token) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token });
          localStorage.setItem("access_token", res.data.access_token);
          error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/";
        }
      } else {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (email: string, password: string) => {
    const data = await api.post("/auth/login", { email, password }).then((r) => r.data);
    if (data.access_token) localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    return data;
  },
  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }).then((r) => r.data),
  register: (data: { email: string; password: string; role: string; full_name?: string }) =>
    api.post("/auth/register", data).then((r) => r.data),
  getMe: () => api.get("/auth/me").then((r) => r.data),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
  isAuthenticated: () => !!localStorage.getItem("access_token"),
};

export const dashboard = {
  kpis: () => api.get("/dashboard/kpis").then((r) => r.data),
  charts: (period?: string) =>
    api.get("/dashboard/charts", { params: period ? { period } : {} }).then((r) => r.data),
};

export const students = {
  list: (params?: { page?: number; page_size?: number; search?: string; status?: string; class_id?: string }) =>
    api.get("/students", { params }).then((r) => r.data),
  get: (student_id: string) => api.get(`/students/${student_id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/students", data).then((r) => r.data),
  update: (student_id: string, data: Record<string, unknown>) =>
    api.put(`/students/${student_id}`, data).then((r) => r.data),
  delete: (student_id: string) => api.delete(`/students/${student_id}`).then((r) => r.data),
};

export const teachers = {
  list: (params?: { page?: number; page_size?: number; search?: string; status?: string }) =>
    api.get("/teachers", { params }).then((r) => r.data),
  get: (teacher_id: string) => api.get(`/teachers/${teacher_id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/teachers", data).then((r) => r.data),
  update: (teacher_id: string, data: Record<string, unknown>) =>
    api.put(`/teachers/${teacher_id}`, data).then((r) => r.data),
  delete: (teacher_id: string) => api.delete(`/teachers/${teacher_id}`).then((r) => r.data),
};

export const classes = {
  list: (params?: { page?: number; page_size?: number; search?: string; level?: string }) =>
    api.get("/classes", { params }).then((r) => r.data),
  get: (class_id: string) => api.get(`/classes/${class_id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/classes", data).then((r) => r.data),
  update: (class_id: string, data: Record<string, unknown>) =>
    api.put(`/classes/${class_id}`, data).then((r) => r.data),
  delete: (class_id: string) => api.delete(`/classes/${class_id}`).then((r) => r.data),
  teachers: {
    list: (class_id: string) => api.get(`/classes/${class_id}/teachers`).then((r) => r.data),
  },
};

export const subjects = {
  list: (params?: { page?: number; page_size?: number; search?: string }) =>
    api.get("/subjects", { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/subjects", data).then((r) => r.data),
  update: (subject_id: string, data: Record<string, unknown>) =>
    api.put(`/subjects/${subject_id}`, data).then((r) => r.data),
  delete: (subject_id: string) => api.delete(`/subjects/${subject_id}`).then((r) => r.data),
};

export const registrations = {
  list: (params?: { page?: number; page_size?: number; status?: string; payment_status?: string }) =>
    api.get("/registrations", { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/registrations", data).then((r) => r.data),
  approve: (registration_id: string) =>
    api.post(`/registrations/${registration_id}/approve`).then((r) => r.data),
  reject: (registration_id: string) =>
    api.post(`/registrations/${registration_id}/reject`).then((r) => r.data),
  update: (registration_id: string, data: Record<string, unknown>) =>
    api.put(`/registrations/${registration_id}`, data).then((r) => r.data),
};

export const absences = {
  list: (params?: { page?: number; page_size?: number; justified?: boolean; status?: string; student_id?: string; class_id?: string }) =>
    api.get("/absences", { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/absences", data).then((r) => r.data),
  update: (absence_id: string, data: Record<string, unknown>) =>
    api.put(`/absences/${absence_id}`, data).then((r) => r.data),
  stats: (class_id?: string) =>
    api.get("/absences/stats", { params: class_id ? { class_id } : {} }).then((r) => r.data),
};

export const grades = {
  list: (params?: { page?: number; page_size?: number; student_id?: string; class_id?: string; subject_id?: string; period?: string }) =>
    api.get("/grades", { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/grades", data).then((r) => r.data),
  update: (grade_id: string, data: Record<string, unknown>) =>
    api.put(`/grades/${grade_id}`, data).then((r) => r.data),
  bulletin: (student_id: string, period: string) =>
    api.get(`/bulletin/${student_id}`, { params: { period } }).then((r) => r.data),
  stats: (params?: { period?: string; class_id?: string; subject_id?: string }) =>
    api.get("/grades/stats", { params }).then((r) => r.data),
};
