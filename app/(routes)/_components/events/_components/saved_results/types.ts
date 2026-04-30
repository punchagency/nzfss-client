export interface Dog {
  driverName: string;
  name: string;
  NZFSSRegistration: string;
  dob: string;
  breed: string;
}

export interface Driver {
  name: string;
  dogs: string[];
  raceTime?: string;
  raceStatus: "Started" | "Did not start" | "Did not qualify";
}

export interface Entrant {
  _id: string;
  name: string;
  raceFormat: string;
  class: string;
  customClass: string;
  associatedDog: Dog[];
  drivers: Driver[];
  raceType: "musher" | "harness" | "weightpull" | "started";
  startTime: string;
  time?: string;
  userId: string;
  eventId: string;
  temperature?: string;
  distance?: string;
  createdAt: string;
  raceTime?: string;
}

export interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  club: string;
  clubId: string;
  region: string;
} 