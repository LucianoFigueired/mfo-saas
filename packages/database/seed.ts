import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "prisma/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "test@mfo.com" },
    update: {},
    create: {
      email: "test@mfo.com",
      name: "Test",
    },
  });

  const simulation = await prisma.simulation.create({
    data: {
      name: "Planejamento Sucessório Família Silva",
      baseTax: 0.04,
      startDate: new Date("2024-01-01"),
      userId: user.id,
      status: "VIVO",
      assets: {
        create: [
          { name: "Conta Corrente Itaú", type: "FINANCEIRO", value: 500000, date: new Date("2023-12-31") },
          { name: "Carteira de Ações", type: "FINANCEIRO", value: 2500000, date: new Date("2023-12-31") },
          { name: "Apartamento Balneário", type: "IMOBILIZADO", value: 2000000, date: new Date("2020-01-01") },
        ],
      },
      events: {
        create: [
          { name: "Pró-labore", type: "ENTRADA", value: 45000, frequency: "MONTHLY", startDate: new Date("2024-01-01") },
          { name: "Despesas Galpão", type: "SAIDA", value: 15000, frequency: "MONTHLY", startDate: new Date("2024-01-01") },
          { name: "Viagem Anual Família", type: "SAIDA", value: 80000, frequency: "YEARLY", startDate: new Date("2024-06-01") },
        ],
      },
      insurances: {
        create: [
          { name: "Seguro de Vida Prudencial", premium: 1200, insuredValue: 3000000, duration: 240, startDate: new Date("2024-01-01") },
        ],
      },
    },
  });

  console.log({ message: "Seed finalizado com sucesso!", simulationId: simulation.id });
}

main()
  .catch((e) => {
    console.error(e);
    return;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
