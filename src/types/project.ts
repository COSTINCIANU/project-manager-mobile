import { User } from "./user";

export type ProjectStatus = "active" | "archived" | "completed";
export type ProjectPriority = "low" | "medium" | "high" | "critical";
export type TeamRole = "admin" | "manager" | "dev" | "client";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  members: ProjectMember[];
  tasksCount: number;
  completedTasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: number;
  user: User;
  role: TeamRole;
  joinedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  priority: ProjectPriority;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  status?: ProjectStatus;
}
