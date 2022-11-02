import dotenv from "dotenv";
import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "apollo-server-express";
import path from "path";
import { buildSchema } from "type-graphql";
import { resolvers } from "@generated/type-graphql";
import cors from "cors";
import express from "express";
import axios from "axios";
import { getCollectionData } from "./services/collectionServices";

dotenv.config();

const PORT = process.env.PORT;
const COLLECTION_RUNNER = process.env.COLLECTION_RUNNER_URL;

console.log("collection runner", COLLECTION_RUNNER);
interface Context {
  prisma: PrismaClient;
}

const app = express();
app.use(cors());
async function main() {
  const schema = await buildSchema({
    resolvers,
    emitSchemaFile: path.resolve(__dirname, "schema.graphql"),
  });

  const prisma = new PrismaClient();
  await prisma.$connect();

  const server = new ApolloServer({
    schema,
    context: (): Context => ({ prisma }),
  });
  await server.start();
  server.applyMiddleware({ app });
  app.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready at http://localhost:3001${server.graphqlPath}`)
  );
}

main().catch(console.error);

app.post("/run-collection/:collectionId", async (req, res) => {
  const collectionId = Number(req.params.collectionId);
  if (!collectionId) {
    res.sendStatus(400);
  } else {
    let collectionData = await getCollectionData(collectionId);
    console.log(collectionData);
    await axios.post(`${COLLECTION_RUNNER}/${collectionId}`, collectionData);
    res.sendStatus(200);
  }
});
