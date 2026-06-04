import { gql } from "@apollo/client";

const MUSHER_CONTACT_FIELDS = `
  address
  phone
  email
  dateOfBirth
  guardianDetails
`;

/** Include on every dogs { } selection so dogId is always loaded and saved */
export const MUSHER_DOG_FIELDS = `
  dogId
  _id
  name
  pedigreeName
  nzkcNo
  nzfssNo
  dateOfBirth
  breed
  deceased
`;

export const GET_MUSHERS = gql`
  query GetMushers {
    getMushers {
      id
      name
      registrationNo
      kennelRegistrationNo
      ${MUSHER_CONTACT_FIELDS}
      dogs {
        ${MUSHER_DOG_FIELDS}
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MUSHER_BY_ID = gql`
  query GetMusherById($id: ID!) {
    getMusherById(id: $id) {
      id
      name
      registrationNo
      kennelRegistrationNo
      clubId
      ${MUSHER_CONTACT_FIELDS}
      dogs {
        ${MUSHER_DOG_FIELDS}
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_MUSHER = gql`
  mutation CreateMusher($input: CreateMusherInput!) {
    createMusher(input: $input) {
      id
      name
      registrationNo
      kennelRegistrationNo
      showProfileConsent
      ${MUSHER_CONTACT_FIELDS}
      dogs {
        dogId
        _id
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
  mutation UpdateMusher($id: ID!, $input: UpdateMusherInput!) {
    updateMusher(id: $id, input: $input) {
      id
      name
      registrationNo
      kennelRegistrationNo
      showProfileConsent
      ${MUSHER_CONTACT_FIELDS}
      dogs {
        dogId
        _id
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

export const DELETE_MUSHER = gql`
  mutation DeleteMusher($id: ID!) {
    deleteMusher(id: $id)
  }
`; 