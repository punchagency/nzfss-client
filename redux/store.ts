import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import clubReducer from "./features/club-slice"
import eventReducer from "./features/event-slice"

export const store = configureStore({
    reducer: {
        club: clubReducer,
        event: eventReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;

