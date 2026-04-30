// redux/features/event-slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Event type
export interface Event {
  _id?: string;
  eventName?: string;
  eventDate?: string;
  preferredDate?: string;
  alternativeDate?: string;
  club?: string;
  region?: string;
  entryForm?: string;
  type?: string;
  result?: boolean;
  publicBtn?: boolean;
  checkDate?: string;
  NZFSSSanctioning?: boolean;
}

type InitialState = {
  events: Event[]; // Array of events
  loading: boolean;
  error: string | null;
};

const initialState: InitialState = {
  events: [],
  loading: false,
  error: null,
};

// Create the event slice
export const eventSlice = createSlice({
  name: "event",
  initialState,
  reducers: {
    setEvents(state, action: PayloadAction<Event[]>) {
      state.events = action.payload;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },

    addEvent(state, action: PayloadAction<Event>) {
      state.events.push(action.payload);
    },

    updateEvent(state, action: PayloadAction<Event>) {
      const index = state.events.findIndex((event) => event._id === action.payload._id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },

    deleteEvent(state, action: PayloadAction<string>) {
      state.events = state.events.filter((event) => event._id !== action.payload);
    },
  },
});

export const { setEvents, setLoading, setError, addEvent, updateEvent, deleteEvent } = eventSlice.actions;

export default eventSlice.reducer;
