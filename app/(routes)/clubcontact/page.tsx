"use client";

import { Sidebar } from "@/app/(routes)/_components/sidebar";
import TopHeader from "@/app/(routes)/_components/top_header";
import TopHeaderWithSuspense from "@/app/(routes)/_components/top_header_with_suspense";
import { useUser } from "@/context/user_context";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Pencil, Trash2 } from "lucide-react";
import { FiX } from "react-icons/fi";
import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ContactTrigger from "@/app/(routes)/_components/triggers/contact_trigger";
import { CREATE_CLUB_CONTACT, GET_CLUB_CONTACTS, DELETE_CONTACT, UPDATE_CONTACT, GetContactsResponse, DeleteContactResponse } from "@/graphql/query/clubs";
import { useSearch } from "@/app/context/SearchContext";
import ActionIcons from "../_components/actions_ buttons";

interface ClubContact {
  id: string;
  image: string;
  name: string;
  designation: string;
  email: string;
}

// Modal component
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
      <DialogContent className="max-w-[80vw] w-[50vw]">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-base">{description}</DialogDescription>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};

// Loading state component
const LoadingState = () => (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="h-[48px] w-[592px] border rounded-[16px] px-4 flex gap-x-[8px] items-center">
          <div className="animate-pulse bg-gray-200 h-6 w-full rounded"></div>
        </div>
      </div>
      <main className="flex-1 p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading contacts...</p>
        </div>
      </main>
    </div>
  </div>
);

export default function ClubDetailsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { searchQuery } = useSearch();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<{
    id: string;
    name: string;
    designation: string;
    email: string;
    image: string;
  } | null>(null);
  const [selectedEditImage, setSelectedEditImage] = useState<string>("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [showImageRemoveIcon, setShowImageRemoveIcon] = useState(false);
  const fileInputEditRef = useRef<HTMLInputElement>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    designation: "",
    email: "",
    image: ""
  });

  // Debug logs
  console.log("Full user object:", user);
  console.log("User ID:", user?._id);

  // Query for contacts
  const { loading, error, data } = useQuery<GetContactsResponse>(GET_CLUB_CONTACTS, {
    skip: !user?._id,
    onCompleted: (data) => {
      console.log("Query completed with data:", data);
    },
    onError: (error) => {
      console.error("Query error details:", {
        message: error.message,
        networkError: error.networkError,
        graphQLErrors: error.graphQLErrors
      });
    }
  });

  // More debug logs
  useEffect(() => {
    console.log("Query variables:", {
      clubId: user?._id
    });
  }, [user]);

  const [createContact] = useMutation(CREATE_CLUB_CONTACT, {
    refetchQueries: [{ query: GET_CLUB_CONTACTS }],
    onError: (error) => {
      console.error("Error creating contact:", error);
    }
  });

  const [deleteContact] = useMutation<DeleteContactResponse>(DELETE_CONTACT, {
    refetchQueries: [{ query: GET_CLUB_CONTACTS }],
    onCompleted: (data) => {
      console.log("Successfully deleted contact:", data);
    },
    onError: (error) => {
      console.error("Delete error details:", {
        message: error.message,
        networkError: error.networkError,
        graphQLErrors: error.graphQLErrors
      });
    }
  });

  const [updateContact] = useMutation(UPDATE_CONTACT, {
    refetchQueries: [{ query: GET_CLUB_CONTACTS }],
    onCompleted: () => {
      setIsEditModalOpen(false);
      setEditingContact(null);
    },
    onError: (error) => {
      console.error("Error updating contact:", error);
    }
  });

  const handleContactSubmit = async (data: { 
    name: string; 
    designation: string; 
    email: string; 
    image: File | null 
  }) => {
    try {
      console.log("Starting contact submission with data:", {
        ...data,
        imageSize: data.image?.size,
        imageType: data.image?.type
      });

      // Validate form data
      if (!data.name || !data.designation || !data.email) {
        alert("Please fill out all required fields.");
        return;
      }

      // Convert image to base64 if it exists and is valid
      let base64Image = "";
      if (data.image) {
        if (data.image.size > 5 * 1024 * 1024) {
          alert("Image size should be less than 5MB");
          return;
        }
        if (!data.image.type.startsWith("image/")) {
          alert("Please upload a valid image file");
          return;
        }
        const reader = new FileReader();
        base64Image = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.image as Blob);
        });
      }

      // Create contact with base64 image
      const result = await createContact({
        variables: {
          input: {
            name: data.name,
            designation: data.designation,
            email: data.email,
            image: base64Image,
            clubId: user?._id
          }
        }
      });

      console.log("Contact created successfully:", result);
      setNewContact({ name: "", designation: "", email: "", image: "" });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to create contact:", error);
      alert("An error occurred while creating the contact. Please try again.");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) {
      return;
    }
    try {
      console.log("Attempting to delete contact with ID:", id);
      const result = await deleteContact({
        variables: { 
          contactId: id
        }
      });
      console.log("Delete mutation result:", result);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Delete handler error:", error.message);
        alert("An error occurred while deleting the contact. Please try again.");
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      // Check if there's a new image to upload
      let base64Image = editingContact.image;
      
      if (editImageFile) {
        if (editImageFile.size > 5 * 1024 * 1024) {
          alert("Image size should be less than 5MB");
          return;
        }
        if (!editImageFile.type.startsWith("image/")) {
          alert("Please upload a valid image file");
          return;
        }
        
        // Convert new image to base64
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(editImageFile as Blob);
        });
      }

      await updateContact({
        variables: {
          contactId: editingContact.id,
          input: {
            name: editingContact.name,
            designation: editingContact.designation,
            email: editingContact.email,
            image: base64Image
          }
        }
      });
      
      // Reset image state
      setEditImageFile(null);
      setSelectedEditImage("");
      
      alert("Contact updated successfully.");
    } catch (error) {
      console.error("Failed to update contact:", error);
      alert("An error occurred while updating the contact. Please try again.");
    }
  };

  // Function to handle image selection for edit modal
  const handleEditImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedEditImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedEditImage("");
    setEditImageFile(null);
    // Set image to empty string in the editingContact state
    if (editingContact) {
      setEditingContact({
        ...editingContact,
        image: ""
      });
    }
  };

  // Filter contacts for this club
  const contacts = data?.getAllContacts?.filter(contact => contact.club === user?._id) || [];

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    return contacts.filter((contact: any) => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
}, [contacts, searchQuery]);

  // Loading state component
  const LoadingScreenComponent = () => (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-white">
          <TopHeaderWithSuspense 
            placeholder="Search contacts..."
          />
        </div>
        <main className="flex-1 p-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p>Loading contacts...</p>
          </div>
        </main>
      </div>
    </div>
  );

  // Show loading state if loading or user is not yet available
  if (loading || !user?._id) {
    return <LoadingScreenComponent />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-white">
          <TopHeaderWithSuspense 
            placeholder="Search contacts..."
          />
        </div>
        <main className="flex-1 bg-gray-50 border border-gray-200 rounded-lg">
          <div>
            <div className="px-8 py-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="w-[57.76vw] h-[1.771vw] text-[1.458vw] font-[700] mb-2">Club Contacts</h1>
                  <p className="font-[500] text-[#4F4F4F] text-[0.95vw]">Management of Club Contacts and Representatives. These entries will be used for club communication and administrative tasks.</p>
                </div>
                <ContactTrigger 
                  btn={
                    <button className="bg-white text-black px-4 py-2 w-[10vw] h-[2.5vw] rounded-lg rounded-md border border-[#CDCECE] hover:bg-gray-200 flex items-center gap-2 text-sm">
                      <div className="text-[0.95vw] font-[500]">+ Add New Contact</div>
                    </button>
                  }
                  onSubmit={handleContactSubmit} 
                />
              </div>
            </div>

            <div className="border-t border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-white font-[500] text-[#000000] text-[0.97vw]">
                    <th className="text-left px-8 py-4 font-medium">Contact Name</th>
                    <th className="text-left px-8 py-4 font-medium">Designation</th>
                    <th className="text-left px-8 py-4 font-medium">Email</th>
                    <th className="px-8 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-50 divide-y divide-gray-200">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <tr key={contact._id} className="border-gray-200">
                        <td className="px-4 py-4 font-[500] text-[#000000] text-[0.95vw]">{contact.name}</td>
                        <td className="px-4 py-4 font-[500] text-[#000000] text-[0.95vw]">{contact.designation}</td>
                        <td className="px-4 py-4 font-[500] text-[#000000] text-[0.95vw]">{contact.email}</td>
                        <td className="px-4 py-4 font-[500] text-[#000000] text-[0.95vw]">
                          <ActionIcons
                            eventId={contact._id}
                            event={{ clubId: user?._id }} // Pass user's club ID for permission checking
                            icons={[
                              <Pencil
                                onClick={() => {
                                  setEditingContact({
                                    id: contact._id,
                                    name: contact.name,
                                    designation: contact.designation,
                                    email: contact.email,
                                    image: contact.image || "/placeholder.jpg"
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="w-[14px] h-[14px] text-[#323232] cursor-pointer hover:text-blue-600 transition-colors duration-200"
                                key="edit"
                              />,
                              <Trash2
                                onClick={() => handleDeleteContact(contact._id)}
                                className="w-[14px] h-[14px] text-[#323232] cursor-pointer hover:text-red-600 transition-colors duration-200"
                                key="delete"
                              />
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-lg mb-2">No contacts available</p>
                          <p className="text-sm text-gray-400">Add a new contact to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      <Modal
        title="Edit Contact"
        description="Update contact information"
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingContact(null);
          setSelectedEditImage("");
          setEditImageFile(null);
        }}
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="flex flex-col mb-8 ">
            <div className="relative w-[128px] h-[128px] mb-4 group">
              <Image
                width={128}
                height={128}
                src={selectedEditImage || editingContact?.image || "/placeholder.jpg"}
                alt="Contact image"
                className="rounded-2xl object-cover w-full h-full"
              />
              {(selectedEditImage || editingContact?.image) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full p-1 flex items-center justify-center shadow hover:bg-opacity-90 transition opacity-0 group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <FiX size={20} color="white" />
                </button>
              )}
            </div>
            <input
              ref={fileInputEditRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleEditImageSelect}
            />
            <Button
              type="button"
              onClick={() => fileInputEditRef.current?.click()}
              className="border font-bold text-base w-[164px] h-[44px] rounded-xl mt-0"
            >
              Update Image
            </Button>
          </div>
          
          <div>
            <label className="block mb-2 text-[1.1vw] font-[600]">Contact Name</label>
            <input 
              type="text"
              className="w-full p-3 border rounded-lg text-base"
              placeholder="Enter contact name"
              value={editingContact?.name || ""}
              onChange={(e) => setEditingContact(prev => prev ? {...prev, name: e.target.value} : null)}
            />
          </div>
          <div>
            <label className="block mb-2 text-[1.1vw] font-[600]">Designation</label>
            <input 
              type="text"
              className="w-full p-3 border rounded-lg text-base"
              placeholder="Enter designation"
              value={editingContact?.designation || ""}
              onChange={(e) => setEditingContact(prev => prev ? {...prev, designation: e.target.value} : null)}
            />
          </div>
          <div>
            <label className="block mb-2 text-[1.1vw] font-[600]">Email</label>
            <input 
              type="email"
              className="w-full p-3 border rounded-lg text-base"
              placeholder="Enter email"
              value={editingContact?.email || ""}
              onChange={(e) => setEditingContact(prev => prev ? {...prev, email: e.target.value} : null)}
            />
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              className="w-1/2 py-4 border border-gray-300 hover:border-gray-400 rounded-2xl text-base font-semibold bg-white hover:bg-gray-200 transition"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingContact(null);
                setSelectedEditImage("");
                setEditImageFile(null);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-4 border border-gray-300 rounded-2xl text-base font-semibold bg-white hover:bg-black hover:text-white transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
    
