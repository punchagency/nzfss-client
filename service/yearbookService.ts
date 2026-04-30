import { useQuery, useMutation, gql } from "@apollo/client";
import { v4 as uuidv4 } from 'uuid';
import { GET_ALL_YEARBOOKS } from "@/graphql/query/yearbook";
import { CREATE_YEARBOOK, DELETE_YEARBOOK, UPDATE_YEARBOOK } from "@/graphql/mutation/yearbook";

export interface Yearbook {
  _id: string;
  yearbook: string;
  yearbookName: string;
  yearPublish: string;

} 
// Hook to manage yearbooks
export const useYearbooks = () => {
  // const dispatch = useAppDispatch();

  // Fetch all yearbooks
  const { data, loading, error } = useQuery(GET_ALL_YEARBOOKS, {
    onCompleted: (data) => {
   
    },
    onError: (error) => {
      error.message
    },
  });

  const [addYearbookMutation] = useMutation(CREATE_YEARBOOK, {
    optimisticResponse: (variables) => {
      const newYearbook = {
        _id: "temporary-id",
        yearbook: variables.input.yearbook,
        yearbookName: variables.input.yearbookName,
        yearPublish: variables.input.yearPublish,
      };
      return { createYearbook: newYearbook };
    },
    update: (cache, { data }) => {
      const newYearbook = data.createYearbook;
      
      // Modify the cache to update the list of yearbooks
      cache.modify({
        fields: {
          getAllYearbooks(existingYearbooks = []) {
            // Create a reference to the new yearbook
            const newYearbookRef = cache.writeFragment({
              data: newYearbook,
              fragment: gql`
                fragment NewYearbook on Yearbook {
                  _id
                  yearbook
                  yearbookName
                  yearPublish
                }
              `,
            });
            
            // Prepend the new yearbook to the existing yearbooks
            return [newYearbookRef, ...existingYearbooks]; 
          },
        },
      });
    },
    onError: (error) => {
      // Handle error
    },
  });

const [updateYearbookMutation] = useMutation(UPDATE_YEARBOOK, {
    optimisticResponse: (variables: { yearbookId: string, input: { yearbook: string, yearbookName: string, yearPublish: string } }) => {
      const updatedYearbook = { 
        ...variables.input, 
        _id: variables.yearbookId,  
      };
      return { updateYearbook: updatedYearbook };  
    },
    update: (cache, { data }) => {
      const updatedYearbook = data.updateYearbook;

      // Modify Apollo Client cache
      cache.modify({
        fields: {
          getAllYearbooks(existingYearbooks = []) {
            return existingYearbooks.map((yearbook: Yearbook) =>
              yearbook._id === updatedYearbook._id ? updatedYearbook : yearbook
            );
          },
        },
      });
    },
    onError: (error) => {
        // Handle error
    },
  });
  
  const [deleteYearbookMutation] = useMutation(DELETE_YEARBOOK, {
    optimisticResponse: (variables) => {
      const optimisticDeletedYearbook = {
        _id: variables.yearbookId, 
        yearbook: null,  
        yearbookName: null,  
        yearPublish: null,
      };
  
      // Return the optimistic response indicating deletion
      return { deleteYearbook: optimisticDeletedYearbook };
    },
  
    update: (cache, { data }) => {
      const deletedYearbook = data.deleteYearbook;
  
      if (!deletedYearbook) return;

      const existingYearbooks = cache.readQuery<{ getAllYearbooks: { _id: string; yearbook: string; yearbookName: string; yearPublish: string }[] }>({
        query: GET_ALL_YEARBOOKS,
      })?.getAllYearbooks || [];
  
      const updatedYearbooks = existingYearbooks.filter((yearbook: Yearbook) => yearbook._id !== deletedYearbook._id);
  
      cache.writeQuery({
        query: GET_ALL_YEARBOOKS,
        data: { getAllYearbooks: updatedYearbooks },
      });
  
    },
  
    onError: (error) => {
       // Handle error in case mutation fails
    },
  });
  
  
  return {
    yearbooks: data?.getAllYearbooks || [],
    loading,
    error,
    addYearbook: addYearbookMutation,
    updateYearbook: updateYearbookMutation,
    deleteYearbook: deleteYearbookMutation,
  };
};
