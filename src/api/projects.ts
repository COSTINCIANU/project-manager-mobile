import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/constants/api";
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/types/project";

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECTS);
    return data;
  },

  async getOne(id: number): Promise<Project> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT(id));
    return data;
  },

  async create(payload: CreateProjectPayload): Promise<Project> {
    const { data } = await apiClient.post(API_ENDPOINTS.PROJECTS, payload);
    return data;
  },

  async update(id: number, payload: UpdateProjectPayload): Promise<Project> {
    const { data } = await apiClient.put(API_ENDPOINTS.PROJECT(id), payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PROJECT(id));
  },
};
