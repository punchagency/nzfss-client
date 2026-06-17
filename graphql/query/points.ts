import { gql } from "@apollo/client";

export const GET_ALL_POINTS = gql`
  query GetAllPoints {
    getAllPoints {
      _id
      entrantId
      points
      createdAt
      updatedAt
      entrant {
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
      }
    }
    getAllRcrPoints {
      _id
      rcrFlag
      rcrReg
      rcrPedigreeName
      rcrBreed
      rcrPoints
      rcrEvents
      rcrAwards
      rcrCutoff
      createdAt
      updatedAt
    }
  }
`;

export const GET_POINTS_WITH_ENTRANTS = gql`
  query GetPointsWithEntrants {
    getAllPoints {
      _id
      entrantId
      points
      createdAt
      updatedAt
    }
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
      createdAt
    }
    getAllEvents {
      _id
      eventName
      eventDate
      club
      clubId
      region
    }
  }
`;

export const GET_DOG_WEIGHTPULL_POINTS = gql`
  query GetDogWeightpullPoints {
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
      dogWeight
      weightPulled
      eventId
      createdAt
    }
    getAllPoints {
      _id
      entrantId
      points
      dogPoints {
        NZFSSRegistration
        points
      }
      createdAt
      updatedAt
    }
    getAllEvents {
      _id
      eventName
      eventDate
      club
      clubId
      region
    }
    getAllWprPoints {
      _id
      wprFlag
      wprReg
      wprPedigreeName
      wprBreed
      wprMaxWeight
      wprMaxBWR
      wprPoints
      wprAwards
      createdAt
      updatedAt
    }
  }
`;

export const GET_DOG_RACE_POINTS = gql`
  query GetDogRacePoints {
    getDogRacePointSummaries {
      name
      regNumber
      breed
      pointsWithinCutoff
      pointsOutsideCutoff
      events
      avgCutoffSeconds
      awards
    }
  }
`;

/** @deprecated Use GET_DOG_RACE_POINTS (server-aggregated summaries) instead */
export const GET_DOG_RACE_POINTS_LEGACY = gql`
  query GetDogRacePointsLegacy {
    getAllPoints {
      _id
      entrantId
      points
      cutoffTime
      dogPoints {
        dogId
        NZFSSRegistration
        points
      }
      createdAt
      updatedAt
      entrant {
        _id
        name
        raceFormat
        class
        customClass
        associatedDog {
          dogId
          driverName
          name
          NZFSSRegistration
          dob
          breed
        }
        raceType
        raceTime
        eventId
      }
    }
    getAllRcrPoints {
      _id
      dogId
      rcrFlag
      rcrReg
      rcrPedigreeName
      rcrBreed
      rcrPoints
      rcrEvents
      rcrAwards
      rcrCutoff
      createdAt
      updatedAt
    }
  }
`;

export interface Point {
  _id: string;
  entrantId: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllPointsResponse {
  getAllPoints: Point[];
} 