"use client";

import { Sidebar } from "@/app/(routes)/_components/sidebar";
import TopHeader from "@/app/(routes)/_components/top_header";
import { useUser } from "@/context/user_context";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import { gql, useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { GET_ALL_CLUBS } from "@/graphql/query/clubs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Warning from "@/components/warning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, CheckCircle2, XCircle, User, Mail, Phone, MapPin, Calendar, Dog, AlertTriangle } from "lucide-react";
import { toast, Toaster } from "sonner";

interface Club {
    _id: string;
    name: string;
    email: string;
}

const GET_PENDING_FORMS = gql`
  query GetPendingForms($clubId: String!) {
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
      affiliationFrom
      affiliationTo
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

const CHECK_DUPLICATE_MUSHER = gql`
  query CheckDuplicateMusher($surname: String, $nzfssRegistrationNumber: String) {
    checkDuplicateMusher(surname: $surname, nzfssRegistrationNumber: $nzfssRegistrationNumber) {
      id
      name
      registrationNo
      club
      dogs {
        name
        breed
        nzfssNo
      }
    }
  }
`;

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

const PendingFormsPage = () => {
    const { user } = useUser();
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [duplicateMusher, setDuplicateMusher] = useState<any>(null);
    const [pendingFormData, setPendingFormData] = useState<any>(null);

    const { data, loading, error } = useQuery(GET_PENDING_FORMS, {
        variables: {
            clubId: user?._id
        },
        skip: !user?._id,
        onCompleted: (data) => {
            console.log("Pending forms data received:", data);
            if (data?.forms?.length > 0) {
                console.log("First form data:", data.forms[0]);
            }
        }
    });

    // Query to fetch all clubs for mapping IDs to names
    const { data: clubsData } = useQuery(GET_ALL_CLUBS, {
        onError: (error) => {
            console.error("Error fetching clubs:", error);
        }
    });

    // Function to get club name by ID
    const getClubName = (clubId: string): string => {
        if (!clubId || !clubsData?.getAllClubs) return clubId;
        
        const club = clubsData.getAllClubs.find((club: Club) => club._id === clubId);
        return club ? club.name : clubId;
    };

    const [checkDuplicateMusher] = useLazyQuery(CHECK_DUPLICATE_MUSHER);

    const [approveForm] = useMutation(APPROVE_FORM, {
        refetchQueries: [
            {
                query: GET_PENDING_FORMS,
                variables: { clubId: user?._id }
            }
        ]
    });

    const [declineForm] = useMutation(DECLINE_FORM, {
        refetchQueries: [
            {
                query: GET_PENDING_FORMS,
                variables: { clubId: user?._id }
            }
        ]
    });

    const handleApproveForm = async (formId: string) => {
        try {
            const form = data?.forms?.find((f: any) => f._id === formId);
            
            // Only check for duplicates on new registration forms
            if (form?.formType === 'new') {
                const duplicateResult = await checkDuplicateMusher({
                    variables: {
                        surname: form.surname,
                        nzfssRegistrationNumber: form.nzfssRegistrationNumber
                    }
                });
                
                if (duplicateResult.data?.checkDuplicateMusher?.length > 0) {
                    // Show duplicate warning modal
                    setDuplicateMusher(duplicateResult.data.checkDuplicateMusher);
                    setPendingFormData(form);
                    setSelectedFormId(formId);
                    setShowDuplicateModal(true);
                    return;
                }
            }
            
            // If no duplicates or not a new form, proceed with approval
            await proceedWithApproval(formId);
        } catch (error) {
            console.error("Error checking duplicates or approving form:", error);
            toast.error("Failed to approve form", {
                description: "Please try again. If the problem persists, contact support.",
                duration: 5000,
            });
        }
    };

    const proceedWithApproval = async (formId: string) => {
        try {
            const form = data?.forms?.find((f: any) => f._id === formId);
            const result = await approveForm({
                variables: { id: formId }
            });
            
            // Log the result to verify club affiliation change
            console.log("Form approval result:", result.data);
            
            // Show success message based on form type
            if (form?.formType === 'change') {
                toast.success(`Change of registration approved!`, {
                    description: `${form.firstName} ${form.surname} has been transferred to the new club and removed from the previous club.`,
                    duration: 5000,
                });
            } else if (form?.formType === 'renewal') {
                toast.success(`Renewal approved!`, {
                    description: `${form.applicantName || form.firstName + ' ' + form.surname} registration has been renewed.`,
                    duration: 4000,
                });
            } else {
                toast.success(`New registration approved!`, {
                    description: `${form.firstName} ${form.surname} has been registered as a new musher.`,
                    duration: 4000,
                });
            }
        } catch (error) {
            console.error("Error approving form:", error);
            toast.error("Failed to approve form", {
                description: "Please try again. If the problem persists, contact support.",
                duration: 5000,
            });
        }
    };

    const handleDeclineForm = async (formId: string) => {
        try {
            await declineForm({
                variables: { id: formId }
            });
            setShowDeleteModal(false);
            setSelectedFormId(null);
        } catch (error) {
            console.error("Error declining form:", error);
            toast.error("Failed to decline form", {
                description: "Please try again. If the problem persists, contact support.",
                duration: 5000,
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                        <TopHeader placeholder="Search pending forms..." />
                    </div>
                    <main className="flex-1 p-8">
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="w-full">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <Skeleton className="h-6 w-48" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                            <div className="flex gap-2">
                                                <Skeleton className="h-10 w-24" />
                                                <Skeleton className="h-10 w-24" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                        <TopHeader placeholder="Search pending forms..." />
                    </div>
                    <main className="flex-1 p-8">
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 text-red-700">
                                    <XCircle className="h-5 w-5" />
                                    <h3 className="font-semibold">Error loading pending forms</h3>
                                </div>
                                <p className="mt-2 text-red-600">{error.message}</p>
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-4 bg-white border-b">
                    <TopHeader placeholder="Search pending forms..." />
                </div>
                <ScrollArea className="flex-1 bg-gray-50">
                    <div className="px-8 py-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">Pending Registration Forms</h1>
                                <p className="text-gray-600">
                                    Review new registrations and renewals. Change-of-club transfers are managed on{" "}
                                    <button
                                        type="button"
                                        className="text-blue-600 underline"
                                        onClick={() => router.push("/manage-musher/transfers")}
                                    >
                                        Musher Transfers
                                    </button>
                                    .
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/manage-musher')}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back to Mushers
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {data?.forms?.filter((f: { formType: string }) => f.formType !== "change").length > 0 ? (
                                data.forms.filter((f: { formType: string }) => f.formType !== "change").map((form: any) => (
                                    <Card key={form._id} className="overflow-hidden rounded-2xl shadow-md border border-gray-200 bg-white transition-shadow hover:shadow-lg">
                                        <CardHeader className="bg-gray-50 border-b p-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                                                        {form.formType === 'renewal' 
                                                            ? form.applicantName || 'Name not provided'
                                                            : form.firstName && form.surname 
                                                                ? `${form.firstName} ${form.surname}` 
                                                                : form.applicantName || 'Name not provided'}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={form.formType === 'new' ? 'default' : form.formType === 'renewal' ? 'secondary' : 'outline'} className="px-3 py-1 text-sm font-semibold flex items-center gap-1">
                                                            {form.formType === 'new' && <User className="h-4 w-4 mr-1" />} 
                                                            {form.formType === 'renewal' && <CheckCircle2 className="h-4 w-4 mr-1" />} 
                                                            {form.formType === 'change' && <AlertTriangle className="h-4 w-4 mr-1" />} 
                                                            {form.formType === 'new' ? 'New Registration' : form.formType === 'renewal' ? 'Renewal' : 'Change of Registration'}
                                                        </Badge>
                                                        {form.nzfssRegistrationNumber && (
                                                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700 px-2 py-1 font-medium">
                                                                NZFSS: {form.nzfssRegistrationNumber}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {form.formType !== 'renewal' && (
                                                        <div className="flex flex-wrap items-center gap-4 font-medium text-sm text-gray-600">
                                                            {form.email && (
                                                                <div className="flex items-center gap-1">
                                                                    <Mail className="h-4 w-4" />
                                                                    {form.email}
                                                                </div>
                                                            )}
                                                            {form.phone && (
                                                                <div className="flex items-center gap-1">   
                                                                    <Phone className="h-4 w-4" />
                                                                    {form.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={() => handleApproveForm(form._id)}
                                                        className="gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full text-base font-semibold shadow-sm transition-all"
                                                    >
                                                        <CheckCircle2 className="h-5 w-5" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setSelectedFormId(form._id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="gap-2 px-6 py-2.5 rounded-full text-base font-semibold shadow-sm transition-all"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                        Decline
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-4 border-t border-gray-200" />
                                        </CardHeader>
                                        <CardContent className="p-8 bg-gray-50">
                                            {form.formType === 'renewal' ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <User className="h-5 w-5 text-gray-500" />
                                                        <span className="font-semibold text-lg">{form.applicantName || 'Name not provided'}</span>
                                                        {form.nzfssRegistrationNumber && (
                                                            <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 border-blue-200 text-blue-700 ml-2">
                                                                NZFSS: {form.nzfssRegistrationNumber}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-600 text-sm">
                                                        Annual renewal form - no changes to existing information
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg text-gray-800">
                                                            <User className="h-5 w-5" />
                                                            Personal Information
                                                        </h4>
                                                        <div className="space-y-3 text-base">
                                                            {form.address && (
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                                    <span className="font-medium text-gray-700">{form.address}</span>
                                                                </div>
                                                            )}
                                                            {form.dateOfBirth && (
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-5 w-5 text-gray-400" />
                                                                    <span className="font-medium text-gray-700">{form.dateOfBirth}</span>
                                                                </div>
                                                            )}
                                                            {form.email && (
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                                    <span className="font-medium text-gray-700">{form.email}</span>
                                                                </div>
                                                            )}
                                                            {form.phone && (
                                                                <div className="flex items-center gap-2">
                                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                                    <span className="font-medium text-gray-700">{form.phone}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-5 w-5 text-gray-400" />
                                                                <span className="font-medium text-gray-700">Profile Consent:</span>
                                                                {form.showProfileConsent ? (
                                                                    <Badge className="ml-1 bg-green-100 text-green-800 hover:bg-green-100">
                                                                        Consented
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="ml-1 bg-gray-100 text-gray-800 hover:bg-gray-200" variant="outline">
                                                                        Not Consented
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {form.guardianDetails && (
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-5 w-5 text-gray-400" />
                                                                    <span className="font-medium text-gray-700">Guardian: {form.guardianDetails}</span>
                                                                </div>
                                                            )}
                                                            {form.formType === 'change' && (form.affiliationFrom || form.affiliationTo) && (
                                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                    <h5 className="font-semibold text-blue-800 mb-2">Affiliation Change</h5>
                                                                    <div className="space-y-1 text-sm">
                                                                        {form.affiliationFrom && (
                                                                            <div>
                                                                                <span className="font-medium text-blue-700">From: </span>
                                                                                <span className="text-blue-600">{getClubName(form.affiliationFrom)}</span>
                                                                            </div>
                                                                        )}
                                                                        {form.affiliationTo && (
                                                                            <div>
                                                                                <span className="font-medium text-blue-700">To: </span>
                                                                                <span className="text-blue-600">{getClubName(form.affiliationTo)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!form.address && !form.dateOfBirth && !form.email && !form.phone && !form.guardianDetails && (
                                                                <div className="text-gray-400 text-base italic">
                                                                    No additional personal information provided
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg text-gray-800">
                                                            <Dog className="h-5 w-5" />
                                                            Associated Dogs
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {form.dogs && form.dogs.length > 0 ? form.dogs.map((dog: any, index: number) => (
                                                                <Card key={index} className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="space-y-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium">Name:</span>
                                                                                    <span className="font-medium text-gray-700">{dog.petName || 'Not provided'}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium">Breed:</span>
                                                                                    <span className="font-medium text-gray-700">{dog.breed || 'Not provided'}</span>
                                                                                </div>
                                                                                {dog.dateOfBirth && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-medium">DOB:</span>
                                                                                        <span className="font-medium text-gray-700">{dog.dateOfBirth}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <Badge className="border border-gray-300 bg-white text-gray-700" variant="secondary">
                                                                                {dog.nzfssNumber || 'No NZFSS Number'}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="mt-2 space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium">NZKC Registration:</span>
                                                                                <span className="font-medium text-gray-700">{dog.nzkcRegistration || 'N/A'}</span>
                                                                            </div>
                                                                            {dog.nzkcOwner && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium">NZKC Owner:</span>
                                                                                    <span className="font-medium text-gray-700">{dog.nzkcOwner}</span>
                                                                                </div>
                                                                            )}
                                                                            {dog.isDeceased && (
                                                                                <Badge variant="destructive" className="text-xs px-2 py-0.5 rounded-full">
                                                                                    Deceased
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )) : (
                                                                <div className="text-gray-400 text-base">No dogs registered</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="rounded-full  bg-gray-100 p-3">
                                                <User className="h-6 w-6 text-gray-500" />
                                            </div>
                                            <h3 className="text-lg font-semibold">No Pending Forms</h3>
                                            <p className="text-gray-600">There are no pending registration forms to review at this time.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {showDeleteModal && selectedFormId && (
                <Warning
                    open={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedFormId(null);
                    }}
                    data={{ id: selectedFormId }}
                    description="Are you sure you want to decline this registration form?"
                    onConfirm={() => handleDeclineForm(selectedFormId)}
                />
            )}

            {showDuplicateModal && duplicateMusher && pendingFormData && selectedFormId && (
                <Dialog open={showDuplicateModal} onOpenChange={() => {
                    setShowDuplicateModal(false);
                    setDuplicateMusher(null);
                    setPendingFormData(null);
                    setSelectedFormId(null);
                }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Potential Duplicate Musher Found
                            </DialogTitle>
                            <DialogDescription>
                                We found existing musher(s) with similar details. Please review before proceeding.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-800 mb-2">New Registration Details:</h4>
                                <div className="space-y-1 text-sm">
                                    <div><span className="font-medium">Name:</span> {pendingFormData.firstName} {pendingFormData.surname}</div>
                                    <div><span className="font-medium">NZFSS Number:</span> {pendingFormData.nzfssRegistrationNumber || 'Not provided'}</div>
                                </div>
                            </div>
                            
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <h4 className="font-semibold text-orange-800 mb-3">Existing Musher(s) Found:</h4>
                                <div className="space-y-3">
                                    {duplicateMusher.map((musher: any, index: number) => (
                                        <Card key={index} className="bg-white">
                                            <CardContent className="p-3">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium">{musher.name}</div>
                                                            <div className="text-sm text-gray-600">NZFSS: {musher.registrationNo || 'Not provided'}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            Existing Musher
                                                        </Badge>
                                                    </div>
                                                    {musher.dogs && musher.dogs.length > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            Dogs: {musher.dogs.map((dog: any) => dog.name).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-medium mb-1">Please verify:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Is this a genuine new registration for a different person?</li>
                                            <li>Or is this a duplicate submission that should be declined?</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={() => {
                                    setShowDuplicateModal(false);
                                    proceedWithApproval(selectedFormId);
                                    setDuplicateMusher(null);
                                    setPendingFormData(null);
                                    setSelectedFormId(null);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve Anyway
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setShowDuplicateModal(false);
                                    handleDeclineForm(selectedFormId);
                                    setDuplicateMusher(null);
                                    setPendingFormData(null);
                                    setSelectedFormId(null);
                                }}
                                className="flex-1"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline as Duplicate
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDuplicateModal(false);
                                    setDuplicateMusher(null);
                                    setPendingFormData(null);
                                    setSelectedFormId(null);
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <Toaster richColors position="top-right" />
        </div>
    );
};

export default PendingFormsPage;