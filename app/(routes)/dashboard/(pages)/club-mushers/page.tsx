"use client";

import { Button } from "@/components/ui/button";
import {
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { gql, useQuery, ApolloError, useMutation } from "@apollo/client";
import { MUSHER_DOG_FIELDS } from "@/lib/graphql/musher";
import { useState, useEffect } from "react";
import { useUser } from "@/context/user_context";
import { Filter, ChevronDown, X, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import copy_replace from "@/assets/copy_replace.svg";
import { useSearch } from "@/app/context/SearchContext";


/**
 * GraphQL query to fetch all clubs
 */
const GET_ALL_CLUBS = gql`
    query GetAllClubs {
        getAllClubs {
            _id
            name
        }
    }
`;

/**
 * GraphQL query to fetch all club mushers
 */
const GET_CLUB_MUSHERS = gql`
    query GetClubMushers($clubId: String) {
        getClubMushers(clubId: $clubId) {
            id
            name
            registrationNo
            kennelRegistrationNo
            club
            address
            phone
            email
            dateOfBirth
            guardianDetails
            dogs {
                ${MUSHER_DOG_FIELDS}
            }
        }
    }
`;

/**
 * GraphQL query to fetch all mushers
 */
const GET_MUSHERS = gql`
    query GetMushers {
        getMushers {
            id
            name
            registrationNo
            kennelRegistrationNo
            club
            address
            phone
            email
            dateOfBirth
            guardianDetails
            dogs {
                ${MUSHER_DOG_FIELDS}
            }
        }
    }
`;

/**
 * Interface defining the structure of a Dog
 */
interface Dog {
    dogId?: string;
    _id?: string;
    name: string;
    pedigreeName?: string;
    nzkcNo?: string;
    nzfssNo?: string;
    dateOfBirth?: string;
    dob?: string;
    breed?: string;
    deceased: boolean;
}

/**
 * Interface defining the structure of a Club
 */
interface Club {
    _id: string;
    name: string;
}

/**
 * Interface defining the structure of a Musher
 */
interface Musher {
    id: string;
    name: string;
    registrationNo: string;
    kennelRegistrationNo: string;
    club?: string;
    address?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    guardianDetails?: string;
    dogs: Dog[];
}

/**
 * Interface for the GraphQL query responses
 */
interface ClubMushersData {
    getClubMushers: Musher[];
}

interface ClubsData {
    getAllClubs: Club[];
}

interface AllMushersData {
    getMushers: Musher[];
}

/**
 * Interface for the GraphQL query variables
 */
interface ClubMushersVars {
    clubId?: string;
}

// Add mutations after existing queries
const DELETE_MUSHER = gql`
    mutation DeleteMusher($id: ID!) {
        deleteMusher(id: $id)
    }
`;

const UPDATE_MUSHER = gql`
    mutation UpdateMusher($id: ID!, $input: UpdateMusherInput!) {
        updateMusher(id: $id, input: $input) {
            id
            name
            registrationNo
            kennelRegistrationNo
            club
            address
            phone
            email
            dateOfBirth
            guardianDetails
            dogs {
                ${MUSHER_DOG_FIELDS}
            }
            createdAt
            updatedAt
        }
    }
`;

/**
 * ClubMushers component displays a list of mushers in a table format
 * with options to filter by club and perform actions on each musher
 */
export default function ClubMushers() {
    const { user } = useUser();
    const [selectedClubId, setSelectedClubId] = useState<string>("");
    const [editingMusher, setEditingMusher] = useState<Musher | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [musherToDelete, setMusherToDelete] = useState<Musher | null>(null);
    const { searchQuery } = useSearch(); 

    // Add sorting state
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [formData, setFormData] = useState({
        name: "",
        registrationNo: "",
        kennelRegistrationNo: "",
        address: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        guardianDetails: "",
        dogs: [] as Dog[]
    });

    // Fetch clubs data
    const { data: clubsData, loading: clubsLoading, error: clubsError } = useQuery<ClubsData>(GET_ALL_CLUBS);

    // Fetch all mushers by default
    const { data: mushersData, loading: mushersLoading, error: mushersError } = useQuery<AllMushersData>(
        GET_MUSHERS,
        {
            onCompleted: (data) => {
                console.log("All mushers data received:", data);
            },
            onError: (error: ApolloError) => {
                console.error("Error fetching mushers:", error);
            }
        }
    );

    // Fetch filtered mushers when a club is selected
    const { data: clubMushersData, loading: clubMushersLoading, error: clubMushersError } = useQuery<ClubMushersData, ClubMushersVars>(
        GET_CLUB_MUSHERS,
        {
            variables: selectedClubId ? { clubId: selectedClubId } : {},
            skip: !selectedClubId,
            onCompleted: (data) => {
                console.log("Club mushers data received:", data);
            },
            onError: (error: ApolloError) => {
                console.error("Error fetching club mushers:", error);
            }
        }
    );

    // Use either club mushers or all mushers based on selection
    const mushers = selectedClubId 
        ? (clubMushersData?.getClubMushers || []) 
        : (mushersData?.getMushers || []);
    const isLoading = clubsLoading || (selectedClubId ? clubMushersLoading : mushersLoading);
    const error = clubsError || (selectedClubId ? clubMushersError : mushersError);

    // Add sorting function
    const toggleSortDirection = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const getFilteredMushers = () => {
        if (!mushers.length) return [];
        
        let filtered = mushers;
        
        // Apply search filter if search query exists
        if (searchQuery && searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = mushers.filter((musher: Musher) => 
                (musher.name || '').toLowerCase().includes(query) ||
                (musher.registrationNo || '').toLowerCase().includes(query) ||
                (musher.kennelRegistrationNo || '').toLowerCase().includes(query) ||
                musher.dogs.some(dog => (dog.name || '').toLowerCase().includes(query))
            );
        }
        
        // Apply sorting by name
        const sorted = [...filtered].sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            
            if (sortDirection === 'asc') {
                return nameA.localeCompare(nameB);
            } else {
                return nameB.localeCompare(nameA);
            }
        });
        
        return sorted;
    };

    // Get filtered mushers
    const filteredMushers = getFilteredMushers();

    // Function to get appropriate "no results" message
    const getNoMushersMessage = () => {
        if (searchQuery && searchQuery.trim() !== '') {
            return `No mushers found matching "${searchQuery}"${selectedClubId ? ' in the selected club' : ''}`;
        }
        return selectedClubId ? "No mushers found in this club" : "No mushers found";
    };

    // Add mutation hooks
    const [deleteMusher] = useMutation(DELETE_MUSHER, {
        refetchQueries: ['GetMushers', 'GetClubMushers'],
        onError: (error) => {
            console.error('Error deleting musher:', error);
        }
    });

    const [updateMusher] = useMutation(UPDATE_MUSHER, {
        refetchQueries: ['GetMushers', 'GetClubMushers'],
        onCompleted: () => {
            setEditDialogOpen(false);
            setEditingMusher(null);
        },
        onError: (error) => {
            console.error('Error updating musher:', error);
        }
    });

    const handleDelete = async (musher: Musher) => {
        setMusherToDelete(musher);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (musherToDelete) {
            try {
                await deleteMusher({
                    variables: { id: musherToDelete.id }
                });
                setDeleteDialogOpen(false);
                setMusherToDelete(null);
            } catch (error) {
                console.error('Error deleting musher:', error);
            }
        }
    };

    const handleEdit = (musher: Musher) => {
        setEditingMusher(musher);
        setFormData({
            name: musher.name || '',
            registrationNo: musher.registrationNo || '',
            kennelRegistrationNo: musher.kennelRegistrationNo || '',
            address: musher.address || '',
            phone: musher.phone || '',
            email: musher.email || '',
            dateOfBirth: musher.dateOfBirth || '',
            guardianDetails: musher.guardianDetails || '',
            dogs: musher.dogs.map(dog => ({
                dogId: dog.dogId || dog._id,
                _id: dog.dogId || dog._id,
                name: dog.name || '',
                pedigreeName: dog.pedigreeName || '',
                nzkcNo: dog.nzkcNo || '',
                nzfssNo: dog.nzfssNo || '',
                dob: dog.dateOfBirth || '',
                breed: dog.breed || '',
                deceased: dog.deceased || false
            }))
        });
        setEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingMusher) return;
        try {
            // Clean up the dogs data by removing __typename and any undefined fields
            const cleanedDogs = formData.dogs.map(dog => ({
                dogId: dog.dogId || dog._id || undefined,
                _id: dog.dogId || dog._id || undefined,
                name: dog.name,
                pedigreeName: dog.pedigreeName || undefined,
                nzkcNo: dog.nzkcNo || undefined,
                nzfssNo: dog.nzfssNo || undefined,
                dateOfBirth: dog.dob || undefined,
                breed: dog.breed || undefined,
                deceased: dog.deceased
            }));

            // Filter out any undefined values
            const input = {
                name: formData.name || undefined,
                registrationNo: formData.registrationNo || undefined,
                kennelRegistrationNo: formData.kennelRegistrationNo || undefined,
                address: formData.address || undefined,
                phone: formData.phone || undefined,
                email: formData.email || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                guardianDetails: formData.guardianDetails || undefined,
                dogs: cleanedDogs.map(dog => {
                    type DogKey = keyof typeof dog;
                    const cleanDog = { ...dog };
                    (Object.keys(cleanDog) as DogKey[]).forEach(key => {
                        if (cleanDog[key] === undefined || cleanDog[key] === '') {
                            delete cleanDog[key];
                        }
                    });
                    return cleanDog;
                })
            };

            await updateMusher({
                variables: {
                    id: editingMusher.id,
                    input
                }
            });
        } catch (error) {
            console.error('Error updating musher:', error);
        }
    };

    // Add this useEffect to reset form data when dialogs close
    useEffect(() => {
        if (!editDialogOpen) {
            setEditingMusher(null);
            setFormData({
                name: '',
                registrationNo: '',
                kennelRegistrationNo: '',
                address: '',
                phone: '',
                email: '',
                dateOfBirth: '',
                guardianDetails: '',
                dogs: []
            });
        }
    }, [editDialogOpen]);

    // Handle loading state
    if (isLoading) {
        return (
            <div className="px-6 rounded-lg">
                <div className="bg-[#F8F9FA] rounded-t-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div className="min-h-[60px]">
                            <h1 className="text-2xl font-semibold text-gray-900">Club Mushers</h1>
                            <p className="font-[500] text-[#4F4F4F] text-[0.95vw] mt-1">Management of all Drivers.</p>
                        </div>
                        <div className="flex items-center gap-3 mr-8">
                            <div className="relative">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            className="flex items-center justify-between text-[0.833vw] text-[#696A6A] rounded-lg gap-3 w-[21.927vw] bg-[#F6F6F6] border-[#00000033] hover:bg-gray-200 transition-all duration-200 px-6 py-5 text-[15px] font-medium shadow-sm hover:shadow-md"
                                        >
                                            {selectedClubId ? (
                                                clubsData?.getAllClubs.find(club => club._id === selectedClubId)?.name || 'My Club'
                                            ) : (
                                                'Select Club'
                                            )}
                                            <ChevronDown className="h-5 w-5 text-gray-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[21.927vw] p-4 bg-white rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                                        <DropdownMenuLabel className="text-[1.1rem] font-semibold px-2 pb-2">Select Club</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-gray-200" />
                                        {user && (
                                            <DropdownMenuItem
                                                onClick={() => setSelectedClubId(user._id)}
                                                className="py-3 px-4 text-[1rem] font-medium hover:bg-gray-200 rounded-md cursor-pointer focus:bg-gray-50 my-1"
                                            >
                                                My Club
                                            </DropdownMenuItem>
                                        )}
                                        {clubsData?.getAllClubs.map((club) => (
                                            <DropdownMenuItem
                                                key={club._id}
                                                onClick={() => setSelectedClubId(club._id)}
                                                className="py-3 px-4 text-[1rem] font-medium hover:bg-gray-200 rounded-md cursor-pointer focus:bg-gray-50 my-1"
                                            >
                                                {club.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {selectedClubId && (
                                    <div
                                        onClick={() => setSelectedClubId("")}
                                        className="cursor-pointer p-1 hover:bg-gray-200 rounded-full transition-colors absolute right-12 top-1/2 transform -translate-y-1/2"
                                    >
                                        <X className="h-4 w-4 text-gray-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-b-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
                        <table className="w-full">
                                                    <thead className="sticky top-0 z-10">
                            <tr className="bg-black border-b border-gray-800">
                                    <th className="text-left p-4 font-[400] text-[0.95vw] text-white">
                                        <button
                                            onClick={toggleSortDirection}
                                            className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                                        >
                                            Name
                                            <ArrowUpDown className="h-4 w-4" />
                                        </button>
                                    </th>
                                    <th className="text-left p-4 font-[400] text-[0.95vw] text-white">NZFSS Registration No.</th>
                                    <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Kennel Registration No.</th>
                                    <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Dogs</th>
                                    <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8 text-gray-500">
                                            Loading mushers...
                                        </td>
                                    </tr>
                                ) : filteredMushers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8 text-gray-500">
                                            {getNoMushersMessage()}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMushers.map((musher: Musher) => (
                                            <tr key={musher.id} className="border-b border-gray-300 hover:bg-gray-200 transition-colors">
                                                <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{musher.name}</td>
                                                <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{musher.registrationNo}</td>
                                                <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{musher.kennelRegistrationNo}</td>
                                                <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                                                    {musher.dogs.length > 0 ? (
                                                        <div className="max-w-xs truncate">
                                                            {musher.dogs.map((dog: Dog) => dog.name).join(", ")}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">No dogs</span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        className="active:bg-gray-300 transform transition-transform duration-200 ease-in-out active:scale-95 border-[#CDCECE] hover:bg-gray-200 border h-[40px] w-[40px] rounded-[12px] flex items-center justify-center instant-anim"
                                                        title="Edit"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(musher);
                                                        }}
                                                    >
                                                        <Pencil className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="active:bg-gray-300 transform transition-transform duration-200 ease-in-out active:scale-95 border-[#CDCECE] hover:bg-gray-200 border h-[40px] w-[40px] rounded-[12px] flex items-center justify-center instant-anim"
                                                        title="Delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(musher);
                                                        }}
                                                    >
                                                        <Trash2 className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-red-600" />
                                                    </button>
                                                </div>
                                                </td>
                                            </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="container mx-auto p-4 -mt-32">
                <div className="p-6 text-red-500">
                    Error: {error.message || "An unknown error occurred"}
                </div>
            </div>
        );
    }

    const clubs = clubsData?.getAllClubs || [];

    return (
        <div className="container mx-auto px-6 -mt-[110px] rounded-lg">
            <div className="bg-[#F8F9FA] rounded-t-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start">
                    <div className="min-h-[60px]">
                        <h1 className="text-2xl font-semibold text-gray-900">Club Mushers</h1>
                        <p className="font-[500] text-[#4F4F4F] text-[0.95vw] mt-1">Management of all Drivers.</p>
                    </div>
                    <div className="flex items-center gap-3 mr-8">
                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        className="flex items-center justify-between text-[0.833vw] text-[#696A6A] rounded-lg gap-3 w-[21.927vw] bg-[#F6F6F6] border-[#00000033] hover:bg-gray-200 transition-all duration-200 px-6 py-5 text-[15px] font-medium shadow-sm hover:shadow-md"
                                    >
                                        {selectedClubId ? (
                                            clubs.find(club => club._id === selectedClubId)?.name || 'My Club'
                                        ) : (
                                            'Select Club'
                                        )}
                                        <ChevronDown className="h-5 w-5 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[21.927vw] p-4 bg-white rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                                    <DropdownMenuLabel className="text-[1.1rem] font-semibold px-2 pb-2">Select Club</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-gray-200" />
                                    {user && (
                                        <DropdownMenuItem
                                            onClick={() => setSelectedClubId(user._id)}
                                            className="py-3 px-4 text-[1rem] font-medium hover:bg-gray-200 rounded-md cursor-pointer focus:bg-gray-50 my-1"
                                        >
                                            My Club
                                        </DropdownMenuItem>
                                    )}
                                    {clubs.map((club) => (
                                        <DropdownMenuItem
                                            key={club._id}
                                            onClick={() => setSelectedClubId(club._id)}
                                            className="py-3 px-4 text-[1rem] font-medium hover:bg-gray-200 rounded-md cursor-pointer focus:bg-gray-50 my-1"
                                        >
                                            {club.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {selectedClubId && (
                                <div
                                    onClick={() => setSelectedClubId("")}
                                    className="cursor-pointer p-1 hover:bg-gray-200 rounded-full transition-colors absolute right-12 top-1/2 transform -translate-y-1/2"
                                >
                                    <X className="h-4 w-4 text-gray-500" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-b-lg overflow-hidden border border-gray-200 min-h-0">
                <div className="overflow-x-auto h-[75vh] max-h-[75vh] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-black border-b border-gray-800">
                                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">
                                    <button
                                        onClick={toggleSortDirection}
                                        className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                                    >
                                        Name
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">NZFSS Registration No.</th>
                                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Kennel Registration No.</th>
                                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Dogs</th>
                                <th className="text-right p-4 px-12 font-[400] text-[0.95vw] text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-500">
                                        Loading mushers...
                                    </td>
                                </tr>
                            ) : filteredMushers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-500">
                                        {getNoMushersMessage()}
                                    </td>
                                </tr>
                            ) : (
                                filteredMushers.map((musher: Musher) => (
                                        <tr key={musher.id} className="border-b border-gray-300 hover:bg-gray-200 transition-colors">
                                            <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{musher.name}</td>
                                            <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{musher.registrationNo}</td>
                                            <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{musher.kennelRegistrationNo}</td>
                                            <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                                                {musher.dogs.length > 0 ? (
                                                    <div className="max-w-xs truncate">
                                                        {musher.dogs.map((dog: Dog) => dog.name).join(", ")}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">No dogs</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        className="active:bg-gray-300 transform transition-transform duration-200 ease-in-out active:scale-95 border-[#CDCECE] hover:bg-gray-200 border h-[40px] w-[40px] rounded-[12px] flex items-center justify-center instant-anim"
                                                        title="Edit"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(musher);
                                                        }}
                                                    >
                                                        <Pencil className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="active:bg-gray-300 transform transition-transform duration-200 ease-in-out active:scale-95 border-[#CDCECE] hover:bg-gray-200 border h-[40px] w-[40px] rounded-[12px] flex items-center justify-center instant-anim"
                                                        title="Delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(musher);
                                                        }}
                                                    >
                                                        <Trash2 className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom padding */}
            <div className="h-8"></div>

            {/* Edit Dialog - Outside the table */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Musher</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="registrationNo">NZFSS Registration No.</Label>
                                <Input
                                    id="registrationNo"
                                    value={formData.registrationNo}
                                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="kennelRegistrationNo">Kennel Registration No.</Label>
                                <Input
                                    id="kennelRegistrationNo"
                                    value={formData.kennelRegistrationNo}
                                    onChange={(e) => setFormData({ ...formData, kennelRegistrationNo: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="guardianDetails">Guardian (if junior)</Label>
                                <Input
                                    id="guardianDetails"
                                    value={formData.guardianDetails}
                                    onChange={(e) => setFormData({ ...formData, guardianDetails: e.target.value })}
                                    placeholder="Full name and contact"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Dogs</Label>
                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                    {formData.dogs.map((dog, index) => (
                                        <div key={index} className="space-y-2 p-4 border rounded-md">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium">Dog {index + 1}</h4>
                                                {formData.dogs.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => {
                                                            const newDogs = [...formData.dogs];
                                                            newDogs.splice(index, 1);
                                                            setFormData({ ...formData, dogs: newDogs });
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Input
                                                    placeholder="Name"
                                                    value={dog.name}
                                                    onChange={(e) => {
                                                        const newDogs = [...formData.dogs];
                                                        newDogs[index] = { ...dog, name: e.target.value };
                                                        setFormData({ ...formData, dogs: newDogs });
                                                    }}
                                                />
                                                <Input
                                                    placeholder="Pedigree Name"
                                                    value={dog.pedigreeName || ""}
                                                    onChange={(e) => {
                                                        const newDogs = [...formData.dogs];
                                                        newDogs[index] = { ...dog, pedigreeName: e.target.value };
                                                        setFormData({ ...formData, dogs: newDogs });
                                                    }}
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        placeholder="NZKC No."
                                                        value={dog.nzkcNo || ""}
                                                        onChange={(e) => {
                                                            const newDogs = [...formData.dogs];
                                                            newDogs[index] = { ...dog, nzkcNo: e.target.value };
                                                            setFormData({ ...formData, dogs: newDogs });
                                                        }}
                                                    />
                                                    <Input
                                                        placeholder="NZFSS No."
                                                        value={dog.nzfssNo || ""}
                                                        onChange={(e) => {
                                                            const newDogs = [...formData.dogs];
                                                            newDogs[index] = { ...dog, nzfssNo: e.target.value };
                                                            setFormData({ ...formData, dogs: newDogs });
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        type="date"
                                                        placeholder="Date of Birth"
                                                        value={dog.dateOfBirth || ""}
                                                        onChange={(e) => {
                                                            const newDogs = [...formData.dogs];
                                                            newDogs[index] = { ...dog, dateOfBirth: e.target.value };
                                                            setFormData({ ...formData, dogs: newDogs });
                                                        }}
                                                    />
                                                    <Input
                                                        placeholder="Breed"
                                                        value={dog.breed || ""}
                                                        onChange={(e) => {
                                                            const newDogs = [...formData.dogs];
                                                            newDogs[index] = { ...dog, breed: e.target.value };
                                                            setFormData({ ...formData, dogs: newDogs });
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`deceased-${index}`}
                                                        checked={dog.deceased || false}
                                                        onChange={(e) => {
                                                            const newDogs = [...formData.dogs];
                                                            newDogs[index] = { ...dog, deceased: e.target.checked };
                                                            setFormData({ ...formData, dogs: newDogs });
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                    <Label htmlFor={`deceased-${index}`}>Deceased</Label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full sticky bottom-0 bg-white"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                dogs: [
                                                    ...formData.dogs,
                                                    {
                                                        _id: undefined,
                                                        name: "",
                                                        pedigreeName: "",
                                                        nzkcNo: "",
                                                        nzfssNo: "",
                                                        dateOfBirth: "",
                                                        dob: "",
                                                        breed: "",
                                                        deceased: false
                                                    }
                                                ]
                                            });
                                        }}
                                    >
                                        Add Dog
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setEditDialogOpen(false);
                                setEditingMusher(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate}>
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog - Outside the table */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg">
                    <div className="flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#FFF9E7] flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FFB020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 8V12" stroke="#FFB020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 16H12.01" stroke="#FFB020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <DialogTitle className="text-lg font-semibold">Warning</DialogTitle>
                        <div className="py-2">
                            <p className="text-gray-600">Are you sure you want to delete this musher?</p>
                        </div>
                        <div className="flex justify-center gap-3 w-full">
                            <Button 
                                variant="outline" 
                                onClick={() => setDeleteDialogOpen(false)}
                                className="flex-1 max-w-[120px] bg-white"
                            >
                                No
                            </Button>
                            <Button 
                                onClick={confirmDelete}
                                className="flex-1 max-w-[120px] bg-black text-white hover:bg-black/90"
                            >
                                Yes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
