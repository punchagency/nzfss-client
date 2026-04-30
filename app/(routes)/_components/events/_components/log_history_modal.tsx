import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@apollo/client";
import { GET_LOG_HISTORY } from "@/graphql/query/log";

interface LogHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrantId: string;
}

interface Dog {
  driverName: string;
  name: string;
  NZFSSRegistration: string;
  dob: string;
  breed: string;
}

interface Log {
  _id: string;
  action: string;
  oldData: string;
  newData: string;
  createdAt: string;
}

export const LogHistoryModal = ({ isOpen, onClose, entrantId }: LogHistoryModalProps) => {
  const { data, loading } = useQuery(GET_LOG_HISTORY, {
    variables: { entrantId },
    skip: !isOpen,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return "not set";
    if (Array.isArray(value)) {
      // Handle arrays (like associatedDog)
      return value.map((item) => {
        if (typeof item === "object" && item !== null) {
          // Format dog objects specifically
          if ("name" in item && "breed" in item) {
            return `${item.name} (${item.breed})`;
          }
          return Object.entries(item)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
        }
        return String(item);
      }).join(", ");
    }
    if (typeof value === "object" && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return String(value);
  };

  const formatChanges = (oldDataStr: string, newDataStr: string) => {
    try {
      const oldData = JSON.parse(oldDataStr);
      const newData = JSON.parse(newDataStr);
      const changes = [];
      
      for (const key in newData) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          const oldValue = formatValue(oldData[key]);
          const newValue = formatValue(newData[key]);
          
          // Skip if both values are "[object Object]" or empty arrays
          if (oldValue === "[object Object]" && newValue === "[object Object]") continue;
          if (oldValue === "" && newValue === "") continue;
          
          changes.push(`${key} was changed from "${oldValue}" to "${newValue}"`);
        }
      }
      
      return changes;
    } catch (error) {
      console.error("Error parsing log data:", error);
      return ["Error: Could not parse change data"];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <h1 className="text-[1.458vw] text-[#000000] font-[700]">Log History</h1>
          <p className="text-[0.938vw] text-[#4F4F4F] font-[500]">Please add the details of the entrants.</p>
        </DialogHeader>
        <div className="mt-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Recent</h3>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : data?.findLogsByEntrantId?.length > 0 ? (
                data.findLogsByEntrantId
                  .filter((log: Log) => {
                    const date = new Date(log.createdAt);
                    const now = new Date();
                    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                    return daysDiff <= 7;
                  })
                  .map((log: Log) => (
                    <div key={log._id} className="bg-gray-50 p-4 rounded-lg mt-2">
                      <p className="font-[500] text-[#000000] text-[0.95vw]">{formatChanges(log.oldData, log.newData).join(", ")}</p>
                      <p className="font-[500] text-[#696A6A] text-[0.95vw] mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                  ))
              ) : (
                <p className="font-[500] text-[#000000] text-[0.95vw]">No recent changes</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium">Old</h3>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : data?.findLogsByEntrantId?.filter((log: Log) => {
                    const date = new Date(log.createdAt);
                    const now = new Date();
                    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                    return daysDiff > 7;
                  }).length > 0 ? (
                data.findLogsByEntrantId
                  .filter((log: Log) => {
                    const date = new Date(log.createdAt);
                    const now = new Date();
                    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                    return daysDiff > 7;
                  })
                  .map((log: Log) => (
                    <div key={log._id} className="border rounded-lg p-4 mt-2">
                      <p className="font-[500] text-[#000000] text-[0.95vw]">{formatChanges(log.oldData, log.newData).join(", ")}</p>
                      <p className="font-[500] text-[#696A6A] text-[0.95vw] mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                  ))
              ) : (
                <p className="font-[500] text-[#000000] text-[0.95vw]">No older changes</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 