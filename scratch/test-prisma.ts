import { PrismaClient } from '@prisma/client';
console.log('PrismaClient found:', !!PrismaClient);
const prisma = new PrismaClient();
console.log('Instance created');
void prisma;
