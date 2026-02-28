import { Client } from "./client";

export interface Simulation {
  id: string;
  name: string;
  client: Client;
  description?: string;
  status: "VIVO" | "MORTO" | "INVALIDO";
  baseTax: string;
  version: number;
  updatedAt: string;
  createdAt: string;
}
