import { graphql, GraphQLSchema } from "graphql";
import { createSchema } from "../utils/createSchema";

interface Options {
  source: string;
  variableValues?: {
    [key: string]: any;
  };
  authToken?: string;
}

let schema: GraphQLSchema;

export const graphqlCall = async ({
  source,
  variableValues,
  authToken,
}: Options) => {
  if (!schema) schema = await createSchema();
  return graphql({
    schema,
    source,
    variableValues,
    contextValue: {
      req: {
        headers: {
          authorization: authToken,
        },
      },
      res: {
        cookie: jest.fn(),
      },
    },
  });
};
