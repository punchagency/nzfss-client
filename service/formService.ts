import { CREATE_FORM, DELETE_FORM, UPDATE_FORM } from "@/graphql/mutation/form";
import { GET_ALL_FORMS } from "@/graphql/query/form";
import { useQuery, useMutation, gql } from "@apollo/client";

export interface Form {
  _id: string;
  formName: string;
  formType: string;
  file: string;
  fileName: string;
}

export interface FormInput {
    formName: string | null;
    formType: string | null;
    file: string | null;
    fileName: string | null;
  }
// Hook to manage forms
export const useForms = () => {
  // const dispatch = useAppDispatch();

  // Fetch all forms
  const { data, loading, error } = useQuery(GET_ALL_FORMS, {
    onCompleted: (data) => {},
    onError: (error) => {
      error.message;
    },
  });

  const [addFormMutation] = useMutation(CREATE_FORM, {
    optimisticResponse: (variables: { input: { formName: any; formType: any; file: any; fileName: any; }; }) => {
      const newForm = {
        _id: "temporary-id",
        formName: variables.input.formName,
        formType: variables.input.formType,
        file: variables.input.file,
        fileName: variables.input.fileName,
      };
      return { createForm: newForm };
    },
    update: (cache, { data }) => {
      const newForm = data.createForm; 

      // Modify the cache to update the list of forms
      cache.modify({
        fields: {
          getAllForms(existingForms = []) {
            // Create a reference to the new form
            const newFormRef = cache.writeFragment({
              data: newForm,
              fragment: gql`
                fragment NewForm on Form {
                  _id,
                  formName,
                  formType,
                  file
                  fileName
                }
              `,
            });

            // Prepend the new form to the existing forms
            return [newFormRef, ...existingForms];
          },
        },
      });
    },
    onError: (error) => {
      // Handle error
    },
  });

  const [updateFormMutation] = useMutation(UPDATE_FORM, {
    optimisticResponse: (variables: {
      formId: string;
      input: { formName: string; formType: string; file: string; fileName: string;};
    }) => {
      const updatedForm = {
        ...variables.input,
        _id: variables.formId,
        formName: variables.input.formName || null,
        formType: variables.input.formType || null,
        file: variables.input.file || null,
        fileName: variables.input.fileName || null,
      };
      return { updateForm: updatedForm };
    },
    update: (cache, { data }) => {
      const updatedForm = data.updateForm;

      // Modify Apollo Client cache
      cache.modify({
        fields: {
          getAllForms(existingForms = []) {
            return existingForms.map((form: Form) =>
                form._id === updatedForm._id ? updatedForm : form
            );
          },
        },
      });
    },
    onError: (error) => {
      // Handle error
    },
  });

  const [deleteFormMutation] = useMutation(DELETE_FORM, {
    optimisticResponse: (variables: { formId: any; }) => {
      const optimisticDeletedForm = {
        _id: variables.formId,
        formName: "Deleted Form",
        formType: "deleted",
        file: "deleted",
        fileName: null
      };
      // Return the optimistic response indicating deletion
      return { deleteForm: optimisticDeletedForm };
    },

    update: (cache, { data }) => {
      const deletedForm = data.deleteForm;

      if (!deletedForm) return;

      const existingForms =
        cache.readQuery<{
          getAllForms: {
            _id: string;
            formName: string;
            formType: string;
            file: string;
            fileName: string;
          }[];
        }>({
          query: GET_ALL_FORMS,
        })?.getAllForms || [];

      const updatedForms = existingForms.filter(
        (form: Form) => form._id !== deletedForm._id
      );

      cache.writeQuery({
        query: GET_ALL_FORMS,
        data: { getAllForms: updatedForms },
      });
    },

    onError: (error) => {
      // Handle error in case mutation fails
    },
    
  });

   // Function to add a form
   const addForm = (inputData: FormInput) => {
    return addFormMutation({
      variables: {
        input: inputData
      },
    });
  };

  // Function to update a form
  const updateForm = (formId: string, inputData: FormInput) => {
    return updateFormMutation({
      variables: {
        formId,
        input: {
          formName: inputData.formName,
          formType: inputData.formType,
          file: inputData.file,
          fileName: inputData.fileName,
        },
      },
    });
  };

  return {
    forms: data?.getAllForms || [],
    loading,
    error,
    addForm,
    updateForm,
    deleteForm: deleteFormMutation,
  };
};
