'use client'

import React, { useState, Suspense, useMemo } from 'react'
import ActionIcons from '@/app/(routes)/_components/actions_ buttons'; 
import { Trash2, Plus, X } from 'lucide-react';
import Image from "next/image";
import { copy_replace } from "@/assets";
import { Pencil } from "lucide-react";

import Table from '@/app/(routes)/_components/data_table'; 
import Warning from "@/components/warning";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CLUB_CONTACTS, CREATE_CLUB_CONTACT, UPDATE_CONTACT, DELETE_CONTACT } from '@/graphql/query/clubs';
import ContactTrigger from '@/app/(routes)/_components/triggers/contact_trigger';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearch } from '@/app/context/SearchContext';

interface Form {
  image: File | null; 
  name: string; 
  designation: string;
  email: string;
  action: string; 
}

interface Contact {
  _id: string;
  name: string;
  designation: string;
  email: string;
  image?: string;
  created_at: string;
  club: string;
}

interface GetAllContactsData {
  getAllContacts: Contact[];
}

interface Column {
  accessorKey: keyof Form; 
  header: React.ReactNode; 
  width: string;
}

const columns: Column[] = [
  {
    accessorKey: 'image', 
    header: 'Image', 
    width: '10%', 
  },
  {
    accessorKey: 'name', 
    header: 'Name', 
    width: '25%', 
  },
  {
    accessorKey: 'designation', 
    header: 'Designation', 
    width: '25%',
  },
  {
    accessorKey: 'email', 
    header: 'Email', 
    width: '30%',
  },
  {
    accessorKey: 'action',
    header: <div className="text-right">Actions</div>,
    width: '10%',
  },
];

