"use client";

import Table from "@/app/(routes)/_components/data_table";
import { Pencil, Trash2 } from "lucide-react";
import ActionIcons from "@/app/(routes)/_components/actions_ buttons";
import { useForms } from "@/service/formService";
import Warning from "@/components/warning";
import { useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/skeleton";
import Image from "next/image";
import { pdf } from "@/assets";
import UpdateForm from "./update_form";
import CreateForm from "./create_form";
import { useSearchParams } from "next/navigation";
import { ReactNode } from "react";
import { useSearch } from "@/app/context/SearchContext";

interface Form {
  _id: string;
  formName: string;
  formType: string;
  file: string;
  fileName?: string;
  action: string;
}

interface Column {
  accessorKey: keyof Form;
  header: ReactNode;
  width: string;
}

const columns: Column[] = [
  {
    accessorKey: "formName",
    header: "Form Name",
    width: "30%",
  },
  {
    accessorKey: "formType",
    header: "Form Type",
    width: "30%",
  },
  {
    accessorKey: "file",
    header: <div className="text-center">File</div>,
    width: "30%",
  },
  {
    accessorKey: "action",
    header: <div className="text-center">Actions</div>,
    width: "10%",
  },
];

// This component handles the data filtering using search params
// Wrapped in its own client component to isolate useSearchParams
const FormList = () => {
  const searchParams = useSearchParams();
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const { toast } = useToast();

  const { forms, loading, error, deleteForm } = useForms();
  const { searchQuery } = useSearch();

  

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-6 h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  const formTypeFilter = searchParams.get("type");
  const filteredForms = formTypeFilter 
    ? forms.filter((form: Form) => form.formType === formTypeFilter)
    : forms;


    const filteredSearchForms = filteredForms.filter((form: Form) => {
      if (!searchQuery) return true;
      return form.formName.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const handleDeleteForm = () => {
    if (selectedForm) {
      deleteForm({ variables: { formId: selectedForm._id } });
      toast({
        description: "Form deleted successfully",
      });
      setModalOpenDelete(false);
    }
  };

  const renderFile = (file: string, fileName?: string): ReactNode => {
    return (
      <div className="w-full flex justify-center items-center gap-2">
        <div className="w-[48px] h-[46px] flex items-center justify-center rounded-[16px] border border-[#00000033] bg-[#F3F3F3] hover:bg-[#E3E3E3] hover:scale-105 transition-all duration-200">
          <a
            href={file}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center"
            title={fileName || "Download PDF"}
          >
            <Image
              src={pdf}
              alt={fileName || "PDF file"}
              width={14}
              height={14}
              className="cursor-pointer"
            />
          </a>
        </div>
        {fileName && (
          <span className="px-4 py-4 font-[500] text-[#000000] text-[0.95vw] truncate max-w-[200px]" title={fileName}>
            {fileName}
          </span>
        )}
      </div>
    );
  };

  const renderAction = (item: Record<string, any>): ReactNode => {
    const formItem = item as Form;
    return (
      <div className="w-full text-right flex justify-end">
        <div className="flex gap-3">
          <button
            className="w-[48px] h-[46px] flex items-center justify-center rounded-[16px] border border-[#00000033] bg-[#F3F3F3] hover:bg-[#E3E3E3] hover:scale-105 transition-all duration-200"
            onClick={() => {
              setSelectedForm(formItem);
              setModalOpenEdit(true);
            }}
          >
            <Pencil className="h-[16px] w-[16px] text-[#323232]" />
          </button>

          <button
            className="w-[48px] h-[46px] flex items-center justify-center rounded-[16px] border border-[#00000033] bg-[#F3F3F3] hover:bg-[#E3E3E3] hover:scale-105 transition-all duration-200"
            onClick={() => {
              setSelectedForm(formItem);
              setModalOpenDelete(true);
            }}
          >
            <Trash2 className="h-[16px] w-[16px] text-[#323232]" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Table
        columns={columns}
        data={filteredSearchForms}
        renderFile={renderFile}
        renderAction={renderAction}
      />
      
      {modalOpenEdit && selectedForm && (
        <UpdateForm
          form={selectedForm}
          open={modalOpenEdit}
          onClose={() => setModalOpenEdit(false)}
        />
      )}

      {modalOpenDelete && selectedForm && (
        <Warning
          open={modalOpenDelete}
          onClose={() => setModalOpenDelete(false)}
          data={selectedForm}
          description="Are you sure you want to delete this form?"
          onConfirm={handleDeleteForm}
        />
      )}
    </>
  );
};

// This isolates the FormList component that uses useSearchParams in its own Suspense boundary
const SuspendedFormList = () => {
  return (
    <Suspense fallback={<Loading />}>
      <FormList />
    </Suspense>
  );
};

// Main container component
const FormPage = () => {
  const [modalOpenCreate, setModalOpenCreate] = useState(false);

  const handleFormSuccess = () => {
    setModalOpenCreate(false);
  };

  return (
    <div className="border rounded-b-[24px] overflow-hidden">
    
      
      <SuspendedFormList />
      
      <CreateForm onSuccess={handleFormSuccess} />
    </div>
  );
};

export default FormPage;
