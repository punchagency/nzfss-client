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

export const REQUEST_MUSHER_TRANSFER = gql`
  mutation RequestMusherTransfer($input: RequestMusherTransferInput!) {
    requestMusherTransfer(input: $input) {
      _id
      formType
      status
      musherId
      affiliationFrom
      affiliationTo
      fromClubApproval
      toClubApproval
    }
  }
`;

export const APPROVE_FORM = gql`
  mutation ApproveForm($id: String!) {
    approveForm(id: $id) {
      _id
      status
      formType
      fromClubApproval
      toClubApproval
      affiliationFrom
      affiliationTo
    }
  }
`;

export const DECLINE_FORM = gql`
  mutation DeclineForm($id: String!) {
    declineForm(id: $id) {
      _id
      status
      fromClubApproval
      toClubApproval
    }
  }
`;

export const GET_MUSHER_TRANSFERS = gql`
  query GetMusherTransfers($clubId: String!) {
    forms(status: "pending", formType: "change", clubId: $clubId) {
      _id
      formType
      formName
      applicantName
      surname
      firstName
      musherId
      nzfssRegistrationNumber
      affiliationFrom
      affiliationTo
      fromClubApproval
      toClubApproval
      status
      dogs {
        petName
        nzfssNumber
        pedigreeName
        breed
      }
    }
  }
`;