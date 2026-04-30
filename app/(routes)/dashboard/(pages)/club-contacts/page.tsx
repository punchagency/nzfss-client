'use client'

import React, { useState, useEffect, useMemo, ReactNode, Suspense } from 'react'
import ActionIcons from '@/app/(routes)/_components/actions_ buttons'
import { Pencil, Trash2, Filter, X, ChevronDown } from 'lucide-react'
import Table from '@/app/(routes)/_components/data_table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useQuery, useMutation } from '@apollo/client'
import { useSearchParams } from 'next/navigation'
import { 
  GET_CLUB_CONTACTS, 
  CREATE_CLUB_CONTACT,
  UPDATE_CONTACT,
  DELETE_CONTACT,
  GET_CLUB_USERS,
  UpdateContactResponse,
  UpdateContactInput,
  UpdateContactVariables
} from '@/graphql/query/clubs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'
import { useUser } from "@/context/user_context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApolloQueryResult, OperationVariables } from "@apollo/client"
import { GetContactsResponse as ContactsQueryResponse, CreateContactInput, CreateContactResponse, DeleteContactResponse } from "@/graphql/query/clubs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";
import { copy_replace } from "@/assets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Warning from "@/components/warning";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from '@/app/context/SearchContext'

interface Contact {
  _id: string;
  name: string;
  designation: string;
  email: string;
  image?: string | null;
  club?: string;
  created_at: string;
}

interface Club {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface GetClubUsersData {
  getAllUsers: {
    _id: string;
    name: string;
    email: string;
    role: string;
  }[];
}

interface Column {
  accessorKey: keyof Contact | 'action' | 'clubName';
  header: React.ReactNode;
  width: string;
}

interface NewContactForm {
  name: string
  designation: string
  email: string
  club: string
  image: File | null
}

interface TableProps<T> {
  columns: Column[];
  data: T[];
  renderAction?: (item: T) => ReactNode;
}

interface GetContactsData {
  getAllContacts: Contact[];
}

interface GetContactsVariables {
  userId: string;
}

const columns: Column[] = [
  {
    accessorKey: 'image',
    header: <div className="font-[400] text-[0.95vw] text-white">Image</div>,
    width: '8%',
  },
  {
    accessorKey: 'name',
    header: <div className="font-[400] text-[0.95vw] text-white">Name</div>,
    width: '15%',
  },
  {
    accessorKey: 'designation',
    header: <div className="font-[400] text-[0.95vw] text-white">Designation</div>,
    width: '15%',
  },
  {
    accessorKey: 'email',
    header: <div className="font-[400] text-[0.95vw] text-white">Email</div>,
    width: '25%',
  },
  {
    accessorKey: 'clubName',
    header: <div className="font-[400] text-[0.95vw] text-white">Club</div>,
    width: '27%',
  },
  {
    accessorKey: 'action',
    header: <div className="font-[400] text-[0.95vw] text-white">Action</div>,
    width: '10%',
  },
]

const dummyContacts: Contact[] = [
  {
    _id: 'dummy-1',
    name: 'John Smith',
    designation: 'Club President',
    email: 'john.smith@example.com',
    created_at: new Date().toISOString(),
    club: 'dummy-club',
    image: undefined,
  },
];

// Client page wrapper with suspense boundary
const ClubContactsPage = () => {
  return (
    <Suspense fallback={<div className="p-12 flex justify-center">Loading...</div>}>
      <ClubContactsContent />
    </Suspense>
  );
};

// Client component with all hooks
const ClubContactsContent = () => {
  const searchParams = useSearchParams();
  const initialClubId = searchParams.get("club") || "";
  
  const { data, loading, error, client } = useQuery<GetContactsData, GetContactsVariables>(GET_CLUB_CONTACTS, {
    variables: { userId: "6751b94c638cf509a17534bc" },
  });

  const { data: clubsData, loading: clubsLoading, error: clubsError } = useQuery<GetClubUsersData>(GET_CLUB_USERS, {
    fetchPolicy: "network-only"
  });

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedClubId, setSelectedClubId] = useState<string>(initialClubId);
  const [newContact, setNewContact] = useState<NewContactForm>({
    name: '',
    designation: '',
    email: '',
    club: '',
    image: null
  })

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  // Filter available clubs - only users with role "CLUB"
  const availableClubs = useMemo(() => {
    return clubsData?.getAllUsers?.filter(user => user.role === "CLUB") || [];
  }, [clubsData]);

  const [updateContact, { loading: updateLoading }] = useMutation<UpdateContactResponse, UpdateContactVariables>(
    UPDATE_CONTACT,
    {
      onCompleted: () => {
        setShowEditModal(false);
        setEditingContact(null);
      },
      refetchQueries: [{ query: GET_CLUB_CONTACTS }]
    }
  );

