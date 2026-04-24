import * as Prisma from "@prisma/client";
const PrismaClient = Prisma.PrismaClient;
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const prismaClientSingleton = () => {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.log("DEBUG: Connecting Prisma to Turso:", tursoUrl);
    }

    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });

    return new PrismaClient({ adapter });
  }

  const dbUrl =
    process.env.LOCAL_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "file:./prisma/dev.db";
  const relativePath = dbUrl.replace("file:", "");
  const dbPath = path.resolve(/* turbopackIgnore: true */ process.cwd(), relativePath);

  if (process.env.NODE_ENV !== "production") {
    console.log("DEBUG: Connecting to SQLite at:", dbPath);
  }

  const sqlite = new Database(dbPath);
  const adapter = new PrismaBetterSqlite3(
    sqlite as unknown as ConstructorParameters<typeof PrismaBetterSqlite3>[0]
  );
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
