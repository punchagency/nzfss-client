"use client";

import { useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import Table from "@/app/(routes)/_components/data_table";
import { Loading } from "@/components/skeleton";
import { useToast } from "@/hooks/use-toast";
import Warning from "@/components/warning";
import { useSearch } from "@/app/context/SearchContext";
import { buildTabDelimited, downloadTextFile } from "@/utils/download";
import {
  GET_UNRECOGNISED_TITLE_CHANGES,
  type UnrecognisedTitleChange,
} from "@/graphql/query/titleChanges";
import { RECOGNISE_TITLE_CHANGES } from "@/graphql/mutation/titleChanges";

const EXPORT_HEADERS = [
  "Dog Name",
  "Pedigree Name",
  "NZFSS Number",
  "Owner Name",
  "Previous Title",
  "New Title",
];

const TitleChangesPage = () => {
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [hasRun, setHasRun] = useState(false);
  const [isRecogniseWarningOpen, setIsRecogniseWarningOpen] = useState(false);

  const [fetchTitleChanges, { data, loading }] = useLazyQuery(
    GET_UNRECOGNISED_TITLE_CHANGES,
    {
      fetchPolicy: "network-only",
      onError: (error) => {
        toast({
          title: "Error loading title changes",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  const [recogniseTitleChanges, { loading: recognising }] = useMutation(
    RECOGNISE_TITLE_CHANGES,
    {
      onCompleted: (result) => {
        const count = result?.recogniseTitleChanges?.recognisedCount ?? 0;
        toast({
          title: "Title changes recognised",
          description: `${count} dog(s) updated.`,
        });
        fetchTitleChanges();
      },
      onError: (error) => {
        toast({
          title: "Error recognising title changes",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  const changes: UnrecognisedTitleChange[] =
    data?.getUnrecognisedTitleChanges || [];

  const filteredChanges = changes.filter((change) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (change.dogName || "").toLowerCase().includes(query) ||
      (change.pedigreeName || "").toLowerCase().includes(query) ||
      (change.ownerName || "").toLowerCase().includes(query) ||
      (change.nzfssNo || "").toLowerCase().includes(query)
    );
  });

  function handleShowTitleChanges() {
    setHasRun(true);
    fetchTitleChanges();
  }

  function handleExport() {
    if (filteredChanges.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Run “Show Title Changes” first.",
        variant: "destructive",
      });
      return;
    }

    const rows = filteredChanges.map((change) => [
      change.dogName,
      change.pedigreeName,
      change.nzfssNo,
      change.ownerName,
      change.previousTitle,
      change.newTitle,
    ]);

    const content = buildTabDelimited(EXPORT_HEADERS, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      content,
      `title-changes-${stamp}.txt`,
      "text/tab-separated-values;charset=utf-8"
    );
  }

  async function handleRecogniseConfirm() {
    setIsRecogniseWarningOpen(false);
    const dogIds = filteredChanges.map((change) => change.dogId);
    if (dogIds.length === 0) return;

    await recogniseTitleChanges({ variables: { input: { dogIds } } });
  }

  const columns = [
    { header: "Dog Name", accessorKey: "dogName" },
    { header: "Pedigree Name", accessorKey: "pedigreeName" },
    { header: "NZFSS Number", accessorKey: "nzfssNo" },
    { header: "Owner Name", accessorKey: "ownerName" },
    { header: "Previous Title", accessorKey: "previousTitle" },
    { header: "New Title", accessorKey: "newTitle" },
  ];

  const recogniseWarningText = `Are you sure you want to recognise title changes for ${filteredChanges.length} dog(s)? This issues certificates for their highest earned title.`;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Title Changes</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleShowTitleChanges}
            disabled={loading}
            className="px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Checking…" : "Show Title Changes"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredChanges.length === 0}
            className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            Export List
          </button>
          <button
            type="button"
            onClick={() => setIsRecogniseWarningOpen(true)}
            disabled={filteredChanges.length === 0 || recognising}
            className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {recognising ? "Recognising…" : "Recognise Title Changes"}
          </button>
        </div>
      </div>

      {hasRun && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredChanges.length} dog(s) with unrecognised title upgrades
        </div>
      )}

      {loading ? (
        <Loading />
      ) : hasRun ? (
        <Table columns={columns} data={filteredChanges} renderAction={() => null} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
          <p>Click “Show Title Changes” to run the check.</p>
        </div>
      )}

      <Warning
        open={isRecogniseWarningOpen}
        onClose={() => setIsRecogniseWarningOpen(false)}
        onConfirm={handleRecogniseConfirm}
        description={recogniseWarningText}
      />
    </div>
  );
};

export default TitleChangesPage;
