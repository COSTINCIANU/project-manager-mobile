import { User } from "./user";

export type TaskPriority =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "haute"
  | "moyenne"
  | "faible";

export interface Task {
  id: number;
  name: string;
  description: string | null;
  done: boolean;
  inProgress: boolean;
  priority: string;
  projectId: number;
  assignedTo: User | null;
  dueDate: string | null;
  estimatedTime: number | null;
  elapsedTime: number | null;
  subTasks: SubTask[];
  tags: string[];
}

export interface SubTask {
  id: number;
  title: string;
  completed: boolean;
  taskId: number;
}

export interface CreateTaskPayload {
  name: string;
  description?: string;
  priority: string;
  projectId: number;
  assignedTo?: number;
  dueDate?: string;
  estimatedTime?: number;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  done?: boolean;
  inProgress?: boolean;
}

export interface KanbanColumn {
  id: string;
  label: string;
  tasks: Task[];
}

// Helper pour obtenir le statut depuis done/inProgress
export function getTaskStatus(task: Task): "todo" | "in_progress" | "done" {
  if (task.done) return "done";
  if (task.inProgress) return "in_progress";
  return "todo";
}
