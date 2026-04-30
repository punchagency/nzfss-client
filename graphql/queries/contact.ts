import { gql } from "@apollo/client";

export const GET_ALL_CONTACTS = gql`
  query GetAllContacts {
    getAllContacts {
      _id
      name
      designation
      email
      image
    }
  }
`;

export const GET_CONTACT_BY_ID = gql`
  query GetContactById($contactId: String!) {
    findContactById(contactId: $contactId) {
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