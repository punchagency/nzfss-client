export interface EventCalendar {
  _id?: string;
  preferredDate: string;
  alternativeDate: string;
  eventName: string;
  eventDate: string;
  club: string;
  region: string;
  photo: string;
  entryForm: string;
  fileName?: string; // Optional field
  type: string;
  clubId: string;
  website: string;
  date: boolean; // Default is false
  NZFSSSanctioning: boolean; // Default is false
  public: boolean; // Default is false
  status: string;
  result: boolean;
  isSubmitted: boolean;
  action: string;
}
