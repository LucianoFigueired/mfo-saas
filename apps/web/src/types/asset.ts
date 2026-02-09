import { Simulation } from "./simulation";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  date: Date;

  isFinanced: boolean;
  installments?: number;
  interestRate?: Number;
  downPayment?: Number;

  simulation: Simulation;
}

export enum AssetType {
  FINANCEIRO = "FINANCEIRO",
  IMOBILIZADO = "IMOBILIZADO",
}
