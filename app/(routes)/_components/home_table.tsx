"use client"

import { useState } from "react";
import CalenderTrigger from "./triggers/calender_trigger";
import EventTrigger from "./triggers/event_trigger";

interface Column {
  accessorKey: string;
  header: React.ReactNode;
  width?: string;
}

interface TableProps {
  columns: Column[];
  data: Record<string, any>[]; // Array of rows
  renderAction: (item: Record<string, any>) => React.ReactNode;
}

const HomeTable = ({
  columns,
  data,
  renderAction,
}: TableProps) => {
  const [showEventTrigger, setShowEventTrigger] = useState(false);

  const handleLinkClick = () => {
    setShowEventTrigger(true);
  };


  return (
    <div className="relative overflow-x-auto">
      {/* This div now holds the table with scrolling enabled */}
      <div
        className={`overflow-y-auto bg-[#F3F3F3] `}
      >
        <table className="min-w-full ">
          {/* Header with sticky positioning */}
          <thead className="bg-[#ECECEF] text-[#000000] sticky top-0 z-10 h-[80px] ">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  style={{ width: column.width }}
                  className={`px-4 py-2  text-left text-[16px] font-semibold`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body that should be scrollable */}

          <tbody className="">
            {data && data.length > 0 ? (
              data.map((d, i) => (
                <tr key={i} className="bg-[#F3F3F3] rounded-[24px]">
                  {columns.map((column, index) => (
                    <td
                      key={index}
                      style={{ width: column.width }}
                      className={`px-4 py-2 border-t font-[600] 
              ${
                column.accessorKey === "amended" && "text-center",
                column.accessorKey === "club" && "text-center",
                column.accessorKey === "type" && "text-center"
              }
              `}
                    >
                      { // Render file if applicable
                        column.accessorKey === "action"
                        ? renderAction(d) 
                        : d[column.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  <div className="flex  justify-center items-center w-full pt-[120px] lg:pt-[200px] 3xl:pt-[332.5px]">
                    <p className="text-[18px] font-[600] leading-[25.2px]">
                      There is no new race event, please <br />
                      <button
                        className="text-[#2A72DF] instant-anim"
                        onClick={handleLinkClick}
                      >
                        add a new race event
                      </button>
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {showEventTrigger && (
          <EventTrigger
            onClose={setShowEventTrigger}
            open={showEventTrigger}
          />
        )}
      </div>
    </div>
  );
};

export default HomeTable;
