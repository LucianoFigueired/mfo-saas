import { Client } from "./client";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskSource = "MANUAL" | "AUTO";
export type TaskKind = "GENERAL" | "INSURANCE_EXPIRY" | "BIRTHDAY" | "AI_RISK" | "SIMULATION_FOLLOWUP";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  kind: TaskKind;
  uniqueKey?: string | null;
  metadata?: unknown;
  clientId?: string | null;
  client?: Client | null;
  createdAt: string;
  updatedAt: string;
}

