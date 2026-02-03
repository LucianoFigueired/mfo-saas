import { z } from "zod";

export const CreateSimulationSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  baseTax: z.number().min(0, "A taxa não pode ser negativa").max(1, "A taxa deve ser decimal (ex: 0.04)"),
  startDate: z.string().or(z.date()),
  status: z.enum(["VIVO", "MORTO", "INVALIDO"]).default("VIVO"),
});

export const CreateVersionSchema = z.object({
  name: z.string().min(3).optional(),
});

export const ProjectionQuerySchema = z.object({
  status: z.enum(["VIVO", "MORTO", "INVALIDO"]).optional(),
});

export const CreateAssetSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["FINANCEIRO", "IMOBILIZADO"]),
  value: z.number().positive("O valor deve ser maior que zero"),
  date: z.string().or(z.date()),
  isFinanced: z.boolean().optional(),
  installments: z.number().int().positive().optional(),
  interestRate: z.number().optional(),
  downPayment: z.number().optional(),
});

export type CreateSimulationDto = z.infer<typeof CreateSimulationSchema>;
export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;
export type CreateVersionDto = z.infer<typeof CreateVersionSchema>;
export type ProjectionQueryDto = z.infer<typeof ProjectionQuerySchema>;
