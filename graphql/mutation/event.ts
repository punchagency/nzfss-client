import { gql } from "@apollo/client";

export const CREATE_EVENT = gql`
  mutation createEvent($input: CreateEventCalendarInput!) {
    createEvent(input: $input) {
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

export const UPDATE_EVENT = gql`
  mutation updateEventCalendar(
    $eventId: String!
    $input: UpdateEventCalendarInput!
  ) {
    updateEventCalendar(eventId: $eventId, input: $input) {
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
      reason
      photo
      type
      result
      clubId
      fileName
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation deleteEvent($eventId: String!) {
    deleteEvent(eventId: $eventId) {
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
      fileName
    }
  }
`;
