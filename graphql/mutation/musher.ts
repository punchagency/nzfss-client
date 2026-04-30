import { gql } from "@apollo/client";

export const CREATE_MUSHER = gql`
  mutation CreateMusher($input: CreateMusherInput!) {
    createMusher(input: $input) {
      id
      name
      registrationNo
      kennelRegistrationNo
      club
      dogs {
        name
        pedigreeName
        nzkcNo
        nzfssNo
        dateOfBirth
        breed
        deceased
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MUSHER = gql`
  mutation UpdateMusher($musherId: String!, $input: UpdateMusherInput!) {
    updateMusher(musherId: $musherId, input: $input) {
      _id
      name
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