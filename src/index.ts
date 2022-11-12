import dotenv from "dotenv";
import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "apollo-server-express";
import path from "path";
import { buildSchema } from "type-graphql";
import { resolvers, applyResolversEnhanceMap } from "@generated/type-graphql";
import { resolversEnhanceMap } from "./middleware/monitorMiddleware";
import cors from "cors";
import express from "express";
import axios from "axios";

dotenv.config();

const PORT = process.env.PORT;

export interface Context {
  prisma: PrismaClient;
}

const app = express();
app.use(cors());

console.log("database url", process.env.DATABASE_URL);
console.log("port", process.env.PORT);
async function main() {
  applyResolversEnhanceMap(resolversEnhanceMap);
  const schema = await buildSchema({
    resolvers,
    // emitSchemaFile: path.resolve(__dirname, "schema.graphql"),
  });

  console.log("attempting to connect prisma");

  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log("prisma connected");
  console.log("connecting apollo server ");

  const server = new ApolloServer({
    schema,
    context: (): Context => ({ prisma }),
  });
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready`)
  );
}

main().catch(e => console.log(e))

app.get("/health", (req, res) => res.json({ ok: true }));
