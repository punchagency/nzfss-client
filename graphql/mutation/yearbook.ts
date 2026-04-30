import { gql } from "@apollo/client";

export const CREATE_YEARBOOK = gql`
  mutation CreateYearbook($input: CreateYearbookInput!) {
    createYearbook(input: $input) {
      _id
      yearPublish
      yearbook
      yearbookName
    }
  }
`;

export const UPDATE_YEARBOOK = gql`
  mutation updateYearbook($yearbookId: String!, $input: UpdateYearbookInput!) {
    updateYearbook(yearbookId: $yearbookId, input: $input) {
      _id
      yearbookName
      yearbook
      yearPublish
    }
  }
`;

export const DELETE_YEARBOOK = gql`
  mutation deleteYearbook($yearbookId: String!) {
    deleteYearbook(yearbookId: $yearbookId) {
      _id
      yearbook
      yearbookName
      yearPublish
    }
  }
`;
