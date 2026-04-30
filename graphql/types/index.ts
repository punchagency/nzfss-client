import { gql } from "apollo-server-express";
import { musherTypes } from "./musher";

export const typeDefs = gql`
  ${musherTypes}
`; 