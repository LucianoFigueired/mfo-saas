import { z } from "zod";

export const CreateSimulationSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  baseTax: z.number().min(0, "A taxa não pode ser negativa").max(100, "A taxa deve ser em porcentagem (ex: 4.5)"),
  clientId: z.string().uuid(),
  startDate: z.string().or(z.date()),
  status: z.enum(["VIVO", "MORTO", "INVALIDO"]).default("VIVO"),
});

export const CreateVersionSchema = z.object({
  name: z.string().optional(),
});

export const ProjectionQuerySchema = z.object({
  status: z.enum(["VIVO", "MORTO", "INVALIDO"]).optional(),
});

export const CreateAssetSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  type: z.enum(["FINANCEIRO", "IMOBILIZADO"]),
  value: z.number().positive("O valor deve ser maior que zero"),
  date: z.string().or(z.date()),
  isFinanced: z.boolean().optional(),
  installments: z.number().int().min(0).optional(),
  interestRate: z.number().optional(),
  downPayment: z.number().optional(),
});

export const CreateEventSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  type: z.enum(["ENTRADA", "SAIDA"]),
  value: z.number().positive("O valor deve ser positivo"),
  frequency: z.enum(["ONCE", "MONTHLY", "YEARLY"]).optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
});

export const CreateInsuranceSchema = z.object({
  name: z.string().min(2, "O nome da apólice deve ter pelo menos 2 caracteres"),
  premium: z.number().positive("O prêmio deve ser um valor positivo"),
  insuredValue: z.number().positive("O valor segurado deve ser positivo"),
  duration: z.number().int().positive("A duração deve ser em meses"),
  startDate: z.string().or(z.date()),
});

export const RegisterSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome é obrigatório"),
});

export const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string(),
});

export const CreateClientSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional().nullable(),
});

export const UpdateSimulationSchema = CreateSimulationSchema.partial();
export const UpdateAssetSchema = CreateAssetSchema.partial();
export const UpdateEventSchema = CreateEventSchema.partial();
export const UpdateInsuranceSchema = CreateInsuranceSchema.partial();

export type CreateSimulationDto = z.infer<typeof CreateSimulationSchema>;
export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;
export type CreateVersionDto = z.infer<typeof CreateVersionSchema>;
export type ProjectionQueryDto = z.infer<typeof ProjectionQuerySchema>;
export type UpdateSimulationDto = z.infer<typeof UpdateSimulationSchema>;
export type UpdateAssetDto = z.infer<typeof UpdateAssetSchema>;
export type CreateEventDto = z.infer<typeof CreateEventSchema>;
export type UpdateEventDto = z.infer<typeof UpdateEventSchema>;
export type CreateInsuranceDto = z.infer<typeof CreateInsuranceSchema>;
export type UpdateInsuranceDto = z.infer<typeof UpdateInsuranceSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type CreateClientDto = z.infer<typeof CreateClientSchema>;
