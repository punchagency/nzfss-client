
import { CREATE_RULES, DELETE_RULES, UPDATE_RULES } from "@/graphql/mutation/rules";
import { GET_ALL_RULES } from "@/graphql/query/rules";
import { useQuery, useMutation, gql } from "@apollo/client";

export interface RULES {
  _id: string;
  amendedDate: string;
  file: string;
  fileName: string;
  constitutionRules: string;
}

export interface RulesInput {
  amendedDate?: string;
    file?: string;
    fileName?: string;
    constitutionRules?: string ;
  }
// Hook to manage rules
export const useRules = () => {
  // const dispatch = useAppDispatch();

  // Fetch all rules
  const { data, loading, error } = useQuery(GET_ALL_RULES, {
    onCompleted: (data) => {},
    onError: (error) => {
     
    },
  });

  const [addRulesMutation] = useMutation(CREATE_RULES, {
    optimisticResponse: (variables) => {
      const newRule = {
        _id: "temporary-id",
        constitutionRules: variables.input.constitutionRules,
        amendedDate: variables.input.amendedDate,
        file: variables.input.file,
        fileName: variables.input.fileName,
      };
      return { createRules: newRule };
    },
    update: (cache, { data }) => {
      const newRule = data.createRules;

      // Modify the cache to update the list of rules
      cache.modify({
        fields: {
          getAllRules(existingRules = []) {
            // Create a reference to the new rule
            const newRuleRef = cache.writeFragment({
              data: newRule,
              fragment: gql`
                fragment NewRule on RULES {
                  _id,
                  amendedDate,
                  constitutionRules,
                  file
                  fileName
                }
              `,
            });

            // Prepend the new rule to the existing rules
            return [newRuleRef, ...existingRules];
          },
        },
      });
    },
    onError: (error) => {
      // Handle error
    },
  });

  const [updateRulesMutation] = useMutation(UPDATE_RULES, {
    optimisticResponse: (variables: {
      rulesId: string;
      input: { amendedDate: string; constitutionRules: string; file: string; fileName: string;};
    }) => {
      const updatedRules = {
        ...variables.input,
        _id: variables.rulesId,
        amendedDate: variables.input.amendedDate || null,
        constitutionRules: variables.input.constitutionRules || null,
        file: variables.input.file || null,
        fileName: variables.input.fileName || null,

      };
      return { updateRules: updatedRules };
    },
    update: (cache, { data }) => {
      const updatedRule = data.updateRules;

      // Modify Apollo Client cache
      cache.modify({
        fields: {
          getAllRules(existingRules = []) {
            return existingRules.map((rule: RULES) =>
                rule._id === updatedRule._id ? updatedRule : rule
            );
          },
        },
      });
    },
    onError: (error) => {
      // Handle error
    },
  });

  const [deleteRulesMutation] = useMutation(DELETE_RULES, {
    optimisticResponse: (variables) => {
      const optimisticDeletedRule = {
        _id: variables.rulesId,
        amendedDate: null,
        constitutionRules: null,
        file: null,
        fileName: null,
      };
      // Return the optimistic response indicating deletion
      return { deleteRules: optimisticDeletedRule };
    },

    update: (cache, { data }) => {
      const deletedRule = data.deleteRules;

      if (!deletedRule) return;

      const existingRules =
        cache.readQuery<{
          getAllRules: {
            _id: string;
            amendedDate: string;
            constitutionRules: string;
            file: string;
            fileName: string;
          }[];
        }>({
          query: GET_ALL_RULES,
        })?.getAllRules || [];

      const updatedRules = existingRules.filter(
        (rule: RULES) => rule._id !== deletedRule._id
      );

      cache.writeQuery({
        query: GET_ALL_RULES,
        data: { getAllRules: updatedRules },
      });
    },

    onError: (error) => {
      // Handle error in case mutation fails
    },
    
  });

   // Function to add a rule
   const addRule = (inputData: RulesInput) => {
    return addRulesMutation({
      variables: {
        input: inputData, 
      },
    });
  };

  // Function to update a rule
  const updateRule = (rulesId: string, inputData: RulesInput) => {
    return updateRulesMutation({
      variables: {
        rulesId,
        input: {
          amendedDate: inputData.amendedDate,
          constitutionRules: inputData.constitutionRules,
          file: inputData.file,
          fileName: inputData.fileName,
        },
      },
    });
  };

  return {
    rules: data?.getAllRules || [],
    loading,
    error,
    addRule,
    updateRule,
    deleteRule: deleteRulesMutation,
  };
};
