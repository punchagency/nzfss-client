"use client";

import { Sidebar } from "@/app/(routes)/_components/sidebar";
import TopHeader from "@/app/(routes)/_components/top_header";
import { useUser } from "@/context/user_context";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { GET_ALL_CLUBS } from "@/graphql/query/clubs";
import {
  APPROVE_FORM,
  DECLINE_FORM,
  GET_DOG_TRANSFERS,
  REQUEST_DOG_TRANSFER,
} from "@/graphql/mutation/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Warning from "@/components/warning";
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronLeft,
  Dog as DogIcon,
  Plus,
  XCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";

interface Club {
  _id: string;
  name: string;
}

interface MusherDog {
  dogId?: string;
  name?: string;
  nzfssNo?: string;
  breed?: string;
}

interface ClubMusher {
  id: string;
  name: string;
  registrationNo?: string;
  club?: string;
  dogs?: MusherDog[];
}

// Full dog detail is needed to pick a dog and to send its identifier.
const GET_CLUB_MUSHERS_WITH_DOGS = gql`
  query GetClubMushersForDogTransfer($clubId: String) {
    getClubMushers(clubId: $clubId) {
      id
      name
      registrationNo
      dogs {
        dogId
        name
        nzfssNo
        breed
      }
    }
  }
`;

const DogTransfersPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [declineFormId, setDeclineFormId] = useState<string | null>(null);
  const [startTransferOpen, setStartTransferOpen] = useState(false);
  const [sourceMusherId, setSourceMusherId] = useState("");
  const [selectedDogKey, setSelectedDogKey] = useState("");
  const [destinationClubId, setDestinationClubId] = useState("");
  const [destinationMusherId, setDestinationMusherId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_DOG_TRANSFERS, {
    variables: { clubId: user?._id },
    skip: !user?._id,
  });

  const { data: clubsData } = useQuery(GET_ALL_CLUBS);

  const { data: sourceMushersData } = useQuery(GET_CLUB_MUSHERS_WITH_DOGS, {
    variables: { clubId: user?._id },
    skip: !user?._id,
  });

  // Destination mushers depend on the chosen destination club.
  const { data: destMushersData } = useQuery(GET_CLUB_MUSHERS_WITH_DOGS, {
    variables: { clubId: destinationClubId },
    skip: !destinationClubId,
  });

  const [requestDogTransfer] = useMutation(REQUEST_DOG_TRANSFER);

  const [approveForm] = useMutation(APPROVE_FORM, {
    onCompleted: () => refetch(),
  });
  const [declineForm] = useMutation(DECLINE_FORM, {
    onCompleted: () => refetch(),
  });

  const sourceMushers: ClubMusher[] = sourceMushersData?.getClubMushers || [];
  const destinationMushers: ClubMusher[] = (
    destMushersData?.getClubMushers || []
  ).filter((m: ClubMusher) => m.id !== sourceMusherId);

  const selectedSourceMusher = sourceMushers.find(
    (m) => m.id === sourceMusherId
  );

  // A dog is keyed by dogId when it has one, else by registration, so the
  // dropdown can tell two same-named dogs apart.
  const dogKey = (dog: MusherDog, index: number): string =>
    dog.dogId || dog.nzfssNo || `idx-${index}`;

  const selectedDog = selectedSourceMusher?.dogs?.find(
    (dog, i) => dogKey(dog, i) === selectedDogKey
  );

  const isSameClub = !!destinationClubId && destinationClubId === user?._id;

  const closeModal = () => {
    setStartTransferOpen(false);
    setSourceMusherId("");
    setSelectedDogKey("");
    setDestinationClubId("");
    setDestinationMusherId("");
  };

  const handleRequestTransfer = async () => {
    if (!selectedDog || !sourceMusherId || !destinationMusherId) {
      toast.error("Select a dog, a source musher, and a destination musher");
      return;
    }
    // Prefer the stable dogId; fall back to the registration number.
    const dogIdentifier = selectedDog.dogId || selectedDog.nzfssNo || "";
    if (!dogIdentifier) {
      toast.error(
        "This dog has no ID or registration number and cannot be transferred automatically"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await requestDogTransfer({
        variables: {
          input: {
            dogId: dogIdentifier,
            sourceMusherId,
            destinationMusherId,
          },
        },
      });
      if (isSameClub) {
        toast.success(`${selectedDog.name || "Dog"} moved`, {
          description: `Now owned by ${
            destinationMushers.find((m) => m.id === destinationMusherId)?.name ||
            "the new musher"
          }. NZFSS number and race history are unchanged.`,
        });
      } else {
        toast.success(`${selectedDog.name || "Dog"} transfer requested`, {
          description:
            "The destination club must accept before the dog moves. NZFSS number stays the same.",
        });
      }
      closeModal();
      refetch();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to request dog transfer";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClubName = (clubId: string): string => {
    if (!clubId || !clubsData?.getAllClubs) return clubId || "Unknown club";
    const club = clubsData.getAllClubs.find((c: Club) => c._id === clubId);
    return club ? club.name : clubId;
  };

  const incoming =
    data?.forms?.filter(
      (f: { affiliationTo: string; toClubApproval: string }) =>
        f.affiliationTo === user?._id && f.toClubApproval === "pending"
    ) || [];

  const outgoing =
    data?.forms?.filter(
      (f: {
        affiliationFrom: string;
        fromClubApproval: string;
        toClubApproval: string;
      }) =>
        f.affiliationFrom === user?._id &&
        f.fromClubApproval === "approved" &&
        f.toClubApproval === "pending"
    ) || [];

  const handleApprove = async (
    formId: string,
    label: string,
    isIncoming: boolean
  ) => {
    try {
      const result = await approveForm({ variables: { id: formId } });
      const updated = result.data?.approveForm;
      if (updated?.status === "approved") {
        toast.success("Transfer complete", {
          description: `${label} has moved to the new musher. NZFSS number is unchanged.`,
        });
      } else if (isIncoming) {
        toast.success("Transfer accepted", {
          description: `${label} will move once the current club also approves (if required).`,
        });
      } else {
        toast.success("Release approved");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve transfer");
    }
  };

  const handleDecline = async (formId: string) => {
    try {
      await declineForm({ variables: { id: formId } });
      setDeclineFormId(null);
      toast.success("Transfer declined");
    } catch (err) {
      console.error(err);
      toast.error("Failed to decline transfer");
    }
  };

  const renderTransferCard = (
    form: {
      _id: string;
      applicantName?: string;
      sourceMusherName?: string;
      destinationMusherName?: string;
      affiliationFrom?: string;
      affiliationTo?: string;
      fromClubApproval?: string;
      toClubApproval?: string;
      dogs?: Array<{ petName?: string; nzfssNumber?: string; breed?: string }>;
    },
    options: { variant: "incoming" | "outgoing" }
  ) => {
    const dog = form.dogs?.[0];
    const label = dog?.petName || form.applicantName || "Dog";
    const canApproveIncoming =
      options.variant === "incoming" && form.toClubApproval === "pending";
    const canDecline = true;

    return (
      <Card key={form._id} className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <DogIcon className="h-5 w-5" />
                {label}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {dog?.nzfssNumber && (
                  <Badge variant="outline">NZFSS: {dog.nzfssNumber}</Badge>
                )}
                {dog?.breed && <Badge variant="secondary">{dog.breed}</Badge>}
                <Badge variant="outline">
                  {form.sourceMusherName || "Source"} →{" "}
                  {form.destinationMusherName || "Destination"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {canApproveIncoming && (
                <Button
                  className="bg-green-600 hover:bg-green-700 gap-1"
                  onClick={() => handleApprove(form._id, label, true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept
                </Button>
              )}
              {canDecline && (
                <Button
                  variant="destructive"
                  className="gap-1"
                  onClick={() => setDeclineFormId(form._id)}
                >
                  <XCircle className="h-4 w-4" />
                  Decline
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              From club: <strong>{getClubName(form.affiliationFrom || "")}</strong>
            </span>
            <span>
              To club: <strong>{getClubName(form.affiliationTo || "")}</strong>
            </span>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge
              className={
                form.fromClubApproval === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700"
              }
            >
              Release: {form.fromClubApproval || "pending"}
            </Badge>
            <Badge
              className={
                form.toClubApproval === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700"
              }
            >
              Accept: {form.toClubApproval || "pending"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            The dog&apos;s NZFSS registration number and race history stay the same
            after transfer.
          </p>
          {options.variant === "outgoing" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
              Waiting for {getClubName(form.affiliationTo || "")} to accept this
              transfer.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <TopHeader placeholder="Search dog transfers..." />
        </div>
        <ScrollArea className="flex-1 bg-gray-50">
          <div className="px-8 py-6 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <ArrowRightLeft className="h-6 w-6" />
                  Dog Transfers
                </h1>
                <p className="text-gray-600">
                  Move a dog to another musher. Same-club moves apply
                  immediately; cross-club moves need the destination club to
                  accept.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={() => setStartTransferOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start dog transfer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/manage-musher")}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Mushers
                </Button>
              </div>
            </div>

            {loading && <p className="text-gray-500">Loading transfers...</p>}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-red-700">
                  {error.message}
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Incoming — action required ({incoming.length})
                  </h2>
                  {incoming.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No incoming dog transfers.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {incoming.map((form: (typeof incoming)[0]) =>
                        renderTransferCard(form, { variant: "incoming" })
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Outgoing — waiting on other club ({outgoing.length})
                  </h2>
                  {outgoing.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No outgoing dog transfers.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {outgoing.map((form: (typeof outgoing)[0]) =>
                        renderTransferCard(form, { variant: "outgoing" })
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {declineFormId && (
        <Warning
          open={!!declineFormId}
          onClose={() => setDeclineFormId(null)}
          data={{ id: declineFormId }}
          description="Decline this dog transfer? The dog will stay with its current musher."
          onConfirm={() => handleDecline(declineFormId)}
        />
      )}

      <Dialog
        open={startTransferOpen}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transfer a dog to another musher</DialogTitle>
            <DialogDescription>
              Pick the dog, then the musher it should move to. Moving within your
              own club happens immediately; moving to another club requires that
              club to accept. NZFSS registration numbers stay the same.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Current musher</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={sourceMusherId}
                onChange={(e) => {
                  setSourceMusherId(e.target.value);
                  setSelectedDogKey("");
                }}
              >
                <option value="">Select the dog&apos;s current musher</option>
                {sourceMushers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.registrationNo ? ` (${m.registrationNo})` : ""} —{" "}
                    {m.dogs?.length || 0} dog
                    {(m.dogs?.length || 0) === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>

            {selectedSourceMusher && (
              <div>
                <label className="block mb-2 font-medium">Dog to transfer</label>
                <select
                  className="w-full p-3 border rounded-lg"
                  value={selectedDogKey}
                  onChange={(e) => setSelectedDogKey(e.target.value)}
                >
                  <option value="">Select a dog</option>
                  {(selectedSourceMusher.dogs || []).map((dog, i) => (
                    <option key={dogKey(dog, i)} value={dogKey(dog, i)}>
                      {dog.name || "Unnamed"}
                      {dog.nzfssNo ? ` (${dog.nzfssNo})` : ""}
                      {dog.breed ? ` — ${dog.breed}` : ""}
                    </option>
                  ))}
                </select>
                {(selectedSourceMusher.dogs || []).length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    This musher has no dogs to transfer.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block mb-2 font-medium">Destination club</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={destinationClubId}
                onChange={(e) => {
                  setDestinationClubId(e.target.value);
                  setDestinationMusherId("");
                }}
              >
                <option value="">Select destination club</option>
                {(clubsData?.getAllClubs || []).map((club: Club) => (
                  <option key={club._id} value={club._id}>
                    {club.name}
                    {club._id === user?._id ? " (your club)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {destinationClubId && (
              <div>
                <label className="block mb-2 font-medium">
                  Destination musher
                </label>
                <select
                  className="w-full p-3 border rounded-lg"
                  value={destinationMusherId}
                  onChange={(e) => setDestinationMusherId(e.target.value)}
                >
                  <option value="">Select destination musher</option>
                  {destinationMushers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                      {m.registrationNo ? ` (${m.registrationNo})` : ""}
                    </option>
                  ))}
                </select>
                {destinationMushers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No other mushers available in this club.
                  </p>
                )}
              </div>
            )}

            {selectedDog && destinationMusherId && (
              <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                {isSameClub ? (
                  <p>
                    <strong>{selectedDog.name}</strong> will move to the selected
                    musher immediately (same club).
                  </p>
                ) : (
                  <p>
                    <strong>{selectedDog.name}</strong> will move once{" "}
                    {getClubName(destinationClubId)} accepts the transfer.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={
                  isSubmitting ||
                  !selectedDog ||
                  !destinationMusherId ||
                  sourceMusherId === destinationMusherId
                }
                onClick={handleRequestTransfer}
              >
                {isSubmitting
                  ? "Working..."
                  : isSameClub
                  ? "Move dog"
                  : "Request transfer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-right" />
    </div>
  );
};

export default DogTransfersPage;
