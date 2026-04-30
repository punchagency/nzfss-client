import { gql } from "@apollo/client";

export const CREATE_CLUB = gql`
  mutation createClub($input: CreateUserInput!) {
    createClub(input: $input) {
        _id
      name
      email
    }
  }
`;

export const UPDATE_CLUB = gql`
  mutation updateClub($clubId: String!, $input: UpdateUserInput!) {
    updateClub(input: $input, clubId: $clubId) {
      _id
      name
      email
      role
    }
  }
`;

export const DELETE_CLUB = gql`
  mutation deleteClub($clubId: String!) {
  deleteClub(clubId: $clubId){
    _id
    name
    email
  }
}
`;
