import { gql } from "@apollo/client";

export const GET_ALL_YEARBOOKS = gql`
  query {
    getAllYearbooks {
      _id
      yearbook
      yearbookName
      yearPublish
    }
  }
`;

export const GET_YEARBOOK_BY_ID = gql`
 query findYearbookById($input: FindYearbookByIdInput!){
    findYearbookById(input: $input){
        _id
        yearbook
        yearbookName
        yearPublish
        }
}
`;
