import { useQuery, useMutation, gql } from "@apollo/client";
import { GET_ALL_CLUBS } from "@/graphql/query/clubs";
import { setClubs, setError, addClub, updateClub, deleteClub, Club } from "@/redux/features/club-slice";
import { useAppDispatch } from "@/redux/reduxHook";
import { CREATE_CLUB, DELETE_CLUB, UPDATE_CLUB } from "@/graphql/mutation/club";

// Hook to manage clubs
export const useClubs = () => {
  // const dispatch = useAppDispatch();

  // Fetch all clubs
  const { data, loading, error, refetch } = useQuery(GET_ALL_CLUBS, {
    onCompleted: (data) => {
      console.log("Successfully fetched clubs:", data?.getAllClubs?.length);
    },
    onError: (error) => {
      console.error("Error fetching clubs:", error.message, error.graphQLErrors);
    },
    fetchPolicy: "network-only", // Always fetch from network for public data
    notifyOnNetworkStatusChange: true,
  });

  // Add a new club
  const [addClubMutation] = useMutation(CREATE_CLUB, {
  optimisticResponse: (variables: { input: { name: any; email: any; password: any; }; }) => {
    // Create a new club object excluding 'role' since it's handled by the server
    const newClub = {
        _id: "temporary-id",
      name: variables.input.name,
      email: variables.input.email,
      password: variables.input.password,
      role: "default",
    };
    // dispatch(addClub(newClub)); // Update Redux immediately
    return { createClub: newClub };  // Return the new club object without role
  },
  update: (cache, { data }) => {
    const newClub = data.createClub;  // Get the actual new club with _id and role from the server
    cache.modify({
      fields: {
        getAllClubs(existingClubs = []) {
          const newClubRef = cache.writeFragment({
            data: newClub,
            fragment: gql`
              fragment NewClub on Club {
                _id
                name
                email 
                role
              }
            `,
          });
          return [newClubRef, ...existingClubs];  // Add the new club to the cache
        },
      },
    });
  },
  onError: (error) => {
    // dispatch(setError(error.message));  // Handle error
  },
});

const [updateClubMutation] = useMutation(UPDATE_CLUB, {
    optimisticResponse: (variables: { clubId: string, input: { name: string, email: string, password: string } }) => {
      const updatedClub = { 
        ...variables.input, 
        _id: variables.clubId,  // Add the clubId to the optimistic response
        role: "default",  // Assuming "default" role unless provided by input
      };

      // Dispatch Redux update immediately
      // dispatch(updateClub(updatedClub));  // Update the Redux store immediately with the optimistic data

      return { updateClub: updatedClub };  // Return the updated club object
    },
    update: (cache, { data }) => {
      const updatedClub = data.updateClub;

      // Modify Apollo Client cache
      cache.modify({
        fields: {
          getAllClubs(existingClubs = []) {
            return existingClubs.map((club: Club) =>
              club._id === updatedClub._id ? updatedClub : club
            );
          },
        },
      });
    },
    onError: (error) => {
      // dispatch(setError(error.message));  // Handle error
    },
  });
  
  const [deleteClubMutation] = useMutation(DELETE_CLUB, {
    optimisticResponse: (variables: { clubId: any; }) => {
      const optimisticDeletedClub = {
        _id: variables.clubId, 
        name: null,  
        email: null,
      };
  
      // Update Redux immediately to reflect the club removal
      // dispatch(deleteClub(variables.clubId));
  
      // Return the optimistic response indicating deletion
      return { deleteClub: optimisticDeletedClub };
    },
  
    update: (cache, { data }) => {
      const deletedClub = data.deleteClub;
  
      if (!deletedClub) return;

      const existingClubs = cache.readQuery<{ getAllClubs: { _id: string; name: string; email: string }[] }>({
        query: GET_ALL_CLUBS,
      })?.getAllClubs || [];
  
      // Create a new array by filtering out the deleted club
      const updatedClubs = existingClubs.filter((club: Club) => club._id !== deletedClub._id);
  
      // Directly write the updated clubs back into the Apollo cache
      cache.writeQuery({
        query: GET_ALL_CLUBS,
        data: { getAllClubs: updatedClubs },
      });
  
    },
  
    onError: (error) => {
      // dispatch(setError(error.message)); // Handle error in case mutation fails
    },
  });
  
  return {
    clubs: data?.getAllClubs || [],
    loading,
    error,
    refetch,
    addClub: addClubMutation,
    updateClub: updateClubMutation,
    deleteClub: deleteClubMutation,
  };
};
