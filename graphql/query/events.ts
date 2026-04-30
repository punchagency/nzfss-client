import { gql } from "@apollo/client";

export const GET_ALL_EVENTS = gql`
  query GetAllEvents {
    getAllEvents {
      _id
      eventName
      photo
      eventDate
      club
      type
      location
      entryForm
      description
      website
    }
  }
`; 