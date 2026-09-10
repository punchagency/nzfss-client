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

export const REQUEST_DOG_TRANSFER = gql`
  mutation RequestDogTransfer($input: RequestDogTransferInput!) {
    requestDogTransfer(input: $input) {
      _id
      formType
      status
      dogId
      sourceMusherId
      destinationMusherId
      sourceMusherName
      destinationMusherName
      affiliationFrom
      affiliationTo
      fromClubApproval
      toClubApproval
    }
  }
`;

export const GET_DOG_TRANSFERS = gql`
  query GetDogTransfers($clubId: String!) {
    forms(status: "pending", formType: "dog-transfer", clubId: $clubId) {
      _id
      formType
      formName
      applicantName
      dogId
      sourceMusherId
      destinationMusherId
      sourceMusherName
      destinationMusherName
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