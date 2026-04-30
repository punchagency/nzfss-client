import { gql } from "@apollo/client";

export const GET_ALL_RULES = gql`
  query {
  getAllRules {
    _id
    fileName
    file
    amendedDate
    constitutionRules
  }
}
`;

export const GET_RULE_BY_ID = gql`
  query findRulesById($input: FindRulesByIdInput!){
findRulesById(input: $input){
	_id
    fileName
    file
    amendedDate
    constitutionRules
	}
}
`;
