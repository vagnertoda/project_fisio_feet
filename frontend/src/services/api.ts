import axios from 'axios';
import type { Patient, FootScan, InsoleProject } from '../types/insole';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fisiofeet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('🔒 Sessão expirada ou não autorizada. Redirecionando para login...');
      localStorage.removeItem('fisiofeet_token');
      // Forçar atualização para o estado de login se não estiver autorizado
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.token) {
      localStorage.setItem('fisiofeet_token', res.data.token);
    }
    return res.data;
  },
  register: async (username: string, password: string, email?: string) => {
    const res = await api.post('/auth/register', { username, password, email });
    if (res.data.token) {
      localStorage.setItem('fisiofeet_token', res.data.token);
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('fisiofeet_token');
  }
};

export const patientService = {
  getAll: async (): Promise<Patient[]> => {
    const res = await api.get('/patients');
    return res.data;
  },
  getById: async (id: number): Promise<Patient> => {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },
  create: async (data: Partial<Patient>): Promise<Patient> => {
    const res = await api.post('/patients', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Patient>): Promise<Patient> => {
    const res = await api.put(`/patients/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/patients/${id}`);
    return res.data;
  }
};

export const scanService = {
  upload: async (patientId: number, file: File): Promise<FootScan> => {
    const formData = new FormData();
    formData.append('patient_id', patientId.toString());
    formData.append('file', file);

    const res = await api.post('/scans/upload', formData);
    return res.data;
  },
  getByPatient: async (patientId: number): Promise<FootScan[]> => {
    const res = await api.get(`/scans/patient/${patientId}`);
    return res.data;
  }
};

export const projectService = {
  getAll: async (): Promise<InsoleProject[]> => {
    const res = await api.get('/projects');
    return res.data;
  },
  getById: async (id: number): Promise<InsoleProject> => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  save: async (project: InsoleProject): Promise<InsoleProject> => {
    const res = await api.post('/projects', project);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  }
};

export default api;
