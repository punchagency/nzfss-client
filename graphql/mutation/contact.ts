import { gql } from "@apollo/client";

export const CREATE_CONTACT = gql`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      _id
      name
      designation
      email
      image
      created_at
      clubs {
        _id
        name
      }
    }
  }
`;

export const UPDATE_CONTACT = gql`
  mutation UpdateContact($contactId: String!, $input: UpdateContactInput!) {
    updateContact(contactId: $contactId, input: $input) {
      _id
      name
      designation
      email
      image
      created_at
      clubs {
        _id
        name
      }
    }
  }
`;

export const DELETE_CONTACT = gql`
  mutation DeleteContact($contactId: String!) {
    deleteContact(contactId: $contactId) {
      _id
      name
      designation
      email
      image
      created_at
      clubs {
        _id
        name
      }
    }
  }
`; 