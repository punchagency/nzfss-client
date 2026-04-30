import { gql } from "@apollo/client";

export const GET_ALL_EVENTS = gql`
  query {
    getAllEvents {
      _id
      preferredDate
      alternativeDate
      date
      NZFSSSanctioning
      public
      isSubmitted
      status
      eventName
      eventDate
      club
      region
      entryForm
      website
      photo
      type
      result
      clubId
      fileName
    }
  }
`;

export const GET_EVENT_BY_ID = gql`
  query findEventCalendarById($input: FindEventCalendarByIdInput!) {
    findEventCalendarById(input: $input) {
      preferredDate
      alternativeDate
      date
      NZFSSSanctioning
      public
      isSubmitted
      status
      eventName
      eventDate
      club
      region
      entryForm
      website
      photo
      type
      result
      clubId
      fileName
    }
  }
`;
