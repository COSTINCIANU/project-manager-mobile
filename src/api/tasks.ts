import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/constants/api";
import { Task, CreateTaskPayload, UpdateTaskPayload } from "@/types/task";

export const tasksApi = {
  async getAll(projectId?: number): Promise<Task[]> {
    const url = projectId ? `${API_ENDPOINTS.TASKS}?projectId=${projectId}` : API_ENDPOINTS.TASKS;
    const { data } = await apiClient.get(url);
    return data;
  },

  async getOne(id: number): Promise<Task> {
    const { data } = await apiClient.get(API_ENDPOINTS.TASK(id));
    return data;
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await apiClient.post(API_ENDPOINTS.TASKS, payload);
    return data;
  },

  async update(id: number, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await apiClient.put(API_ENDPOINTS.TASK(id), payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.TASK(id));
  },

  async updateStatus(id: number, status: string): Promise<Task> {
    const { data } = await apiClient.patch(API_ENDPOINTS.TASK(id), { status });
    return data;
  },
};
