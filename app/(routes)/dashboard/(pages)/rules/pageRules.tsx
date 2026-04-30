"use client";

import React, { useState } from "react";
import Table from "@/app/(routes)/_components/data_table";
import { Pencil, Trash2 } from "lucide-react";
import ActionIcons from "@/app/(routes)/_components/actions_ buttons";
import Image from "next/image";
import { pdf } from "@/assets";
import { RULES, useRules } from "@/service/rulesService";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/skeleton";
import Warning from "@/components/warning";
import UpdateRule from "./update_rule";
import { format } from "date-fns";
import { useSearch } from "@/app/context/SearchContext";

interface Rules {
  constitutionRules: string;
  amendedDate: string;
  file: string;
  action: string;
}

interface Column {
  accessorKey: keyof Rules;
  header: React.ReactNode;
  width: string;
}

const columns: Column[] = [
  {
    accessorKey: "constitutionRules",
    header: "Constitution Rules",
    width: "40%",
  },
  {
    accessorKey: "amendedDate",
    header: "Amended",
    width: "20%",
  },
  {
    accessorKey: "file",
    header: <div className="text-center">File</div> ,
    width: "30%",
  },
  {
    accessorKey: "action",
    header: <div className="text-center">Actions</div>,
    width: "10%",
  },
];

const PageRules = () => {
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RULES | null>(null);
  const { toast } = useToast();

  const { rules, loading, error, deleteRule } = useRules();
  const { searchQuery } = useSearch();

  const filteredRules = rules.filter((rule: RULES) => {
    if (!searchQuery) return true;
    return rule.constitutionRules.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDeleteRule = () => {
    if (selectedRule) {
      deleteRule({ variables: { rulesId: selectedRule._id } });
      toast({
        description: `Rule deleted successfully`,
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
        data={filteredRules}
        renderAction={(rule: any) => {
          // Pass icons directly as propsd
          const icons = [
            <Pencil
              className="w-[24px] h-[15px] text-[#323232]"
              key="edit"
              onClick={() => {
                setSelectedRule(rule);
                setModalOpenEdit(true);
              }}  
            />,
            <Trash2
              className="w-[24px] h-[14px] text-[#323232]"
              key="delete"
              onClick={() => {
                setSelectedRule(rule);
                setModalOpenDelete(true);
              }}
            />,
          ];

          return <div className="flex justify-center"><ActionIcons icons={icons} /></div>;
        }}
        renderFile={(file, fileName) => {
          return (
            <div className="flex gap-x-4 items-center pl-2 max-w-full overflow-hidden">
              {fileName && (
                <div className="border min-w-[48px] h-[48px] flex items-center justify-center rounded-full">
                  <Image
                    width={19}
                    height={24}
                    src={pdf}
                    alt="PDF Icon"
                    className="w-[14px] h-[14px] text-[#323232]"
                  />
                </div>
              )}

              <a
                href={file}
                download={fileName}
                className="hover:underline truncate"
                target="_blank"
                rel="noopener noreferrer"
              >
                {fileName ? fileName : file}
              </a>
            </div>
          );
        }}
        renderAmmendedDate={({ date }: { date: string }) => {
          const parseDate = (dateString: string): Date | null => {
            if (!dateString) return null;
            
            const parts = dateString.split("-");
            if (parts.length !== 3) return null;
            
            const [day, month, year] = parts.map(Number);
            
            // Validate the numbers
            if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
            if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;
            
            const parsedDate = new Date(year, month - 1, day); // JavaScript months are 0-indexed
            
            // Verify the date is valid by checking if it matches what we expected
            if (parsedDate.getFullYear() !== year || 
                parsedDate.getMonth() !== month - 1 || 
                parsedDate.getDate() !== day) {
              return null;
            }
            
            return parsedDate;
          };
          
          const parsedDate = parseDate(date);

          // Return error message if date parsing failed
          if (!parsedDate) {
            console.error("Invalid date format:", date);
            return <div className="text-red-500">Invalid Date</div>;   
          }

          return (
            <div className="flex items-start">
              {format(parsedDate, "d MMMM")}
            </div>
          );
        }}
      />

      {modalOpenEdit && selectedRule && (
        <UpdateRule
          open={modalOpenEdit}
          onClose={() => setModalOpenEdit(false)}
          rule={selectedRule}
        />
      )}

      {modalOpenDelete && selectedRule && (
        <Warning
          open={modalOpenDelete}
          onClose={() => setModalOpenDelete(false)}
          data={selectedRule}
          description="Are you sure you want to delete this rule?"
          onConfirm={handleDeleteRule}
        />
      )}
    </div>
  );
};

export default PageRules;
