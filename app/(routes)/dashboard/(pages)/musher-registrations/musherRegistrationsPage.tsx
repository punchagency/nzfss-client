"use client";

import { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import Table from "@/app/(routes)/_components/data_table";
import ActionIcons from "@/app/(routes)/_components/actions_ buttons";
import { Check, X } from "lucide-react";
import { Loading } from "@/components/skeleton";
import { useToast } from "@/hooks/use-toast";
import Warning from "@/components/warning";
import { useSearch } from "@/app/context/SearchContext";

const GET_MUSHER_REGISTRATIONS = gql`
  query GetMusherRegistrations {
    forms(formType: "Musher Registration Form", status: "pending") {
      _id
      formName
      applicantName
      formType
      status
      createdAt
      dogs {
        petName
        isDeceased
      }
      club {
        name
      }
    }
  }
`;

const APPROVE_REGISTRATION = gql`
  mutation ApproveRegistration($id: ID!) {
    approveForm(id: $id) {
      _id
      status
    }
  }
`;

const DECLINE_REGISTRATION = gql`
  mutation DeclineRegistration($id: ID!) {
    declineForm(id: $id) {
      _id
      status
    }
  }
`;

interface MusherRegistration {
  _id: string;
  formName: string;
  applicantName: string;
  formType: string;
  status: string;
  createdAt: string;
  dogs: Array<{ petName: string; isDeceased: boolean }>;
  club: { name: string };
  action: string;  // Added for the UI
}

const MusherRegistrationsPage = () => {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState<boolean>(false);
  const [isApproveWarningOpen, setIsApproveWarningOpen] = useState<boolean>(false);

  const { data, loading, error, refetch } = useQuery(GET_MUSHER_REGISTRATIONS);

  const [approveRegistration] = useMutation(APPROVE_REGISTRATION, {
    onCompleted: () => {
      toast({
        title: "Registration approved successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error approving registration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [declineRegistration] = useMutation(DECLINE_REGISTRATION, {
    onCompleted: () => {
      toast({
        title: "Registration declined successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error declining registration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApproveClick = (id: string) => {
    setSelectedRegistrationId(id);
    setIsApproveWarningOpen(true);
  };

  const handleDeclineClick = (id: string) => {
    setSelectedRegistrationId(id);
    setIsDeleteWarningOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (selectedRegistrationId) {
      await approveRegistration({ variables: { id: selectedRegistrationId } });
      setIsApproveWarningOpen(false);
    }
  };

  const handleDeclineConfirm = async () => {
    if (selectedRegistrationId) {
      await declineRegistration({ variables: { id: selectedRegistrationId } });
      setIsDeleteWarningOpen(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <p>Error loading musher registrations: {error.message}</p>;

  const registrations = data?.forms || [];

  // Transform the data for the table
  const tableData = registrations.map((reg: MusherRegistration) => {
    // Count active dogs (not deceased)
    const activeDogs = reg.dogs ? reg.dogs.filter(dog => !dog.isDeceased).length : 0;
    
    return {
      ...reg,
      formattedDate: new Date(reg.createdAt).toLocaleDateString(),
      clubName: reg.club?.name || "Not specified",
      activeDogs: activeDogs
    };
  }).filter((reg: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      reg.applicantName.toLowerCase().includes(query) ||
      reg.clubName.toLowerCase().includes(query)
    );
  });

  const renderAction = (registration: any) => {
    return (
      <ActionIcons
        icons={[
          <Check 
            key="approve"
            className="h-4 w-4 text-green-500" 
            onClick={() => handleApproveClick(registration._id)}
          />,
          <X 
            key="decline"
            className="h-4 w-4 text-red-500" 
            onClick={() => handleDeclineClick(registration._id)}
          />
        ]}
      />
    );
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "applicantName",
    },
    {
      header: "Club",
      accessorKey: "clubName",
    },
    {
      header: "Active Dogs",
      accessorKey: "activeDogs",
    },
    {
      header: "Submission Date",
      accessorKey: "formattedDate",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ cell }: { cell: { getValue: () => string } }) => (
        <span className="capitalize">{cell.getValue()}</span>
      ),
    },
    {
      header: "Action",
      accessorKey: "action",
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Musher Registration Requests</h1>
      </div>

      <Table columns={columns} data={tableData} renderAction={renderAction} />

      {/* Approve Warning Modal */}
      <Warning
        open={isApproveWarningOpen}
        onClose={() => setIsApproveWarningOpen(false)}
        onConfirm={handleApproveConfirm}
        description="Are you sure you want to approve this musher registration?"
      />

      {/* Decline Warning Modal */}
      <Warning
        open={isDeleteWarningOpen}
        onClose={() => setIsDeleteWarningOpen(false)}
        onConfirm={handleDeclineConfirm}
        description="Are you sure you want to decline this musher registration?"
      />
    </div>
  );
};

export default MusherRegistrationsPage; 