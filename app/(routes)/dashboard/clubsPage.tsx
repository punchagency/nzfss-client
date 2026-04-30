"use client";

import Table from "@/app/(routes)/_components/data_table";
import ActionIcons from "@/app/(routes)/_components/actions_ buttons";
import { Pencil, Trash2 } from "lucide-react";
import { Loading } from "@/components/skeleton";
import { useClubs } from "@/service/ClubService";
import { useState } from "react";
import UpdateClubTrigger from "./updateTrigger";
import Warning from "@/components/warning";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/app/context/SearchContext";

interface Club {
    _id: string;
  name: string;
  email: string;
  action: string;
}

interface Column {
  accessorKey: keyof Club;
  header: React.ReactNode;
  width: string;
}

const columns: Column[] = [
  {
    accessorKey: "name",
    header: "Club Name",
    width: "80%",
  },
  {
    accessorKey: "action",
    header: <div className="text-center">Actions</div>,
    width: "10%",
  },
];

const ClubsPage = () => { 
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const { toast } = useToast();

  const { clubs, loading, error, deleteClub } = useClubs();
  const { searchQuery } = useSearch();

  const filteredClubs = clubs.filter((club: Club) => {
    if (!searchQuery) return true;
    return club.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

    const handleDeleteClub = () => {
        if (selectedClub) {
          deleteClub({ variables: { clubId: selectedClub._id } });
          toast({

            description: `Club deleted successfully`
          })
          setModalOpenDelete(false); 
        }
      };

  // Loading State
  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-6 h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="border rounded-b-[24px] overflow-hidden">
        <Table
          columns={columns}
          data={filteredClubs}
          renderAction={(club: any) => {
            // Pass icons directly as props
            const icons = [
              <Pencil
                className=" w-[14px] h-[14px] text-[#323232]"
                key="pen"
                onClick={() => {
                    setSelectedClub(club);  // Set selected club data (including ID)
                    setModalOpenEdit(true);  // Open the modal
                  }}
              />,

              <Trash2
                className="w-[14px] h-[14px] text-[#323232]"
                key="trash"
                onClick={() => {
                    setSelectedClub(club);  // Set selected club data (including ID)
                    setModalOpenDelete(true);  // Open the modal
                  }}
              />,
            ];

            return <ActionIcons icons={icons} />;
          }}
        />
      </div>

      {/* Edit Club Modal */}
      {modalOpenEdit && selectedClub && (
        <UpdateClubTrigger
          open={modalOpenEdit}
          onClose={() => setModalOpenEdit(false)}
          club={selectedClub}
        />
      )}

      {/* Delete Club modal */}
      {modalOpenDelete && selectedClub && (
        <Warning 
          open={modalOpenDelete}
          onClose={() => setModalOpenDelete(false)}
          data={selectedClub}
          description="Are you sure you want to delete this club?"
          onConfirm={handleDeleteClub}
        />
      )}
      
    </div>
  );
};

export default ClubsPage;
