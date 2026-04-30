import { gql } from "@apollo/client";

export const GET_LOG_HISTORY = gql`
  query FindLogsByEntrantId($entrantId: String!) {
    findLogsByEntrantId(entrantId: $entrantId) {
      _id
      action
      oldData
      newData
      createdAt
    }
  }
`; 