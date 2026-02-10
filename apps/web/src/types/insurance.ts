import { Simulation } from "./simulation";

export interface Insurance {
  id: string;
  name: string;
  premium: number;
  insuredValue: number;
  duration: number;
  startDate: Date;
  simulation: Simulation;
}
