"use client";

import { Sidebar } from "@/app/(routes)/_components/sidebar";
import TopHeader  from "@/app/(routes)/_components/top_header";
import { useUser } from "@/context/user_context";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { useState, Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gql, useMutation, useQuery } from "@apollo/client";
import { CREATE_MUSHER, UPDATE_MUSHER, DELETE_MUSHER, MUSHER_DOG_FIELDS } from "@/lib/graphql/musher";
import * as yup from 'yup';
import Warning from "@/components/warning";
import { useSearch } from "@/app/context/SearchContext";
import ActionIcons from "../_components/actions_ buttons";

// Validation schema using Yup
const musherSchema = yup.object().shape({
  name: yup.string().required('Musher name is required'),
  registrationNo: yup.string().optional(),
  kennelRegistrationNo: yup.string().optional(),
  showProfileConsent: yup.boolean().optional().default(false),
  associatedDogs: yup.array().of(
    yup.object().shape({
      name: yup.string().optional(),
      pedigreeName: yup.string().optional(),
      nzkcNo: yup.string().optional(),
      nzfssNo: yup.string().optional(),
      dob: yup.string().optional().nullable(),
      breed: yup.string().optional().nullable(),
      deceased: yup.boolean().optional().default(false)
    })
  )
});

interface ModalProps {
    title: string;
    description: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    title,
    description,
    isOpen,
    onClose,
    children
}) => {
    const onChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onChange}>
            <DialogContent className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
                    <DialogDescription className="text-base">{description}</DialogDescription>
                </DialogHeader>
                <div className="overflow-x-auto">{children}</div>
            </DialogContent>
        </Dialog>
    );
};

interface Dog {
  dogId?: string;
  _id?: string;
  name: string;
  pedigreeName: string;
  nzkcNo: string;
  nzfssNo: string;
  dob: string;
  breed: string;
  deceased: boolean;
}

interface Musher {
  name: string;
  registrationNo: string;
  kennelRegistrationNo: string;
  address: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  guardianDetails: string;
  associatedDogs: Dog[];
  showProfileConsent: boolean;
}

const createEmptyMusher = (): Musher => ({
  name: '',
  registrationNo: '',
  kennelRegistrationNo: '',
  address: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  guardianDetails: '',
  associatedDogs: [{
    name: '',
    pedigreeName: '',
    nzkcNo: '',
    nzfssNo: '',
    dob: '',
    breed: '',
    deceased: false
  }],
  showProfileConsent: false
});

interface TopHeaderProps {
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    placeholder: string;
}

const GET_CLUB_MUSHERS_SAFE = gql`
  query GetClubMushers($clubId: String) {
    getClubMushers(clubId: $clubId) {
      id
      name
      registrationNo
      kennelRegistrationNo
      showProfileConsent
      address
      phone
      email
      dateOfBirth
      guardianDetails
      dogs {
        dogId
        _id
        name
        pedigreeName
        nzkcNo
        nzfssNo
        dateOfBirth
        breed
        deceased
      }
    }
    forms(status: "pending", clubId: $clubId) {
      _id
      formType
      formName
      applicantName
      surname
      firstName
      address
      club
      dateOfBirth
      phone
      email
      guardianDetails
      nzfssRegistrationNumber
      dogs {
        petName
        isDeceased
        nzfssNumber
        pedigreeName
        breed
        dateOfBirth
        nzkcRegistration
        nzkcOwner
      }
      showProfileConsent
      status
    }
  }
`;



const mockMushers = [
  {
    _id: "mock1",
    name: "John Smith",
    dogs: [{
      name: "Max",
      breed: "Husky",
      dateOfBirth: "2020-01-01",
      nzfssRegistration: "NZFSS-001"
    }],
    club: "club123",
    created_at: new Date().toISOString()
  },
  {
    _id: "mock2",
    name: "Jane Doe",
    dogs: [{
      name: "Luna",
      breed: "Malamute",
      dateOfBirth: "2021-02-15",
      nzfssRegistration: "NZFSS-002"
    }],
    club: "club123",
    created_at: new Date().toISOString()
  }
];

const APPROVE_FORM = gql`
  mutation ApproveForm($id: String!) {
    approveForm(id: $id) {
      _id
      status
      formType
      club
      affiliationFrom
      affiliationTo
      firstName
      surname
      applicantName
      address
      dateOfBirth
      phone
      email
      guardianDetails
      nzfssRegistrationNumber
      showProfileConsent
    }
  }
`;

const DECLINE_FORM = gql`
  mutation DeclineForm($id: String!) {
    declineForm(id: $id) {
      _id
      status
    }
  }
`;

