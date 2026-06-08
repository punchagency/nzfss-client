import { gql } from "@apollo/client";
import { GET_MUSHERS, MUSHER_DOG_FIELDS } from "@/lib/graphql/musher";

export { GET_MUSHERS };

export const GET_MUSHER = gql`
  query GetMusher($input: FindUserByIdInput!) {
    findUserById(input: $input) {
      _id
      name
      dogs {
        ${MUSHER_DOG_FIELDS}
      }
      createdAt
    }
  }
`;

export const GET_MUSHER_BY_ID = gql`
  query GetMusherById($input: FindUserByIdInput!) {
    findUserById(input: $input) {
      _id
      name
      dogs {
        ${MUSHER_DOG_FIELDS}
      }
      createdAt
    }
  }
`;
