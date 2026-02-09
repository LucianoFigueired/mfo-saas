export interface Simulation {
  id: string;
  name: string;
  description?: string;
  status: "VIVO" | "MORTO" | "INVALIDO";
  baseTax: string;
  version: number;
  updatedAt: string;
  createdAt: string;
}
