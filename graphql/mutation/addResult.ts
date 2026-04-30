import { gql } from "@apollo/client";

export const CREATE_RESULT = gql`
  mutation CreateEntrant($input: CreateEntrantInput!) {
    createEntrant(input: $input) {
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
    }
  }
`;

export const UPDATE_ADD_RESULT = gql`
  mutation UpdateEntrant($id: ID!, $input: UpdateEntrantInput!) {
    updateEntrant(id: $id, input: $input) {
      _id
      raceFormat
      class
      customClass
      name
      associatedDog {
        driverName
        name
        NZFSSRegistration
        dob
        breed
      }
      raceType
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
    }
  }
`;

export const UPDATE_ENTRANT = gql`
  mutation UpdateEntrantDetails($input: UpdateEntrantInput!, $entrantId: String!) {
    updateEntrantDetails(input: $input, entrantId: $entrantId) {
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
      raceTime
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
    }
  }
`;

// Add this mutation to your existing file
export const CREATE_ENTRANT = gql`
  mutation CreateEntrant($input: CreateEntrantInput!) {
    createEntrant(input: $input) {
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
    }
  }
`;

export const DELETE_ENTRANT = gql`
  mutation DeleteEntrant($entrantId: String!) {
    deleteEntrant(entrantId: $entrantId) {
      _id
    }
  }
`;