const ContactPageContent = () => {
  // Hardcode the NZFSS club ID
  const nzfssClubId = "682f0ad809bd8de49c9f8fb0";
  
  const { data: contactsData, error, loading, client } = useQuery<GetAllContactsData>(GET_CLUB_CONTACTS, {
    fetchPolicy: "cache-and-network",
  });
  const { searchQuery } = useSearch();

  const [createContact] = useMutation(CREATE_CLUB_CONTACT);
  const [updateContact] = useMutation(UPDATE_CONTACT);
  const [deleteContact] = useMutation(DELETE_CONTACT);
  
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCreateContact = async (newContact: Omit<Form, 'action'>) => {
    const createContactInput = {
      ...newContact,
      clubId: nzfssClubId,
    };

    if (newContact.image) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageString = e.target?.result as string;
        try {
          const response = await createContact({
            variables: {
              input: {
                ...createContactInput,
                image: imageString,
              },
            },
            refetchQueries: [{ query: GET_CLUB_CONTACTS }],
          });
          console.log('Contact created:', response.data);
          toast({
            description: "Committee member added successfully",
          });
        } catch (err) {
          console.error('Error creating contact:', err);
          toast({
            variant: "destructive",
            description: "Failed to add committee member",
          });
        }
      };
      reader.readAsDataURL(newContact.image);
    } else {
      // Create contact without image
      try {
        const response = await createContact({
          variables: {
            input: createContactInput,
          },
          refetchQueries: [{ query: GET_CLUB_CONTACTS }],
        });
        console.log('Contact created:', response.data);
        toast({
          description: "Committee member added successfully",
        });
      } catch (err) {
        console.error('Error creating contact:', err);
        toast({
          variant: "destructive",
          description: "Failed to add committee member",
        });
      }
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      await updateContact({
        variables: {
          contactId: editingContact._id,
          input: {
            name: editingContact.name,
            designation: editingContact.designation,
            email: editingContact.email,
            image: editingContact.image
          }
        },
        refetchQueries: [{ query: GET_CLUB_CONTACTS }]
      });
      setShowEditModal(false);
      setEditingContact(null);
      toast({
        description: "Contact updated successfully",
      });
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        variant: "destructive",
        description: "Failed to update contact",
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    // Store the current data for potential rollback
    const previousData = client.readQuery<GetAllContactsData>({
      query: GET_CLUB_CONTACTS,
    });

    if (!previousData) {
      toast({
        variant: "destructive",
        description: "Failed to delete contact: No data available",
      });
      return;
    }

    // Optimistically update the UI
    client.writeQuery<GetAllContactsData>({
      query: GET_CLUB_CONTACTS,
      data: {
        getAllContacts: previousData.getAllContacts.filter(contact => contact._id !== id),
      },
    });

    try {
      await deleteContact({
        variables: { contactId: id },
        // Remove refetchQueries since we're handling the update manually
      });
      toast({
        description: "Contact deleted successfully",
      });
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting contact:", error);
      // Revert the optimistic update on error
      client.writeQuery<GetAllContactsData>({
        query: GET_CLUB_CONTACTS,
        data: previousData,
      });
      toast({
        variant: "destructive",
        description: "Failed to delete contact",
      });
    }
  };

  const nzfssContacts = useMemo(() => {
    if (!contactsData?.getAllContacts) return [];
    return contactsData.getAllContacts.filter(
      (contact: Contact) => contact.club === nzfssClubId
    );
  }, [contactsData?.getAllContacts, nzfssClubId]);

  const filteredData = useMemo(() => {
    return nzfssContacts
      .filter((contact: Contact) => {
        if (searchQuery && searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          return (
            contact.name.toLowerCase().includes(query) ||
            contact.designation.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .map((contact: Contact) => ({
        image: contact.image,
        name: contact.name,
        designation: contact.designation,
        email: contact.email,
        action: "",
        _id: contact._id,
      }));
  }, [nzfssContacts, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading contacts...</span>
      </div>
    );
  }

  if (error) {
    console.error("Error loading data:", error);
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 -mt-32 rounded-lg">
      <div className="bg-[#F8F9FA] rounded-t-lg rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[1.458vw] font-semibold text-gray-900">NZFSS Executive Committee</h1>
            <p className="font-[500] text-[#4F4F4F] w-[30vw] text-[0.95vw]">Contact information for the NZFSS Executive Committee..</p>
          </div>
          <div className="flex items-center gap-3 mr-8 ">
            <Button 
              variant="outline" 
              className="flex justify-end bg-gray-100 instant-anim flex gap-x-2 border border-[#00000033] bg-[#F3F3F3] h-[2vw] px-4 rounded-[16px] font-[500] text-[#000000] text-[0.95vw]"
              onClick={() => {}}
            >
              <Plus className="w-4 h-4" /> <ContactTrigger btn="Add Committee Member" onSubmit={handleCreateContact} />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black border-b border-gray-800">
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white w-[10%]">Image</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white w-[25%]">Name</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white w-[25%]">Designation</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white w-[25%]">Email</th>
                <th className="text-left p-4 font-[400] text-[0.95vw] text-white w-[5%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">
                    No committee members found
                  </td>
                </tr>
              ) : (
                filteredData.map((contact, index) => (
                  <tr key={index} className="border-b border-gray-300 hover:bg-gray-200 transition-colors">
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                      <Avatar className="w-10 h-10 border border-gray-200">
                        <AvatarImage src={contact.image} alt="Contact Avatar" className="object-cover" />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{contact.name}</td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{contact.designation}</td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">{contact.email}</td>
                    <td className="p-4 font-[500] text-[#000000] bg-[#F6F6F6] text-[0.95vw]">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-[48px] h-[46px] flex items-center justify-center rounded-[16px] border border-[#00000033] hover:bg-gray-200 hover:scale-105 transition-all duration-200"
                                onClick={() => handleEditContact(nzfssContacts.find(c => c._id === contact._id) as Contact)}
                              >
                                <Pencil className="h-[14px] w-[14px] text-[#323232]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white">
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-[48px] h-[46px] flex items-center justify-center rounded-[16px] border border-[#00000033] hover:bg-gray-200 hover:scale-105 transition-all duration-200"
                                onClick={() => {
                                  setEditingContact(nzfssContacts.find(c => c._id === contact._id) as Contact);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <Trash2 className="h-[14px] w-[14px] text-[#323232]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white">
                              <p>Delete</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Contact Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Committee Member</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Update the committee member's information</p>
          </DialogHeader>
          
          <form onSubmit={handleUpdateContact} className="px-6 pb-6">
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
                    onClick={() => setEditingContact(prev => prev ? { ...prev, image: undefined } : null)}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <label 
                htmlFor="edit-contact-image" 
                className="flex  gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg cursor-pointer hover:from-gray-700 hover:to-gray-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
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
                  placeholder="example@nzfss.org"
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
                className="flex-1 h-11 font-medium bg-gradient-to-r  text-white transition-all duration-200 rounded-lg shadow-md hover:shadow-lg"
              >
                Update Member
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
          description="Are you sure you want to delete this committee member?"
          onConfirm={() => handleDeleteContact(editingContact._id)}
        />
      )}
    </div>
  );
};

// Wrap the ContactPageContent with Suspense
export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading page...</span>
      </div>
    }>
      <ContactPageContent />
    </Suspense>
  );
}