// redux/features/club-slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Club type
export interface Club {
  _id?: string;
  name: string;
  email?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
  createdAt?: string;
}

type InitialState = {
  clubs: Club[]; // Array of clubs
  loading: boolean;
  error: string | null;
};

const initialState: InitialState = {
  clubs: [],
  loading: false,
  error: null,
};

export const clubSlice = createSlice({
  name: "club",
  initialState,
  reducers: {
    setClubs(state, action: PayloadAction<Club[]>) {
      state.clubs = action.payload;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },

    addClub(state, action: PayloadAction<Club>) {
      state.clubs.push(action.payload);
    },

    updateClub(state, action: PayloadAction<Club>) {
      const index = state.clubs.findIndex((club) => club._id === action.payload._id);
      if (index !== -1) {
        state.clubs[index] = action.payload;
      }
    },

    deleteClub(state, action: PayloadAction<string>) {
      state.clubs = state.clubs.filter((club) => club._id !== action.payload);
    },
  },
});

export const { setClubs, setLoading, setError, addClub, updateClub, deleteClub } = clubSlice.actions;

export default clubSlice.reducer;