  const [deleteContact, { loading: deleteLoading }] = useMutation<DeleteContactResponse>(DELETE_CONTACT, {
    refetchQueries: [{ query: GET_CLUB_CONTACTS }],
    onCompleted: () => {
      setDeletingContactId(null);
    },
    onError: () => {
      setDeletingContactId(null);
    }
  });

  const [createContact] = useMutation<CreateContactResponse, { input: CreateContactInput }>(
    CREATE_CLUB_CONTACT,
    {
      onCompleted: () => {
        setShowAddModal(false);
        setNewContact({
          name: "",
          designation: "",
          email: "",
          club: "",
          image: null
        });
      },
      refetchQueries: [{ query: GET_CLUB_CONTACTS }]
    }
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handleEdit = (contact: Contact) => {
    // Create a clean copy of the contact to avoid any date-related issues
    const contactToEdit = {
      _id: contact._id,
      name: contact.name,
      designation: contact.designation,
      email: contact.email,
      image: contact.image,
      club: contact.club,
      created_at: contact.created_at
    };
    
    setEditingContact(contactToEdit);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      const variables = {
        contactId: editingContact._id,
        input: {
          name: editingContact.name,
          designation: editingContact.designation,
          email: editingContact.email,
          image: editingContact.image ?? null
        }
      };

      await updateContact({ variables });
      toast({
        description: "Contact updated successfully",
      });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        variant: "destructive",
        description: "Failed to update contact",
      });
    }
  };

  const handleDelete = async (id: string) => {
    // Store the current data for potential rollback
    const previousData = client.readQuery<GetContactsData>({
      query: GET_CLUB_CONTACTS,
      variables: { userId: "6751b94c638cf509a17534bc" },
    });

    if (!previousData) {
      toast({
        variant: "destructive",
        description: "Failed to delete contact: No data available",
      });
      return;
    }

    // Optimistically update the UI
    client.writeQuery<GetContactsData>({
      query: GET_CLUB_CONTACTS,
      variables: { userId: "6751b94c638cf509a17534bc" },
      data: {
        getAllContacts: previousData.getAllContacts.filter(contact => contact._id !== id),
      },
    });

    try {
      setDeletingContactId(id);
      const result = await deleteContact({
        variables: { contactId: id },
      });
      if (result.data?.deleteContact?._id) {
        toast({
          description: "Contact deleted successfully",
        });
      }
      setShowDeleteModal(false);
      setDeletingContactId(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      // Revert the optimistic update on error
      client.writeQuery<GetContactsData>({
        query: GET_CLUB_CONTACTS,
        variables: { userId: "6751b94c638cf509a17534bc" },
        data: previousData,
      });
      toast({
        variant: "destructive",
        description: "Failed to delete contact",
      });
      setDeletingContactId(null);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newContact.club) return;

      const selectedClub = availableClubs.find(club => club._id === newContact.club);
      if (!selectedClub) return;

      const variables = {
        input: {
          name: newContact.name,
          designation: newContact.designation,
          email: newContact.email,
          clubId: newContact.club,
          image: newContact.image ? await fileToBase64(newContact.image) : null
        }
      };

      await createContact({ variables });
      toast({
        description: "Contact created successfully",
      });
    } catch (error) {
      console.error("Error creating contact:", error);
      toast({
        variant: "destructive",
        description: "Failed to create contact. Please try again.",
      });
    }
  };

  const handleClubSelection = (value: string) => {
    if (!availableClubs || availableClubs.length === 0) return;
    
    const selectedClub = availableClubs.find(club => club._id === value);
    if (selectedClub) {
      setNewContact(prev => ({ ...prev, club: selectedClub._id }));
    }
  };

  const isFormValid = () => {
    return (
      newContact.name &&
      newContact.designation &&
      newContact.email &&
      newContact.club
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getContactsCountForClub = (clubId: string) => {
    if (!data?.getAllContacts) return 0;
    return data.getAllContacts.filter(contact => contact.club === clubId).length;
  };

  const getClubNameById = (clubId: string | undefined) => {
    if (!clubId) return "No Club Selected";
    if (clubId === "6739a108846c6d782ab1b20d") return "Legacy Club (Please Update)";
    if (!availableClubs || availableClubs.length === 0) return "Loading Club...";

    const club = availableClubs.find(club => club._id === clubId);
    return club ? club.name : "Unknown Club";
  };

  const filteredContacts = useMemo(() => {
    if (!data?.getAllContacts) return [];
    
    // First filter out NZFSS contacts
    const nonNzfssContacts = data.getAllContacts.filter(contact => {
      const clubName = getClubNameById(contact.club);
      return !clubName.toLowerCase().includes('new zealand federation of sled dog sports');
    });
    
    // Apply club filter if selected
    let filtered = nonNzfssContacts;
    if (selectedClubId) {
      filtered = filtered.filter(contact => contact.club === selectedClubId);
    }
    
    // Apply search filter if search query exists
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(query) || 
        contact.designation.toLowerCase().includes(query) || 
        contact.email.toLowerCase().includes(query) ||
        getClubNameById(contact.club).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [data?.getAllContacts, selectedClubId, availableClubs, searchQuery]);

  const tableData = useMemo(() => {
    if (!filteredContacts.length) return [];
    
    return filteredContacts.map(contact => ({
      ...contact,
      id: contact._id,
      action: contact._id,
      clubName: getClubNameById(contact.club)
    }));
  }, [filteredContacts, getClubNameById]);

  return (
    <div className="container mx-auto p-4 -mt-32 rounded-lg">
      <div className="bg-[#F8F9FA] rounded-t-lg rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Club Contacts</h1>
            <p className="font-[500] text-[#4F4F4F]  text-[0.95vw]">Management of all Club Contacts.</p>
          </div>
          <div className="flex items-center gap-3 mr-8">
            <div className="relative flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-between text-[0.833vw] text-[#696A6A] rounded-lg gap-3 w-[21.927vw]  border-[#00000033] hover:bg-gray-200 transition-all duration-200 px-6 py-5 text-[15px] font-medium shadow-sm hover:shadow-md"
                  >
                    {selectedClubId ? (
                      availableClubs.find(club => club._id === selectedClubId)?.name || 'My Club'
                    ) : (
                      'Select Club'
                    )}
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[21.927vw] p-4 bg-white rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel className="text-[1.1rem] font-semibold px-2 pb-2">Filter by Club</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  {availableClubs.map((club) => (
                    <DropdownMenuItem
                      key={club._id}
                      onClick={() => setSelectedClubId(club._id)}
                      className="py-3 px-4 text-[1rem] font-medium hover:bg-gray-200 rounded-md cursor-pointer focus:bg-gray-50 my-1"
                    >
                      {club.name} ({getContactsCountForClub(club._id)} contacts)
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {selectedClubId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClubId("")}
                  className="absolute right-12 p-1 hover:bg-gray-200 rounded-full h-6 w-6"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 instant-anim flex gap-x-2 border bg-[#F3F3F3] border-[#00000033] py-2 px-2 rounded-[16px] font-[500] text-[#000000] text-[0.95vw] px-6 py-4 h-[2.7rem]"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 " /> Add New Contact
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-b-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black border-b border-gray-800">
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Image</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Name</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Designation</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Email</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white">Club</th>
                <th className="text-centre p-4 font-[400] text-[0.95vw] text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <span className="ml-3 text-gray-600">Loading contacts...</span>
                    </div>
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500">
                    No contacts found
                  </td>
                </tr>
              ) : (
                tableData.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-300 hover:bg-gray-200 transition-colors">
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                      <Avatar className="w-10 h-10 border border-gray-200">
                        <AvatarImage src={contact.image || undefined} alt="Contact Avatar" className="object-cover" />
                        <AvatarFallback className="bg-gray-100 text-gray-600">{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{contact.name}</td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{contact.designation}</td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{contact.email}</td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{contact.clubName}</td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                      <div className="flex items-center justify-end">
                        <ActionIcons
                          icons={[
                            <Pencil
                              key="edit"
                              className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-blue-600"
                              onClick={() => handleEdit(contact)}
                            />,
                            <Trash2
                              key="delete"
                              className={`w-[14px] h-[14px] transition-colors duration-200 ${
                                deletingContactId === contact._id 
                                  ? "text-gray-400 cursor-not-allowed" 
                                  : "text-[#323232] cursor-pointer hover:text-red-600"
                              }`}
                              onClick={() => {
                                setEditingContact(contact);
                                setShowDeleteModal(true);
                              }}
                            />
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Enter the contact information for the club.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateContact} className="flex flex-col items-center gap-4 py-">
            <div className="flex flex-col  gap-y-2 mr-[450px]">
              <Avatar className="w-[80px] h-[80px]">
                <AvatarImage 
                  src={newContact.image ? URL.createObjectURL(newContact.image) : undefined} 
                  alt="Contact image"
                  className="rounded-full object-cover"
                />
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  {newContact.name ? getInitials(newContact.name) : 'CN'}
                </AvatarFallback>
              </Avatar>

              <label htmlFor="contact-image" className="border font-[500] text-[1rem] w-[100px] h-[30px] rounded-md justify-start flex items-center justify-center cursor-pointer">
                Upload
                <input
                  id="contact-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert("Image size should be less than 5MB");
                        e.target.value = "";
                        return;
                      }
                      if (!file.type.startsWith("image/")) {
                        alert("Please upload an image file");
                        e.target.value = "";
                        return;
                      }
                      setNewContact(prev => ({ ...prev, image: file }));
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col gap-y-2 w-full">
              <Label htmlFor="name" className="text-left font-[600] text-[14px]">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                className="bg-white py-2 px-3 outline-none rounded-[16px] h-[2.8vw]"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-y-2 w-full">
              <Label htmlFor="designation" className="text-left font-[600] text-[14px]">
                Designation
              </Label>
              <Input
                id="designation"
                placeholder="Enter your designation"
                className="bg-white py-2 px-3 outline-none rounded-[16px] h-[2.8vw]"
                value={newContact.designation}
                onChange={(e) => setNewContact(prev => ({ ...prev, designation: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-y-2 w-full">
              <Label htmlFor="email" className="text-left font-[600] text-[14px]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-white py-2 px-3 outline-none rounded-[16px] h-[2.8vw]"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-y-2 w-full">
              <Label htmlFor="club" className="text-left  font-[600] text-[14px]">
                Club
              </Label>
              {clubsError ? (
                <div className="text-sm text-red-500">
                  Error loading clubs. Please try again later.
                </div>
              ) : clubsLoading ? (
                <div className="h-10 flex items-center">Loading clubs...</div>
              ) : !availableClubs.length ? (
                <div className="h-10 flex items-center text-amber-500">
                  No clubs available
                </div>
              ) : (
                <Select
                  value={newContact.club}
                  onValueChange={handleClubSelection}
                  required
                >
                  <SelectTrigger className="bg-white py-2 px-3 h-[2.8vw] outline-none rounded-[16px]">
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClubs.map((club) => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name} ({getContactsCountForClub(club._id)} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-between items-center w-full gap-x-4">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="instant-anim w-[475px] h-[60px] hover:border-gray-400 font-[500] text-[14px] rounded-[24px]" 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline"
                  className="instant-anim w-full h-[60px] hover:bg-black hover:text-white font-[500] text-[14px] rounded-[24px]"
                  type="submit"
                  disabled={!isFormValid()}
                >
                  Add
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Contact</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Update the contact information below</p>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="px-6 pb-6">
            {/* Image Upload Section */}
            <div className="flex flex-col items-center py-6 border-b border-gray-100 mb-6">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={editingContact?.image || undefined} 
                    alt="Contact image"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                    {editingContact?.name ? getInitials(editingContact.name) : 'CN'}
                  </AvatarFallback>
                </Avatar>
                {editingContact?.image && (
                  <button
                    type="button"
                    onClick={() => setEditingContact(prev => prev ? { ...prev, image: null } : null)}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <label 
                htmlFor="edit-contact-image" 
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg cursor-pointer hover:from-gray-700 hover:to-gray-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {editingContact?.image ? 'Change Image' : 'Upload Image'}
                <input
                  id="edit-contact-image"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert("Image size should be less than 5MB");
                        e.target.value = "";
                        return;
                      }
                      if (!file.type.startsWith("image/")) {
                        alert("Please upload an image file");
                        e.target.value = "";
                        return;
                      }
                      try {
                        const base64Image = await fileToBase64(file);
                        setEditingContact(prev => prev ? { ...prev, image: base64Image } : null);
                      } catch (error) {
                        console.error("Error converting image:", error);
                        alert("Error uploading image. Please try again.");
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editingContact?.name || ""}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-designation" className="text-sm font-medium text-gray-700">
                  Position/Role <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-designation"
                  value={editingContact?.designation || ""}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, designation: e.target.value } : null)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  placeholder="e.g., President, Secretary, Treasurer"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingContact?.email || ""}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, email: e.target.value } : null)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  placeholder="example@club.org"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline"
                className="flex-1 h-11 font-medium border-gray-300 hover:border-gray-400 hover:bg-gray-200 transition-all duration-200 rounded-lg" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingContact(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 h-11 font-medium bg-gradient-to-r text-white transition-all duration-200 rounded-lg shadow-md hover:shadow-lg"
                disabled={updateLoading}
              >
                {updateLoading ? "Updating..." : "Update Contact"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Modal */}
      {showDeleteModal && editingContact && (
        <Warning
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          data={editingContact}
          description="Are you sure you want to delete this contact?"
          onConfirm={() => handleDelete(editingContact._id)}
        />
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Error: {error.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClubContactsPage
