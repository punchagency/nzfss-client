import { musherResolvers } from "./musher";

export const resolvers = {
  Query: {
    ...musherResolvers.Query,
  },
  Mutation: {
    ...musherResolvers.Mutation,
  },
}; 