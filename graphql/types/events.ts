export interface Dog {
  name: string;
  points?: number;
}

export interface Driver {
  name: string;
  points?: number;
}

export interface Entrant {
  _id: string;
  name: string;
  class: string;
  raceType: string;
  dogs?: Dog[];
  drivers?: Driver[];
  points?: number;
  cutoffTime?: string;
}

export interface Event {
  _id: string;
  name: string;
  date: string;
  entrants: Entrant[];
}

export interface SavedResult {
  _id: string;
  eventId: string;
  eventName: string;
  date: string;
  entrants: Entrant[];
  createdAt: string;
  updatedAt: string;
} 