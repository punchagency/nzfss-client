import { gql } from "@apollo/client";

export const GET_MUSHERS = gql`
  query GetMushers {
    getMushers {
      id
      name
      club
      dogs {
        name
        breed
        dateOfBirth
        nzfssNo
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
        name
        breed
        dateOfBirth
        nzfssRegistration
      }
      createdAt
    }
  }
`; 