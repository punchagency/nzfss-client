import { gql } from "@apollo/client";

/**
 * GraphQL query to fetch all clubs
 */
export const GET_CLUBS = gql`
  query GetClubs {
    clubs {
      _id
      name
      email
    }
  }
`;

/**
 * TypeScript types for the query response
 */
export interface GetClubsResponse {
  clubs: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
} 