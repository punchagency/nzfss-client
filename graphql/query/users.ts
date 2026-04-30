import { gql } from "@apollo/client";

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      _id
      name
      email
      role
    }
  }
`;

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      _id
      name
      email
      role
    }
  }
`;

// Export for backward compatibility and consistency
export const GET_CURRENT_USER = CURRENT_USER;

