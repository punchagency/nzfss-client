import { gql } from "@apollo/client";

export const CREATE_RULES = gql`
 mutation createRules($input: CreateRulesInput!) {
  createRules(input: $input) {
    _id
    fileName
    file
    amendedDate
    constitutionRules
  }
}
`;

export const UPDATE_RULES = gql`
mutation updateRules($rulesId: String!, $input: UpdateRulesInput!) {
  updateRules(rulesId: $rulesId, input: $input) {
    _id
    fileName
    file
    amendedDate
    constitutionRules
  }
}
`;

export const DELETE_RULES = gql`
 mutation deleteRules($rulesId: String!) {
  deleteRules(rulesId: $rulesId){
    _id
    fileName
    file
    amendedDate
    constitutionRules
  }
}
`;