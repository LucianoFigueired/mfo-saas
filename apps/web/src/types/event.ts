import { Simulation } from "./simulation";

export interface FinancialEvent {
  id: string;
  name: string;
  type: EventType;
  value: number;
  frequency?: EventFrequency;
  startDate: Date;
  endDate?: Date;
  simulation: Simulation;
}

export enum EventType {
  ENTRADA = "ENTRADA",
  SAIDA = "SAIDA",
}

export enum EventFrequency {
  ONCE = "ONCE",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}
