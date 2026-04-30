export interface HeatData {
  heat: string;
  temperature: string;
  distance: string;
  class: string;
  __typename?: string;
}

export interface HeatDataInput {
  heat: string;
  temperature: string;
  distance: string;
  class: string;
}

export interface DogPoint {
  NZFSSRegistration: string;
  points: number;
  __typename?: string;
}

export interface DogPointInput {
  NZFSSRegistration: string;
  points: number;
}

export interface PointsInput {
  entrantId: string;
  points: number;
  cutoffTime?: string;
  dogPoints: DogPointInput[];
  heatsData?: HeatData[];
}

export interface Dog {
  driverName: string;
  name: string;
  NZFSSRegistration: string;
  dob: string;
  breed: string;
  __typename?: string;
}

export interface Entrant {
  _id: string;
  name: string;
  raceFormat: string;
  class: string;
  customClass: string;
  associatedDog: Dog[];
  drivers?: Array<{
    name: string;
    dogs: string[];
    raceTime?: string;
    raceStatus: "Started" | "Did not start" | "Did not qualify";
  }>;
  raceType: "musher" | "harness" | "weightpull" | "started";
  startTime: string;
  time?: string;
  raceTime?: string;
  cutoffTime?: string;
  userId: string;
  eventId: string;
  temperature?: string;
  distance?: string;
  createdAt: string;
  weightPulled?: string;
  dogWeight?: string;
  heatsData?: HeatData[];
  __typename?: string;
}

export interface Point {
  _id: string;
  entrantId: string;
  points: number;
  cutoffTime?: string;
  dogPoints?: DogPoint[];
  heatsData?: HeatData[];
  createdAt: string;
  updatedAt: string;
  entrant?: Entrant;
  __typename?: string;
}

export interface SubmitPointsResponse {
  success: boolean;
  message?: string;
  points?: Point[];
  __typename?: string;
} 