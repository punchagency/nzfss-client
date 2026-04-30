import { CREATE_EVENT, DELETE_EVENT, UPDATE_EVENT } from "@/graphql/mutation/event";
import { GET_ALL_EVENTS } from "@/graphql/query/event";
import { useQuery, useMutation, gql } from "@apollo/client";

export interface CreateEventCalendarInput {
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
  isSubmitted: boolean; // Default is false
  status: string; 
  result: boolean; // Default is false
}

export interface UpdateEventCalendarInput {
  preferredDate?: string; 
  alternativeDate?: string; 
  date?: boolean; 
  NZFSSSanctioning?: boolean; 
  public?: boolean; 
  isSubmitted?: boolean; 
  status?: string; 
  eventName?: string; 
  eventDate?: string; 
  club?: string; 
  region?: string; 
  entryForm?: string; 
  website?: string; 
  reason?: string; 
  fileName?: string; 
  photo?: string; 
  type?: string; 
  result?: boolean; 
  clubId?: string;
}

// Hook to manage event calendar actions
export const useEvent = () => {
  // Fetch all events with network-only policy to ensure fresh data
  const { data, loading, error, refetch } = useQuery(GET_ALL_EVENTS, {
    fetchPolicy: "network-only", // Always fetch from network
    nextFetchPolicy: "cache-first", // Use cache for subsequent reads
    onCompleted: (data) => {
      // Log successful data fetch
      console.log("Events fetched successfully:", data?.getAllEvents?.length || 0, "events");
    },
    onError: (error) => {
      console.error("Error fetching events:", error.message);
    },
  });

  // Mutation to add a new event
  const [addEventMutation] = useMutation(CREATE_EVENT, {
    optimisticResponse: (variables: { input: CreateEventCalendarInput }) => {
      const newEvent = {
        _id: "temporary-id", // Temporary ID for optimistic updates
        ...variables.input,  // Spread the input fields for the new event
        entryForm: variables.input.entryForm || null,
        fileName: variables.input.fileName || null,
      };
      return { createEvent: newEvent };
    },
    update: (cache, { data }) => {
      const newEvent = data.createEvent;

      // Modify the cache to update the list of events
      cache.modify({
        fields: {
          getAllEvents(existingEvents = []) {
            const newEventRef = cache.writeFragment({
              data: newEvent,
              fragment: gql`
                fragment NewEvent on EventCalendar {
                  _id
                  preferredDate
                  alternativeDate
                  eventName
                  eventDate
                  club
                  region
                  entryForm
                  website
                  type
                  result
                  clubId
                  date
                  photo
                  NZFSSSanctioning
                  public
                  isSubmitted
                  status
                  result
                }
              `,
            });
            return [newEventRef, ...existingEvents]; // Add the new event to the list
          },
        },
      });
    },
    onError: (error) => {
      console.error("Error adding event:", error.message);
    },
  });

  // Mutation to update an existing event
  const [updateEventMutation] = useMutation(UPDATE_EVENT, {
    optimisticResponse: (variables: { eventId: string; input: UpdateEventCalendarInput }) => {
      const updatedEvent = {
        _id: variables.eventId,
        ...variables.input,
        preferredDate: variables.input.preferredDate || null,
        alternativeDate: variables.input.alternativeDate || null,
        eventName: variables.input.eventName || null,
        eventDate: variables.input.eventDate || null,
        club: variables.input.club || null,
        region: variables.input.region || null,
        entryForm: variables.input.entryForm || null,
        fileName: variables.input.fileName || null,
        type: variables.input.type || null,
        clubId: variables.input.clubId || null,
        website: variables.input.website || null,
        reason: variables.input.reason || null,
        date: variables.input.date !== undefined ? variables.input.date : false,
        NZFSSSanctioning: variables.input.NZFSSSanctioning !== undefined ? variables.input.NZFSSSanctioning : false,
        public: variables.input.public !== undefined ? variables.input.public : false,
        isSubmitted: variables.input.isSubmitted !== undefined ? variables.input.isSubmitted : false,
        status: variables.input.status || null,
        result: variables.input.result !== undefined ? variables.input.result : false,
        photo: variables.input.photo || null,
      };
      return { 
        updateEventCalendar: updatedEvent,
      };
    },
    update: (cache, { data }) => {
      const updatedEvent = data.updateEventCalendar;
      
      // Force a refetch after update to ensure we have the latest data
      refetch();

      // Also update the cache
      cache.modify({
        fields: {
          getAllEvents(existingEvents = []) {
            const updatedEvents = existingEvents.map((event: CreateEventCalendarInput) =>
              event._id === updatedEvent._id ? updatedEvent : event
            );
            return updatedEvents;
          },
        },
      });
    },
    onError: (error) => {
      console.error("Error updating event:", error.message);
    },
  });

  // Mutation to delete an event
  const [deleteEventMutation] = useMutation(DELETE_EVENT, {
    optimisticResponse: (variables: { eventId: string }) => {
      const optimisticDeletedEvent = {
        _id: variables.eventId, // Optimistic deletion
        preferredDate: null,
        alternativeDate: null,
        eventName: null,
        fileName: null,
        eventDate: null,
        club: null,
        region: null,
        entryForm: null,
        type: null,
        result: null,
        clubId: null,
        photo: null,
        website: null,
        date: null,
        NZFSSSanctioning: null,
        public: null,
        isSubmitted: null,
        status: null
      };
      return { deleteEvent: optimisticDeletedEvent };
    },
    update: (cache, { data }) => {
      const deletedEvent = data.deleteEvent;

      if (!deletedEvent) return;

      // Modify the cache to remove the deleted event
      const existingEvents = cache.readQuery<{ getAllEvents: CreateEventCalendarInput[] }>({
        query: GET_ALL_EVENTS,
      })?.getAllEvents || [];

      const updatedEvents = existingEvents.filter(
        (event: CreateEventCalendarInput) => event._id !== deletedEvent._id
      );

      cache.writeQuery({
        query: GET_ALL_EVENTS,
        data: { getAllEvents: updatedEvents },
      });
    },
    onError: (error) => {
       error.message
    },
  });

  // Function to add an event
  const addEventHandler = (inputData: UpdateEventCalendarInput) => {
    return addEventMutation({
      variables: {
        input: inputData, // Pass the input data for creating the event
      },
    });
  };

  // Function to update an event
  const updateEventHandler = (eventId: string, inputData: UpdateEventCalendarInput) => {
    // Find the current event to get its existing data
    const existingEvent = data?.getAllEvents.find((event: CreateEventCalendarInput) => event._id === eventId);
    
    console.log("Updating event:", eventId);
    console.log("Existing event data:", existingEvent);
    console.log("Input data for update:", inputData);
    
    // If we're updating date status but not explicitly touching the sanctioning status,
    // and the event already has sanctioning, make sure we preserve it
    if (inputData.date === true && 
        existingEvent?.NZFSSSanctioning === true && 
        inputData.NZFSSSanctioning === undefined) {
      console.log("Preserving sanctioning status during date update");
      inputData.NZFSSSanctioning = true;
    }
    
    console.log("Final update data:", inputData);

    return updateEventMutation({
      variables: {
        eventId,
        input: inputData,
      },
    });
  };

  // Function to delete an event
  const deleteEventHandler = (eventId: string) => {
    return deleteEventMutation({
      variables: { eventId },
    });
  };

  return {
    events: data?.getAllEvents || [],
    loading,
    error,
    addEvent: addEventHandler,
    updateEvent: updateEventHandler,
    deleteEvent: deleteEventHandler,
    refetch, // Expose refetch function
  };
};
