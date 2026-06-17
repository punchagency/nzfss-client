import { gql } from "@apollo/client";

export const RECOGNISE_TITLE_CHANGES = gql`
  mutation RecogniseTitleChanges($input: RecogniseTitleChangesInput!) {
    recogniseTitleChanges(input: $input) {
      success
      recognisedCount
      message
    }
  }
`;
