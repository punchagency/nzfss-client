import { gql } from "@apollo/client";

export const GET_ALL_DOGS = gql`
 query {
  getAllDogs {
    _id
    driverName
    name
    NZFSSRegistration
    DateOfBirth
    Breed
  }
}
`;
