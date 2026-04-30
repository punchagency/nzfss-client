import { gql } from "@apollo/client";

export const GET_ALL_FORMS = gql`
  query {
    getAllForms {
      _id
      formName
      file
      fileName
      formType
    }
  }
`;

export const GET_FORM_BY_ID = gql`
  query findFormById($input: FindFormByIdInput!) {
    findFormById(input: $input) {
      _id
      formName
      file
      fileName
      formType
    }
  }
`;
