import { gql } from "@apollo/client";
import { MUSHER_DOG_FIELDS } from "@/lib/graphql/musher";

export const CREATE_MUSHER = gql`
  mutation CreateMusher($input: CreateMusherInput!) {
    createMusher(input: $input) {
      id
      name
      registrationNo
      kennelRegistrationNo
      club
      dogs {
        ${MUSHER_DOG_FIELDS}
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MUSHER = gql`
  mutation UpdateMusher($id: ID!, $input: UpdateMusherInput!) {
    updateMusher(id: $id, input: $input) {
      id
      name
      registrationNo
      kennelRegistrationNo
      showProfileConsent
      address
      phone
      email
      dateOfBirth
      guardianDetails
      dogs {
        ${MUSHER_DOG_FIELDS}
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_MUSHER = gql`
  mutation DeleteMusher($id: ID!) {
    deleteMusher(id: $id)
  }
`;
