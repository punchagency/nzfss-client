"use client";

import ActionIcons from "@/app/(routes)/_components/actions_ buttons";
import { Trash2 } from "lucide-react";
import Table from "@/app/(routes)/_components/data_table";
import { useYearbooks, Yearbook } from "../../../../../service/yearbookService";
import { Loading } from "@/components/skeleton";
import Image from "next/image";
import { pdf } from "@/assets";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Warning from "@/components/warning";
import UpdateYearbook from "./update_yearbook";
import { useSearch } from "@/app/context/SearchContext";

interface YearBook {
  yearbook: string; // This will be the URL of the yearbook
  yearPublish: string;
  action: string;
}

interface Column {
  accessorKey: keyof YearBook;
  header: React.ReactNode;
  width: string;
}

const columns: Column[] = [
  {
    accessorKey: "yearbook",
    header: "Yearbook",
    width: "40%",
  },
  {
    accessorKey: "yearPublish",
    header: <div className="text-center">Year Published</div>,
    width: "50%",
  },
  {
    accessorKey: "action",
    header: <div className="text-center">Actions</div>,
    width: "10%",
  },
];

const YearbookPage = () => {
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [selectedYearbook, setSelectedYearbook] = useState<Yearbook | null>(
    null
  );
  const { toast } = useToast();
  const { yearbooks, loading, error, deleteYearbook } = useYearbooks();
  const { searchQuery } = useSearch();

  const filteredYearbooks = yearbooks.filter((yearbook: Yearbook) => {
    if (!searchQuery) return true;
    console.log(yearbook, "yearbook.yearbook");
    console.log(searchQuery);
    console.log(yearbook.yearbookName.toLowerCase().includes(searchQuery.toLowerCase()));
    return yearbook.yearbookName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDeleteYearbook = () => {
    if (selectedYearbook) {
      deleteYearbook({ variables: { yearbookId: selectedYearbook._id } });
      toast({
        description: `Club deleted successfully`,
      });
      setModalOpenDelete(false);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-6 h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="border rounded-b-[24px] overflow-hidden">
      <Table
        columns={columns}
        data={filteredYearbooks}
        renderAction={(yearbook: any) => {
          const icons = [
            <Trash2
              className="w-[14px] h-[14px] text-[#323232]"
              key="trash"
              onClick={() => {
                setSelectedYearbook(yearbook);
                setModalOpenDelete(true);
              }}
            />,
          ];
          return <ActionIcons icons={icons} />;
        }}
        // Custom rendering for the yearbook column
        renderYearbook={(yearbookName, yearbook) => {
          return (
            <div className="flex gap-x-4 items-center">
              <div className="border w-[48px] h-[48px] flex items-center justify-center rounded-full">
                <Image
                  width={19}
                  height={24}
                  src={pdf}
                  alt="PDF Icon"
                  className="w-[14px] h-[14px] text-[#323232]"
                />
              </div>
              <a
                href={yearbook}
                download={yearbookName}
                className="mr-2 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  const link = document.createElement("a");
                  link.href = yearbook;
                  link.download = yearbookName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                {yearbookName}
              </a>
            </div>
          );
        }}
      />

      {modalOpenEdit && selectedYearbook && (
        <UpdateYearbook
          open={modalOpenEdit}
          onClose={() => setModalOpenEdit(false)}
          yearbook={selectedYearbook}
        />
      )}

      {modalOpenDelete && selectedYearbook && (
        <Warning
          open={modalOpenDelete}
          onClose={() => setModalOpenDelete(false)}
          data={selectedYearbook}
          description="Are you sure you want to delete this yearbook?"
          onConfirm={handleDeleteYearbook}
        />
      )}
    </div>
  );
};

export default YearbookPage;
