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
  GET_MUSHER_TRANSFERS,
  REQUEST_MUSHER_TRANSFER,
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
  Dog,
  Plus,
  XCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";

interface Club {
  _id: string;
  name: string;
}

interface ClubMusher {
  id: string;
  name: string;
  registrationNo?: string;
  dogs?: Array<{ name?: string }>;
}

const GET_CLUB_MUSHERS = gql`
  query GetClubMushersForTransfer($clubId: String) {
    getClubMushers(clubId: $clubId) {
      id
      name
      registrationNo
      dogs {
        name
      }
    }
  }
`;

const TransfersPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [declineFormId, setDeclineFormId] = useState<string | null>(null);
  const [startTransferOpen, setStartTransferOpen] = useState(false);
  const [selectedMusherId, setSelectedMusherId] = useState("");
  const [transferDestinationId, setTransferDestinationId] = useState("");
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_MUSHER_TRANSFERS, {
    variables: { clubId: user?._id },
    skip: !user?._id,
  });

  const { data: clubsData } = useQuery(GET_ALL_CLUBS);

  const { data: mushersData } = useQuery(GET_CLUB_MUSHERS, {
    variables: { clubId: user?._id },
    skip: !user?._id,
  });

  const [requestMusherTransfer] = useMutation(REQUEST_MUSHER_TRANSFER);

  const pendingMusherIds = useMemo(() => {
    const ids = new Set<string>();
    for (const form of data?.forms || []) {
      if (form.musherId) ids.add(form.musherId);
    }
    return ids;
  }, [data?.forms]);

  const transferableMushers = useMemo(
    () =>
      (mushersData?.getClubMushers || []).filter(
        (m: ClubMusher) => !pendingMusherIds.has(m.id)
      ),
    [mushersData?.getClubMushers, pendingMusherIds]
  );

  const selectedMusher = transferableMushers.find(
    (m: ClubMusher) => m.id === selectedMusherId
  );

  const closeStartTransferModal = () => {
    setStartTransferOpen(false);
    setSelectedMusherId("");
    setTransferDestinationId("");
  };

  const handleRequestTransfer = async () => {
    if (!selectedMusherId || !transferDestinationId) {
      toast.error("Please select a musher and destination club");
      return;
    }
    setIsTransferSubmitting(true);
    try {
      await requestMusherTransfer({
        variables: {
          input: {
            musherId: selectedMusherId,
            destinationClubId: transferDestinationId,
          },
        },
      });
      toast.success(`${selectedMusher?.name || "Musher"} transfer requested`, {
        description:
          "The destination club must accept before the musher moves. NZFSS numbers stay the same.",
      });
      closeStartTransferModal();
      refetch();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to request transfer";
      toast.error(message);
    } finally {
      setIsTransferSubmitting(false);
    }
  };

  const [approveForm] = useMutation(APPROVE_FORM, {
    onCompleted: () => refetch(),
  });

  const [declineForm] = useMutation(DECLINE_FORM, {
    onCompleted: () => refetch(),
  });

  const getClubName = (clubId: string): string => {
    if (!clubId || !clubsData?.getAllClubs) return clubId || "Unknown club";
    const club = clubsData.getAllClubs.find((c: Club) => c._id === clubId);
    return club ? club.name : clubId;
  };

  const musherLabel = (form: {
    applicantName?: string;
    firstName?: string;
    surname?: string;
  }) =>
    form.applicantName ||
    `${form.firstName || ""} ${form.surname || ""}`.trim() ||
    "Unknown musher";

  const incoming =
    data?.forms?.filter(
      (f: { affiliationTo: string; toClubApproval: string }) =>
        f.affiliationTo === user?._id && f.toClubApproval === "pending"
    ) || [];

  const outgoing =
    data?.forms?.filter(
      (f: { affiliationFrom: string; fromClubApproval: string; toClubApproval: string }) =>
        f.affiliationFrom === user?._id &&
        f.fromClubApproval === "approved" &&
        f.toClubApproval === "pending"
    ) || [];

  const awaitingOther =
    data?.forms?.filter(
      (f: { affiliationFrom: string; fromClubApproval: string; toClubApproval: string }) =>
        f.affiliationFrom === user?._id &&
        f.fromClubApproval === "pending" &&
        f.toClubApproval === "pending"
    ) || [];

  const handleApprove = async (formId: string, label: string, isIncoming: boolean) => {
    try {
      const result = await approveForm({ variables: { id: formId } });
      const updated = result.data?.approveForm;
      if (updated?.status === "approved") {
        toast.success("Transfer complete", {
          description: `${label} has moved to the new club. NZFSS numbers are unchanged.`,
        });
      } else if (isIncoming) {
        toast.success("Transfer accepted", {
          description: `${label} will move once the current club also approves (if required).`,
        });
      } else {
        toast.success("Release approved", {
          description: `Waiting for ${label}'s destination club to accept.`,
        });
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
      firstName?: string;
      surname?: string;
      nzfssRegistrationNumber?: string;
      affiliationFrom?: string;
      affiliationTo?: string;
      fromClubApproval?: string;
      toClubApproval?: string;
      musherId?: string;
      dogs?: Array<{ petName?: string; nzfssNumber?: string; breed?: string }>;
    },
    options: {
      variant: "incoming" | "outgoing" | "awaiting";
    }
  ) => {
    const label = musherLabel(form);
    const dogCount = form.dogs?.length || 0;
    const canApproveIncoming =
      options.variant === "incoming" && form.toClubApproval === "pending";
    const canApproveRelease =
      options.variant === "awaiting" && form.fromClubApproval === "pending";
    const canDecline =
      options.variant === "incoming" ||
      options.variant === "awaiting" ||
      (options.variant === "outgoing" && form.fromClubApproval === "approved");

    return (
      <Card key={form._id} className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl">{label}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.nzfssRegistrationNumber && (
                  <Badge variant="outline">NZFSS: {form.nzfssRegistrationNumber}</Badge>
                )}
                {form.musherId && (
                  <Badge variant="secondary">Club-initiated</Badge>
                )}
                <Badge variant="outline">
                  {getClubName(form.affiliationFrom || "")} →{" "}
                  {getClubName(form.affiliationTo || "")}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {(canApproveIncoming || canApproveRelease) && (
                <Button
                  className="bg-green-600 hover:bg-green-700 gap-1"
                  onClick={() =>
                    handleApprove(form._id, label, canApproveIncoming)
                  }
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {canApproveIncoming ? "Accept" : "Release"}
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
              Current club:{" "}
              <strong>{getClubName(form.affiliationFrom || "")}</strong>
            </span>
            <span>
              Destination:{" "}
              <strong>{getClubName(form.affiliationTo || "")}</strong>
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
            NZFSS registration numbers stay the same after transfer. Race history
            is not changed.
          </p>
          {dogCount > 0 && (
            <div>
              <p className="text-sm font-medium flex items-center gap-1 mb-2">
                <Dog className="h-4 w-4" />
                {dogCount} dog{dogCount === 1 ? "" : "s"} included
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {form.dogs?.slice(0, 6).map((dog, i) => (
                  <li key={i}>
                    {dog.petName || "Unnamed"}
                    {dog.nzfssNumber ? ` (${dog.nzfssNumber})` : ""}
                    {dog.breed ? ` — ${dog.breed}` : ""}
                  </li>
                ))}
                {dogCount > 6 && (
                  <li className="text-gray-400">+{dogCount - 6} more</li>
                )}
              </ul>
            </div>
          )}
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
          <TopHeader placeholder="Search transfers..." />
        </div>
        <ScrollArea className="flex-1 bg-gray-50">
          <div className="px-8 py-6 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <ArrowRightLeft className="h-6 w-6" />
                  Musher Transfers
                </h1>
                <p className="text-gray-600">
                  Dual-club approval: current club releases, destination club
                  accepts. All dogs move with the musher.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => setStartTransferOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Start transfer
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
                <CardContent className="p-4 text-red-700">{error.message}</CardContent>
              </Card>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Incoming — action required ({incoming.length})
                  </h2>
                  {incoming.length === 0 ? (
                    <p className="text-gray-500 text-sm">No incoming transfers.</p>
                  ) : (
                    <div className="space-y-4">
                      {incoming.map((form: typeof incoming[0]) =>
                        renderTransferCard(form, { variant: "incoming" })
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Awaiting your release ({awaitingOther.length})
                  </h2>
                  {awaitingOther.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No transfers waiting for your release approval.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {awaitingOther.map((form: typeof awaitingOther[0]) =>
                        renderTransferCard(form, { variant: "awaiting" })
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Outgoing — waiting on other club ({outgoing.length})
                  </h2>
                  {outgoing.length === 0 ? (
                    <p className="text-gray-500 text-sm">No outgoing transfers.</p>
                  ) : (
                    <div className="space-y-4">
                      {outgoing.map((form: typeof outgoing[0]) =>
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
          description="Decline this musher transfer? The musher will stay with their current club."
          onConfirm={() => handleDecline(declineFormId)}
        />
      )}

      <Dialog open={startTransferOpen} onOpenChange={(open) => !open && closeStartTransferModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transfer musher to another club</DialogTitle>
            <DialogDescription>
              The destination club must accept before the musher and all their dogs
              move. NZFSS registration numbers stay the same.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Musher</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={selectedMusherId}
                onChange={(e) => setSelectedMusherId(e.target.value)}
              >
                <option value="">Select a musher</option>
                {transferableMushers.map((m: ClubMusher) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.registrationNo ? ` (${m.registrationNo})` : ""}
                  </option>
                ))}
              </select>
              {transferableMushers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No mushers available — all may already have a pending transfer.
                </p>
              )}
            </div>
            {selectedMusher && (
              <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                <p>
                  {(selectedMusher.dogs?.length || 0)} dog
                  {(selectedMusher.dogs?.length || 0) === 1 ? "" : "s"} will
                  transfer with this musher.
                </p>
              </div>
            )}
            <div>
              <label className="block mb-2 font-medium">Destination club</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={transferDestinationId}
                onChange={(e) => setTransferDestinationId(e.target.value)}
              >
                <option value="">Select destination club</option>
                {(clubsData?.getAllClubs || [])
                  .filter((club: Club) => club._id !== user?._id)
                  .map((club: Club) => (
                    <option key={club._id} value={club._id}>
                      {club.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={closeStartTransferModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={
                  isTransferSubmitting ||
                  !selectedMusherId ||
                  !transferDestinationId
                }
                onClick={handleRequestTransfer}
              >
                {isTransferSubmitting ? "Requesting..." : "Request transfer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-right" />
    </div>
  );
};

export default TransfersPage;
