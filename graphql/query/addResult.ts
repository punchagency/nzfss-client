import { gql } from "@apollo/client";

export const GET_ALL_RESULTS = gql`
  query {
    getAllEntrants {
      _id
      name
      raceFormat
      class
      customClass
      associatedDog {
        driverName
        name
        NZFSSRegistration
        dob
        breed
      }
      raceType
      startTime
      raceTime
      userId
      eventId
      temperature
      distance
      heat
      heatsData {
        heat
        temperature
        distance
        class
      }
      dogWeight
      weightPulled
      createdAt
      updatedAt
    }
  }
`;

export const GET_RESULTS_BY_ID = gql`
  query findSingleEntrantById($input: FindEntrantByIdInput!) {
    findSingleEntrantById(input: $input) {
      _id
      name
      raceFormat
      class
      customClass
      associatedDog
      raceType
      startTime
      raceTime
      userId
      eventId
      heat
      heatsData {
        heat
        temperature
        distance
        class
      }
    }
  }
`;

export const GET_RESULTS_BY_EVENT_ID = gql`
  query getEntrantsByEventId($eventId: String!) {
    getEntrantsByEventId(eventId: $eventId) {
      _id
      name
      raceFormat
      class
      customClass
      associatedDog {
        driverName
        name
        NZFSSRegistration
        dob
        breed
      }
      raceType
      startTime
      raceTime
      eventId
      temperature
      distance
      heat
      heatsData {
        heat
        temperature
        distance
        class
      }
      dogWeight
      weightPulled
      createdAt
      updatedAt
    }
  }
`;
