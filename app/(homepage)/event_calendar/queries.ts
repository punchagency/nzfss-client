import { gql } from "@apollo/client";

export const GET_EVENTS = gql`
  query GetEvents {
    getAllEvents {
      _id
      eventName
      eventDate
      club
      type
      photo
      entryForm
      website
      region
      public
      status
      NZFSSSanctioning
      date
      isSubmitted
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      _id
      eventName
      eventDate
      club
      type
      photo
      entryForm
      location
      description
      website
      createdAt
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      _id
      eventName
      eventDate
      club
      type
      photo
      entryForm
      location
      description
      website
      createdAt
    }
  }
`; 