import { gql } from '@apollo/client';

export const CREATE_MUSHER = gql`
  mutation CreateMusher($input: CreateMusherInput!) {
    createMusher(input: $input) {
      _id
      name
      email
      phone
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

export const GET_ALL_MUSHERS = gql`
  query GetAllMushers {
    getAllMushers {
      _id
      name
      email
      phone
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

export const UPDATE_MUSHER = gql`
  mutation UpdateMusher($musherId: String!, $input: UpdateMusherInput!) {
    updateMusher(musherId: $musherId, input: $input) {
      _id
      name
      email
      phone
      dogs {
        name
        breed
        dateOfBirth
        nzfssRegistration
      }
    }
  }
`;

export const DELETE_MUSHER = gql`
  mutation DeleteMusher($musherId: String!) {
    deleteMusher(musherId: $musherId) {
      _id
    }
  }
`; 