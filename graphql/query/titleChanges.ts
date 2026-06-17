import { gql } from "@apollo/client";

export const GET_UNRECOGNISED_TITLE_CHANGES = gql`
  query GetUnrecognisedTitleChanges {
    getUnrecognisedTitleChanges {
      dogId
      musherId
      dogName
      pedigreeName
      nzfssNo
      ownerName
      breed
      previousTitle
      newTitle
      previousTitleCode
      newTitleCode
      points
      events
    }
  }
`;

export interface UnrecognisedTitleChange {
  dogId: string;
  musherId: string;
  dogName?: string;
  pedigreeName?: string;
  nzfssNo?: string;
  ownerName?: string;
  breed?: string;
  previousTitle: string;
  newTitle: string;
  previousTitleCode?: string;
  newTitleCode: string;
  points: number;
  events: number;
}
