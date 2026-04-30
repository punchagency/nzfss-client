import { gql } from "@apollo/client";

export const GET_ALL_RULES = gql`
  query GetAllRules {
    getAllRules {
      _id
      constitutionRules
      amendedDate
      file
      fileName
    }
  }
`; 