const ManageClubMusher = () => {
    const { user } = useUser();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingMusherId, setDeletingMusherId] = useState<string | null>(null);
    const [newMusher, setNewMusher] = useState<Musher>(createEmptyMusher());
    const [isEditing, setIsEditing] = useState(false);
    const [editingMusherId, setEditingMusherId] = useState('');
    const [initialMusherState, setInitialMusherState] = useState<Musher>(createEmptyMusher());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [localMushers, setLocalMushers] = useState<any[]>([]);
    
    // Sorting state
    const [sortField, setSortField] = useState<'name' | 'registrationNo' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    
    const { data, loading, error, refetch } = useQuery(GET_CLUB_MUSHERS_SAFE, {
        variables: {
            clubId: user?._id
        },
        skip: !user?._id,
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'network-only', // Always fetch fresh data on subsequent requests
        notifyOnNetworkStatusChange: true,
        onError: (error) => {
            console.error("GraphQL Error:", error);
            setIsLoading(false);
        },
        onCompleted: (data) => {
            if (data?.getClubMushers) {
                setLocalMushers(data.getClubMushers);
            }
            setIsLoading(false);
        }
    });

    const [createMusher] = useMutation(CREATE_MUSHER, {
        refetchQueries: [
            {
                query: GET_CLUB_MUSHERS_SAFE,
                variables: { clubId: user?._id }
            }
        ],
        onCompleted: (data) => {
            if (data.createMusher) {
                // Musher created successfully
            }
        }
    });

    const [updateMusher] = useMutation(UPDATE_MUSHER, {
        refetchQueries: [
            {
                query: GET_CLUB_MUSHERS_SAFE,
                variables: { clubId: user?._id }
            }
        ],
        onCompleted: (data) => {
            if (data.updateMusher) {
                // Musher updated successfully
            }
        }
    });

    const [deleteMusher] = useMutation(DELETE_MUSHER, {
        refetchQueries: [
            {
                query: GET_CLUB_MUSHERS_SAFE,
                variables: { clubId: user?._id }
            }
        ],
        onCompleted: (data) => {
            if (data.deleteMusher) {
                // Musher deleted successfully
            }
        }
    });

    const { data: testData, error: testError } = useQuery(GET_CLUB_MUSHERS_SAFE, {
        variables: { clubId: user?._id },
        skip: !user?._id
    });



    const { searchQuery } = useSearch();

    const [approveForm] = useMutation(APPROVE_FORM, {
        refetchQueries: [
            {
                query: GET_CLUB_MUSHERS_SAFE,
                variables: { clubId: user?._id }
            }
        ]
    });

    const [declineForm] = useMutation(DECLINE_FORM, {
        refetchQueries: [
            {
                query: GET_CLUB_MUSHERS_SAFE,
                variables: { clubId: user?._id }
            }
        ]
    });

    useEffect(() => {
        if (testError) {
            console.error("GraphQL connection test failed:", testError);
        } else if (testData) {
            console.log("GraphQL connection successful:", testData);
        }
    }, [testData, testError]);



    useEffect(() => {
        // Log detailed information about the GraphQL response for debugging
        if (data) {
            console.log("GraphQL data received:", data);
        }
        if (error) {
            console.error("GraphQL error details:", error);
        }
    }, [data, error]);

    // Modify mushers definition to use local state
    const mushers = error ? mockMushers : (localMushers.length > 0 ? localMushers : data?.getClubMushers || mockMushers);
    


    const filteredMushers = useMemo(() => {
        if (!searchQuery) return mushers;
        return mushers.filter((musher: Musher) => 
            musher.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [mushers, searchQuery]);

    // Sorting functions
    const toggleSort = (field: 'name' | 'registrationNo') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Sort the filtered mushers
    const sortedMushers = useMemo(() => {
        if (!sortField) return filteredMushers;

        return [...filteredMushers].sort((a, b) => {
            let valueA = '';
            let valueB = '';

            if (sortField === 'name') {
                valueA = a.name || '';
                valueB = b.name || '';
            } else if (sortField === 'registrationNo') {
                valueA = a.registrationNo || '';
                valueB = b.registrationNo || '';
            }

            // Handle empty values - put them at the end
            if (!valueA && !valueB) return 0;
            if (!valueA) return 1;
            if (!valueB) return -1;

            const comparison = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredMushers, sortField, sortDirection]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors({});
        
        try {
            // Validate form data against schema
            await musherSchema.validate(newMusher, { abortEarly: false });
            
            const mutationInput = {
                name: newMusher.name.trim() || "Unnamed Musher",
                registrationNo: newMusher.registrationNo ? newMusher.registrationNo.trim() : "",
                kennelRegistrationNo: newMusher.kennelRegistrationNo || "",
                address: newMusher.address || "",
                phone: newMusher.phone || "",
                email: newMusher.email || "",
                dateOfBirth: newMusher.dateOfBirth || "",
                guardianDetails: newMusher.guardianDetails || "",
                clubId: user?._id,
                showProfileConsent: newMusher.showProfileConsent,
                dogs: newMusher.associatedDogs.map(dog => ({
                    dogId: dog.dogId || dog._id || undefined,
                    _id: dog.dogId || dog._id || undefined,
                    name: dog.name ? dog.name.trim() : "",
                    pedigreeName: dog.pedigreeName || "",
                    nzkcNo: dog.nzkcNo || "",
                    nzfssNo: dog.nzfssNo || "",
                    dateOfBirth: dog.dob || "",
                    breed: dog.breed || "",
                    deceased: dog.deceased || false
                }))
            };

            if (isEditing) {
                const result = await updateMusher({
                    variables: {
                        id: editingMusherId,
                        input: mutationInput
                    }
                });
                
                // Update the local state with the updated musher
                if (result.data?.updateMusher) {
                    setLocalMushers(prev => 
                        prev.map(musher => 
                            (musher._id === editingMusherId || musher.id === editingMusherId) 
                                ? result.data.updateMusher 
                                : musher
                        )
                    );
                }
            } else {
                const result = await createMusher({
                    variables: {
                        input: mutationInput
                    }
                });
                
                // Add the new musher to the local state
                if (result.data?.createMusher) {
                    setLocalMushers(prev => [...prev, result.data.createMusher]);
                }
            }

            setIsModalOpen(false);
            setNewMusher(createEmptyMusher());
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                // Transform validation errors into a more usable format
                const errorMap: Record<string, string> = {};
                error.inner.forEach((err) => {
                    if (err.path) {
                        errorMap[err.path] = err.message;
                    }
                });
                setValidationErrors(errorMap);
                console.log("Validation errors:", errorMap);
            } else {
                console.error("Error:", error);
                const message = error instanceof Error ? error.message : "An unknown error occurred";
                alert(`Operation failed: ${message}`);
            }
        }
    };

    const handleDogChange = (index: number, field: keyof Dog, value: string | boolean) => {
        const updatedDogs = [...newMusher.associatedDogs];
        updatedDogs[index] = { ...updatedDogs[index], [field]: value };
        setNewMusher({ ...newMusher, associatedDogs: updatedDogs });
    };

    const handleDelete = async (id: string) => {
        try {
            // Update local state immediately to give instant UI feedback
            setLocalMushers(prev => prev.filter(musher => (musher._id !== id && musher.id !== id)));
            
            // Then perform the actual deletion on the server
            await deleteMusher({
                variables: { id },
                // Keep the refetchQueries for data consistency after server response
                refetchQueries: [{ 
                    query: GET_CLUB_MUSHERS_SAFE,
                    variables: { clubId: user?._id }
                }]
            });
            setShowDeleteModal(false);
            setDeletingMusherId(null);
        } catch (error) {
            console.error("Error deleting musher:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            alert(`Failed to delete musher: ${message}`);
            
            // If the server deletion fails, revert the local state
            if (data?.getClubMushers) {
                setLocalMushers(data.getClubMushers);
            }
            setDeletingMusherId(null);
        }
    };

    const handleApproveForm = async (formId: string) => {
        try {
            const result = await approveForm({
                variables: { id: formId }
            });
            
            // Update local state immediately
            if (result.data?.approveForm) {
                const approvedForm = result.data.approveForm;
                const musherName = `${approvedForm.firstName} ${approvedForm.surname}`.trim();
                
                const mergeApprovedContact = (musher: any) => ({
                    ...musher,
                    registrationNo: approvedForm.nzfssRegistrationNumber || musher.registrationNo,
                    address: approvedForm.address || musher.address,
                    phone: approvedForm.phone || musher.phone,
                    email: approvedForm.email || musher.email,
                    dateOfBirth: approvedForm.dateOfBirth || musher.dateOfBirth,
                    guardianDetails: approvedForm.guardianDetails || musher.guardianDetails,
                    showProfileConsent: approvedForm.showProfileConsent
                });

                setLocalMushers(prev => {
                    return prev.map(musher => {
                        if (musher.name.toLowerCase().trim() === musherName.toLowerCase().trim()) {
                            return mergeApprovedContact(musher);
                        }
                        if (approvedForm.applicantName && musher.name.toLowerCase().trim() === approvedForm.applicantName.toLowerCase().trim()) {
                            return mergeApprovedContact(musher);
                        }
                        return musher;
                    });
                });
            }

            // Refetch to ensure data consistency
            setTimeout(async () => {
                try {
                    const freshResult = await refetch({ clubId: user?._id });
                    if (freshResult.data?.getClubMushers) {
                        setLocalMushers(freshResult.data.getClubMushers);
                    }
                } catch (refetchError) {
                    console.error("Error during refetch:", refetchError);
                }
            }, 1000);
        } catch (error) {
            console.error("Error approving form:", error);
            alert("Failed to approve form. Please try again.");
        }
    };

    const handleDeclineForm = async (formId: string) => {
        try {
            await declineForm({
                variables: { id: formId }
            });
        } catch (error) {
            console.error("Error declining form:", error);
            alert("Failed to decline form. Please try again.");
        }
    };

    // Create a function to reset the form
    const resetForm = () => {
        setNewMusher(createEmptyMusher());
        setValidationErrors({});
        setIsEditing(false);
        setEditingMusherId('');
    };

    // Use the resetForm function when closing the modal
    const handleCloseModal = () => {
        resetForm();
        setIsModalOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                        <TopHeader 
                            placeholder="Search mushers..."
                        />
                    </div>
                    <main className="flex-1 p-8 flex justify-center items-center overflow-hidden">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                            <p>Loading mushers data...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Add error display
    if (error && !mockMushers) {
        return (
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                        <TopHeader 
                            placeholder="Search mushers..."
                        />
                    </div>
                    <main className="flex-1 overflow-auto">
                        <div className="p-8">
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
                                <h3 className="font-bold">Error loading mushers</h3>
                                <p>{error.message}</p>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold">Club Mushers</h1>
                                    <p className="text-gray-600">Manage your club members and NZFSS registered.</p>
                                </div>
                                <button 
                                    className="bg-white text-black px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-200"
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        setIsEditing(false);
                                        setEditingMusherId('');
                                        setValidationErrors({});
                                        const emptyMusher = createEmptyMusher();
                                        setNewMusher(emptyMusher);
                                        setInitialMusherState(emptyMusher);
                                    }}
                                >
                                    + Add New Musher
                                </button>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <p>Using fallback data. Some features may be limited.</p>
                            </div>
                        </div>
                    </main>
                </div>
                
                <Modal
                    title="Club Mushers"
                    description="This information is all about registered mushers."
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {Object.keys(validationErrors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
                                <h3 className="font-bold">Please fix the following errors:</h3>
                                <ul className="list-disc pl-5 mt-2">
                                    {Object.entries(validationErrors).map(([field, error]) => (
                                        <li key={field}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div>
                            <label className="block mb-2 text-[1.1vw] font-[600]">
                                Musher Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                className={`w-full p-3 border rounded-lg text-base ${validationErrors['name'] ? 'border-red-500' : ''}`}
                                placeholder="Enter musher name"
                                value={newMusher.name}
                                onChange={(e) => setNewMusher({...newMusher, name: e.target.value})}
                            />
                            {validationErrors['name'] && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors['name']}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[1.1vw] font-[600] mb-2">
                                    NZFSS Registration No.
                                </label>
                                <input 
                                    type="text"
                                    className={`w-full p-3 border rounded-lg text-base ${validationErrors['registrationNo'] ? 'border-red-500' : ''}`}
                                    placeholder="Enter registration number"
                                    value={newMusher.registrationNo}
                                    onChange={(e) => setNewMusher({...newMusher, registrationNo: e.target.value})}
                                />
                                {validationErrors['registrationNo'] && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors['registrationNo']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[1.1vw] font-[600] mb-2">Kennel Registration No.</label>
                                <input 
                                    type="text"
                                    className="w-full p-3 border rounded-lg text-base"
                                    placeholder="Enter registration number"
                                    value={newMusher.kennelRegistrationNo}
                                    onChange={(e) => setNewMusher({...newMusher, kennelRegistrationNo: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-2">Address</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-lg text-base"
                                placeholder="Enter address"
                                value={newMusher.address}
                                onChange={(e) => setNewMusher({...newMusher, address: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[1.1vw] font-[600] mb-2">Phone</label>
                                <input
                                    type="tel"
                                    className="w-full p-3 border rounded-lg text-base"
                                    placeholder="Enter phone number"
                                    value={newMusher.phone}
                                    onChange={(e) => setNewMusher({...newMusher, phone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[1.1vw] font-[600] mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-3 border rounded-lg text-base"
                                    placeholder="Enter email address"
                                    value={newMusher.email}
                                    onChange={(e) => setNewMusher({...newMusher, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[1.1vw] font-[600] mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    className="w-full p-3 border rounded-lg text-base"
                                    value={newMusher.dateOfBirth}
                                    onChange={(e) => setNewMusher({...newMusher, dateOfBirth: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[1.1vw] font-[600] mb-2">Guardian (if junior)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg text-base"
                                    placeholder="Full name and contact"
                                    value={newMusher.guardianDetails}
                                    onChange={(e) => setNewMusher({...newMusher, guardianDetails: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-3">Associated Dogs</label>
                            <table className="w-full text-base border border-[#CDCECE] rounded-lg">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-3 text-left font-semibold">Name</th>
                                        <th className="p-3 text-left font-semibold">Pedigree Name</th>
                                        <th className="p-3 text-left font-semibold">NZKC No</th>
                                        <th className="p-3 text-left font-semibold">NZFSS No</th>
                                        <th className="p-3 text-left font-semibold">D.O.B <span className="text-gray-400 text-xs font-normal"></span></th>
                                        <th className="p-3 text-left font-semibold">Breed <span className="text-gray-400 text-xs font-normal"></span></th>
                                        <th className="p-3 text-left font-semibold">Deceased</th>
                                        <th className="p-3 text-center font-semibold">Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newMusher.associatedDogs.map((dog, index) => (
                                        <tr key={index}>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    className={`w-full p-2 border rounded-lg text-base ${validationErrors[`associatedDogs[${index}].name`] ? 'border-red-500' : ''}`}
                                                    placeholder="Dog Name"
                                                    value={dog.name}
                                                    onChange={(e) => handleDogChange(index, 'name', e.target.value)}
                                                />
                                                {validationErrors[`associatedDogs[${index}].name`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`associatedDogs[${index}].name`]}</p>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg text-base"
                                                    placeholder="Pedigree Name"
                                                    value={dog.pedigreeName}
                                                    onChange={(e) => handleDogChange(index, 'pedigreeName', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg text-base"
                                                    placeholder="NZKC No"
                                                    value={dog.nzkcNo}
                                                    onChange={(e) => handleDogChange(index, 'nzkcNo', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg text-base"
                                                    placeholder="NZFSS No"
                                                    value={dog.nzfssNo}
                                                    onChange={(e) => handleDogChange(index, 'nzfssNo', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="date"
                                                    className="w-full p-2 border rounded-lg text-base"
                                                    value={dog.dob}
                                                    placeholder="Optional"
                                                    onChange={(e) => handleDogChange(index, 'dob', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg text-base"
                                                    placeholder="Optional"
                                                    value={dog.breed}
                                                    onChange={(e) => handleDogChange(index, 'breed', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2 flex justify-center items-center h-full">
                                                <div className="flex items-center justify-center h-10">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 border rounded"
                                                        checked={dog.deceased}
                                                        onChange={(e) => handleDogChange(index, 'deceased', e.target.checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                <button 
                                                    type="button"
                                                    className={`text-gray-500 hover:text-red-500 ${newMusher.associatedDogs.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    onClick={() => {
                                                        if (newMusher.associatedDogs.length > 1) {
                                                            const updatedDogs = [...newMusher.associatedDogs];
                                                            updatedDogs.splice(index, 1);
                                                            setNewMusher({...newMusher, associatedDogs: updatedDogs});
                                                        }
                                                    }}
                                                    disabled={newMusher.associatedDogs.length <= 1}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button 
                                type="button"
                                className="text-blue-600 text-base mt-3 hover:text-blue-700"
                                onClick={() => setNewMusher({
                                    ...newMusher,
                                    associatedDogs: [...newMusher.associatedDogs, {
                                        name: "",
                                        pedigreeName: "",
                                        nzkcNo: "",
                                        nzfssNo: "",
                                        dob: "",
                                        breed: "",
                                        deceased: false
                                    }]
                                })}
                            >
                                + Add a New Dog
                            </button>
                        </div>
                        
                                                                
                    <div className="mt-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="h-5 w-5 border rounded mr-2"
                                checked={newMusher.showProfileConsent}
                                onChange={(e) => setNewMusher({...newMusher, showProfileConsent: e.target.checked})}
                            />
                            <span className="text-base">
                                I consent to have this profile shown on the club page
                            </span>
                        </label>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button"
                            className="px-6 py-3 border hover:bg-gray-200 rounded-lg text-base h"
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-3 bg-black text-white rounded-lg text-base"
                        >
                            Save
                        </button>
                    </div>
                    </form>
                </Modal>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0">
                    <TopHeader 
                        placeholder="Search mushers..."
                    />
                </div>
                <main className="flex-1 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                    <div className="px-8 py-6 flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="w-[57.76vw] h-[1.771vw] text-[1.458vw] font-[700] mb-2">Club Mushers</h1>
                                <p className="font-[500] text-[#4F4F4F] text-[0.95vw]">Manage your club members and NZFSS registered. These entries will be used for points calculation and NZFSS administrative tasks.</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => router.push('/manage-musher/pending-forms')}
                                    className="bg-white text-[0.95vw] font-[500] px-4 py-2 rounded-md border border-[#CDCECE] hover:bg-gray-200 flex items-center gap-2"
                                >
                                    Pending Forms
                                    {loading ? (
                                        <div className="px-2 py-0.5 rounded-full border border-gray-300 text-sm font-medium bg-gray-100 text-gray-600">
                                            ...
                                        </div>
                                    ) : error ? (
                                        <div className="px-2 py-0.5 rounded-full border border-gray-300 text-sm font-medium bg-yellow-100 text-yellow-800">
                                            !
                                        </div>
                                    ) : (
                                        <div className={`px-2 py-0.5 rounded-full border border-gray-300 text-sm font-medium ${(data?.forms?.length || 0) > 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            {data?.forms?.length || 0}
                                        </div>
                                    )}
                                </button>
                                <button 
                                    className="bg-white text-black px-4 py-2 w-[10vw] h-[2.5vw] rounded-lg rounded-md border border-[#CDCECE] hover:bg-gray-200 flex items-center gap-2 text-sm"
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        setIsEditing(false);
                                        setEditingMusherId("");
                                        setValidationErrors({});
                                        const emptyMusher = createEmptyMusher();
                                        setNewMusher(emptyMusher);
                                        setInitialMusherState(emptyMusher);
                                    }}
                                >
                                    <div className="text-[0.95vw] font-[500]">+ Add Musher</div>        
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto border-t border-gray-200">
                        <table className="w-full">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-black text-white font-[500] text-[0.97vw]">
                                    <th className="text-left px-8 py-4 font-medium">
                                        <div className="flex items-center gap-1">
                                            <span>Name</span>
                                            <button 
                                                onClick={() => toggleSort('name')}
                                                className="inline-flex items-center justify-center w-6 h-6 rounded hover:opacity-80 transition-opacity"
                                                title={`Sort by name (${sortField === 'name' && sortDirection === 'asc' ? 'Z-A' : 'A-Z'})`}
                                            >
                                                <ArrowUpDown className={`h-3 w-3 ${sortField === 'name' ? (sortDirection === 'asc' ? 'text-blue-400' : 'text-blue-600') : 'text-gray-400'}`} />
                                            </button>
                                        </div>
                                    </th>
                                    <th className="text-left px-8 py-4 font-medium">
                                        <div className="flex items-center gap-1">
                                            <span>NZFSS Registration No.</span>
                                            <button 
                                                onClick={() => toggleSort('registrationNo')}
                                                className="inline-flex items-center justify-center w-6 h-6 rounded hover:opacity-80 transition-opacity"
                                                title={`Sort by registration number (${sortField === 'registrationNo' && sortDirection === 'asc' ? 'Z-A' : 'A-Z'})`}
                                            >
                                                <ArrowUpDown className={`h-3 w-3 ${sortField === 'registrationNo' ? (sortDirection === 'asc' ? 'text-blue-400' : 'text-blue-600') : 'text-gray-400'}`} />
                                            </button>
                                        </div>
                                    </th>
                                    <th className="text-left px-8 py-4 font-medium">Associated Dogs</th>
                                    <th className="text-left px-8 py-4 font-medium">Profile Consent</th>
                                    <th className="text-right px-8 py-4 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-50 divide-y divide-gray-200">
                                {sortedMushers.map((musher: any) => {
                                    // Calculate associated dogs display
                                    const dogs = Array.isArray(musher.dogs) ? musher.dogs : [];
                                    const displayDogs = dogs.slice(0, 4).map((dog: any) => dog.name || "No Dogs").filter(Boolean);
                                    const remainingDogs = Math.max(0, dogs.length - 4);
                                    const dogsDisplay = displayDogs.join(", ") + (remainingDogs > 0 ? ` +${remainingDogs} More` : "");

                                    return (
                                        <tr key={musher._id || musher.id} className="border-gray-200">
                                            <td className="px-8 py-4 font-[500] text-[#000000] text-[0.95vw]">{musher.name || ""}</td>
                                            <td className="px-8 py-4 font-[500] text-[#000000] text-[0.95vw]">{musher.registrationNo || ""}</td>
                                            <td className="px-8 py-4 font-[500] text-[#000000] text-[0.95vw]">{dogsDisplay || ""}</td>
                                            <td className="px-8 py-4 font-[500] text-[#000000] text-[0.95vw]">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium px-8 py-4 font-[500] text-[#000000] text-[0.95vw]${
                                                    musher.showProfileConsent === true
                                                        ? 'bg-green-100 text-green-800' 
                                                        : musher.showProfileConsent === false
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {musher.showProfileConsent === true ? 'Yes' : musher.showProfileConsent === false ? 'No' : 'Not Set'}
                                                </span>
                                            </td>
                                            <td className="px-2  py-4 font-[500] text-[#000000] text-[0.95vw] text-right">
                              <ActionIcons
                                eventId={musher._id || musher.id}
                                event={{ clubId: user?._id }} // Pass user's club ID for permission checking
                                icons={[
                                  <Pencil
                                    onClick={() => {
                                      setIsEditing(true);
                                      setEditingMusherId(musher._id || musher.id);
                                      const safeMusher = {
                                        name: musher.name || "",
                                        registrationNo: musher.registrationNo || "",
                                        kennelRegistrationNo: musher.kennelRegistrationNo || "",
                                        address: musher.address || "",
                                        phone: musher.phone || "",
                                        email: musher.email || "",
                                        dateOfBirth: musher.dateOfBirth || "",
                                        guardianDetails: musher.guardianDetails || "",
                                        associatedDogs: Array.isArray(musher.dogs) ? musher.dogs.map((d: any) => ({
                                          dogId: d.dogId || d._id,
                                          _id: d.dogId || d._id,
                                          name: d.name || "",
                                          pedigreeName: d.pedigreeName || "",
                                          nzkcNo: d.nzkcNo || "",
                                          nzfssNo: d.nzfssNo || d.nzfssRegistration || "",
                                          dob: d.dateOfBirth || d.dob || "",
                                          breed: d.breed || "",
                                          deceased: !!d.deceased
                                        })) : [],
                                        showProfileConsent: musher.showProfileConsent === true ? true : false
                                      };
                                      setNewMusher(safeMusher);
                                      setInitialMusherState(safeMusher);
                                      setIsModalOpen(true);
                                    }}
                                    className="w-[14px] h-[14px] text-[#323232] cursor-pointer hover:text-blue-600 transition-colors duration-200"
                                    key="edit"
                                  />,
                                  <Trash2
                                    onClick={() => {
                                      setDeletingMusherId(musher._id || musher.id);
                                      setShowDeleteModal(true);
                                    }}
                                    className="w-[14px] h-[14px] text-[#323232] cursor-pointer hover:text-red-600 transition-colors duration-200"
                                    key="delete"
                                  />
                                ]}
                              />
                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="h-8"></div>
                    </div>
                </main>
            </div>

            <Modal
                title="Club Mushers"
                description="This information is all about registered mushers."
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {Object.keys(validationErrors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
                            <h3 className="font-bold">Please fix the following errors:</h3>
                            <ul className="list-disc pl-5 mt-2">
                                {Object.entries(validationErrors).map(([field, error]) => (
                                    <li key={field}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div>
                        <label className="block mb-2 text-[1.1vw] font-[600]">
                            Musher Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text"
                            className={`w-full p-3 border rounded-lg text-base ${validationErrors['name'] ? 'border-red-500' : ''}`}
                            placeholder="Enter musher name"
                            value={newMusher.name}
                            onChange={(e) => setNewMusher({...newMusher, name: e.target.value})}
                        />
                        {validationErrors['name'] && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors['name']}</p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-2">
                                NZFSS Registration No.
                            </label>
                            <input 
                                type="text"
                                className={`w-full p-3 border rounded-lg text-base ${validationErrors['registrationNo'] ? 'border-red-500' : ''}`}
                                placeholder="Enter registration number"
                                value={newMusher.registrationNo}
                                onChange={(e) => setNewMusher({...newMusher, registrationNo: e.target.value})}
                            />
                            {validationErrors['registrationNo'] && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors['registrationNo']}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-2">Kennel Registration No.</label>
                            <input 
                                type="text"
                                className="w-full p-3 border rounded-lg text-base"
                                placeholder="Enter registration number"
                                value={newMusher.kennelRegistrationNo}
                                onChange={(e) => setNewMusher({...newMusher, kennelRegistrationNo: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[1.1vw] font-[600] mb-2">Address</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-lg text-base"
                            placeholder="Enter address"
                            value={newMusher.address}
                            onChange={(e) => setNewMusher({...newMusher, address: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-2">Phone</label>
                            <input
                                type="tel"
                                className="w-full p-3 border rounded-lg text-base"
                                placeholder="Enter phone number"
                                value={newMusher.phone}
                                onChange={(e) => setNewMusher({...newMusher, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-2">Email</label>
                            <input
                                type="email"
                                className="w-full p-3 border rounded-lg text-base"
                                placeholder="Enter email address"
                                value={newMusher.email}
                                onChange={(e) => setNewMusher({...newMusher, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-2">Date of Birth</label>
                            <input
                                type="date"
                                className="w-full p-3 border rounded-lg text-base"
                                value={newMusher.dateOfBirth}
                                onChange={(e) => setNewMusher({...newMusher, dateOfBirth: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[1.1vw] font-[600] mb-2">Guardian (if junior)</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-lg text-base"
                                placeholder="Full name and contact"
                                value={newMusher.guardianDetails}
                                onChange={(e) => setNewMusher({...newMusher, guardianDetails: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[1.1vw] font-[600] mb-3">Associated Dogs</label>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border border-[#CDCECE] rounded-lg table-fixed">
                                <colgroup>
                                    <col className="w-[14%]" />
                                    <col className="w-[18%]" />
                                    <col className="w-[11%]" />
                                    <col className="w-[11%]" />
                                    <col className="w-[15%]" />
                                    <col className="w-[12%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[11%]" />
                                </colgroup>
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Pedigree Name</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">NZKC No</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">NZFSS No</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">D.O.B</th>
                                        <th className="px-2 py-2 text-left font-semibold text-gray-700">Breed</th>
                                        <th className="px-1 py-2 text-center font-semibold text-gray-700">Deceased</th>
                                        <th className="px-1 py-2 text-center font-semibold text-gray-700">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newMusher.associatedDogs.map((dog, index) => (
                                        <tr key={index} className="border-b border-gray-100">
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 ${validationErrors[`associatedDogs[${index}].name`] ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="Dog Name"
                                                    value={dog.name}
                                                    onChange={(e) => handleDogChange(index, 'name', e.target.value)}
                                                />
                                                {validationErrors[`associatedDogs[${index}].name`] && (
                                                    <p className="text-red-500 text-xs mt-1">{validationErrors[`associatedDogs[${index}].name`]}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    placeholder="Pedigree Name"
                                                    value={dog.pedigreeName}
                                                    onChange={(e) => handleDogChange(index, 'pedigreeName', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    placeholder="NZKC No"
                                                    value={dog.nzkcNo}
                                                    onChange={(e) => handleDogChange(index, 'nzkcNo', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    placeholder="NZFSS No"
                                                    value={dog.nzfssNo}
                                                    onChange={(e) => handleDogChange(index, 'nzfssNo', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="date"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    value={dog.dob}
                                                    onChange={(e) => handleDogChange(index, 'dob', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    placeholder="Breed"
                                                    value={dog.breed}
                                                    onChange={(e) => handleDogChange(index, 'breed', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-1 py-2">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                            dog.deceased 
                                                                ? 'bg-red-500' 
                                                                : 'bg-gray-300'
                                                        }`}
                                                        onClick={() => handleDogChange(index, 'deceased', !dog.deceased)}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                                                dog.deceased ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-1 py-2">
                                                <div className="flex justify-center">
                                                    <button 
                                                        type="button"
                                                        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${newMusher.associatedDogs.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-500'}`}
                                                        onClick={() => {
                                                            if (newMusher.associatedDogs.length > 1) {
                                                                const updatedDogs = [...newMusher.associatedDogs];
                                                                updatedDogs.splice(index, 1);
                                                                setNewMusher({...newMusher, associatedDogs: updatedDogs});
                                                            }
                                                        }}
                                                        disabled={newMusher.associatedDogs.length <= 1}
                                                        title={newMusher.associatedDogs.length <= 1 ? "At least one dog required" : "Remove dog"}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button 
                            type="button"
                            className="inline-flex items-center mt-3 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors font-medium"
                            onClick={() => setNewMusher({
                                ...newMusher,
                                associatedDogs: [...newMusher.associatedDogs, {
                                    name: "",
                                    pedigreeName: "",
                                    nzkcNo: "",
                                    nzfssNo: "",
                                    dob: "",
                                    breed: "",
                                    deceased: false
                                }]
                            })}
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add a New Dog
                        </button>
                    </div>
                    
                    <div className="mt-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="h-5 w-5 border rounded mr-2"
                                checked={newMusher.showProfileConsent}
                                onChange={(e) => setNewMusher({...newMusher, showProfileConsent: e.target.checked})}
                            />
                            <span className="text-base">
                                I consent to have this profile shown on the club page
                            </span>
                        </label>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <button 
                            type="button"
                            className="flex-1 py-4 border border-gray-300 hover:border-gray-400 hover:bg-gray-200 rounded-full text-base font-medium transition-colors"
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-4 border-gray-300 border hover:bg-black hover:text-white rounded-full text-base font-medium transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingMusherId && (
                <Warning
                    open={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeletingMusherId(null);
                    }}
                    data={{ id: deletingMusherId }}
                    description="Are you sure you want to delete this musher?"
                    onConfirm={() => handleDelete(deletingMusherId)}
                />
            )}
        </div>
    );
}

export default ManageClubMusher;

