import { gql } from "@apollo/client";
import { HeatData, HeatDataInput, DogPoint, DogPointInput, PointsInput, Point, SubmitPointsResponse, Dog, Entrant } from "../types/shared";

export const SUBMIT_POINTS = gql`
  mutation SubmitPoints($points: [PointsInput!]!) {
    submitPoints(points: $points) {
      success
      message
      points {
        _id
        entrantId
        points
        cutoffTime
        dogPoints {
          NZFSSRegistration
          points
        }
        heatsData {
          heat
          temperature
          distance
          class
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
            driverName
            name
            NZFSSRegistration
            dob
            breed
          }
          raceType
          startTime
          raceTime
          cutoffTime
          userId
          eventId
          temperature
          distance
          createdAt
          heatsData {
            heat
            temperature
            distance
            class
          }
        }
      }
    }
  }
`;

// Add a debug function to log points submission
export const logPointsSubmission = (points: PointsInput[], response: SubmitPointsResponse | null) => {
  console.log('Points submission details:');
  console.log('Submitted points:', points);
  console.log('Server response:', response);
  
  if (response?.points) {
    const pointsMap = new Map();
    points.forEach(p => pointsMap.set(p.entrantId, p.points));
    
    console.log('Comparison:');
    response.points.forEach(point => {
      const submittedPoints = pointsMap.get(point.entrantId);
      console.log(`Entrant ID: ${point.entrantId}`);
      console.log(`  Submitted: ${submittedPoints}`);
      console.log(`  Saved: ${point.points}`);
      console.log(`  Match: ${submittedPoints === point.points ? 'YES' : 'NO'}`);
      if (point.entrant) {
        console.log(`  Entrant Name: ${point.entrant.name}`);
        console.log(`  Race Details: ${point.entrant.class} - ${point.entrant.customClass}`);
      }
    });
  }
};