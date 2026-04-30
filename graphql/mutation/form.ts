import { gql } from "@apollo/client";

export const CREATE_FORM = gql`
 mutation createForm($input: CreateFormInput!) {
  createForm(input: $input) {
    _id
    formName
    file
    fileName
    formType
  }
}
`;

export const UPDATE_FORM = gql`
 mutation updateForm($formId: String!, $input: UpdateFormInput!) {
  updateForm(formId: $formId, input: $input) {
    _id
    formName
    file
    fileName
    formType
  }
}
`;

export const DELETE_FORM = gql`
 mutation deleteForm($formId: String!) {
  deleteForm(formId: $formId){
    _id
    formName
    file
    fileName
    formType
  }
}
`;