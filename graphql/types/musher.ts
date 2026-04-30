import { gql } from "apollo-server-express";

export const musherTypes = gql`
  type Dog {
    _id: ID!
    name: String!
    pedigreeName: String
    nzkcNo: String
    nzfssNo: String
    dateOfBirth: String
    breed: String
    deceased: Boolean
  }

  type Musher {
    _id: ID!
    name: String!
    registrationNo: String!
    dogs: [Dog!]!
  }

  input DogInput {
    name: String!
    pedigreeName: String
    nzkcNo: String
    nzfssNo: String
    dateOfBirth: String
    breed: String
    deceased: Boolean
  }

  input CreateMusherInput {
    name: String!
    registrationNo: String!
    dogs: [DogInput!]!
  }

  input UpdateMusherInput {
    name: String
    registrationNo: String
    dogs: [DogInput!]
  }

  type Query {
    getAllMushers: [Musher!]!
    getMusherById(id: ID!): Musher
  }

  type Mutation {
    createMusher(input: CreateMusherInput!): Musher!
    updateMusher(id: ID!, input: UpdateMusherInput!): Musher!
    deleteMusher(id: ID!): Boolean!
  }
`; 