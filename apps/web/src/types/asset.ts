import { Simulation } from "./simulation";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  date: Date;

  productId?: string | null;
  returnRate?: string | null; // decimal string (ex: "0.12")

  isFinanced: boolean;
  installments?: number;
  interestRate?: number;
  downPayment?: number;

  simulation: Simulation;
}

export enum AssetType {
  FINANCEIRO = "FINANCEIRO",
  IMOBILIZADO = "IMOBILIZADO",
}
