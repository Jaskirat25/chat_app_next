const { PrismaClient } = process.env.EDGE
  ? await import('@prisma/client/edge')
  : await import('@prisma/client');



export const Prisma= new PrismaClient();