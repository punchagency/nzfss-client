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
  renderYearbook?: (yearbookName: string, yearbook: string) => React.ReactNode;
  renderFile?: (file: string, fileName: string) => React.ReactNode;
  renderContactImage?: (image: string) => React.ReactNode;
  renderClub?: (club: { club: string }) => React.ReactNode;
  renderEntryForm?: (item: Record<string, any>) => React.ReactNode;
  renderAddResult?: (item: Record<string, any>) => React.ReactNode;
  renderDate?: (item: Record<string, any>) => React.ReactNode;
  renderStatus?: (item: Record<string, any>) => React.ReactNode;
  renderNzfss?: (item: Record<string, any>) => React.ReactNode;
  renderAmmendedDate?: (date: { date: string }) => React.ReactNode;
  renderPublic?: (item: Record<string, any>) => React.ReactNode;
  renderCheckDatePreferred?: (item: Record<string, any>) => React.ReactNode;
  renderCheckDateAlternative?: (item: Record<string, any>) => React.ReactNode;
  renderName?: (item: Record<string, any>) => React.ReactNode;
  renderType?: (item: Record<string, any>) => React.ReactNode;
  renderEventDate?: (item: Record<string, any>) => React.ReactNode;
  isCalendar?: boolean;
}

const Table = ({
  columns,
  data,
  renderAction,
  renderClub,
  renderYearbook,
  renderFile,
  renderContactImage,
  renderEntryForm,
  renderAddResult,
  isCalendar,
  renderDate,
  renderNzfss,
  renderPublic,
  renderCheckDatePreferred,
  renderCheckDateAlternative,
  renderAmmendedDate,
  renderStatus,
  renderName,
  renderType,
  renderEventDate,
}: TableProps) => {
  const [showEventTrigger, setShowEventTrigger] = useState(false);

  const handleLinkClick = () => {
    setShowEventTrigger(true);
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <div
          className={`w-full ${
            isCalendar
              ? "max-h-[calc(75vh-55px)] h-[calc(75vh-55px)] md:h-[calc(75vh-55px)] md:max-h-[calc(75vh-55px)] lg:h-[calc(80vh-55px)] lg:max-h-[calc(80vh-55px)] xl:h-[calc(80vh-55px)] xl:max-h-[calc(80vh-55px)] 2xl:max-h-[calc(75vh-55px)] 2xl:h-[calc(75vh-55px)]"
              : "max-h-[75vh] h-[75vh] md:h-[75vh] md:max-h-[75vh] lg:h-[80vh] lg:max-h-[80vh] xl:h-[80vh] xl:max-h-[80vh] 2xl:max-h-[75vh] 2xl:h-[75vh]"
          } bg-white overflow-y-auto`}
        >
          <table className="w-full table-fixed border-collapse min-w-[26.042vw]">
            <thead className="bg-black text-white sticky top-0 z-10">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-4 py-4 text-[0.833vw] xl:text-[0.833vw] font-normal whitespace-nowrap text-left
                      ${["type", "club", "region", "eventDate", "yearPublish", "preferredDate", "alternativeDate", "date", "NZFSSSanctioning", "entryForm"].includes(column.accessorKey) ? "text-center" : ""}`}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data && data.length > 0 ? (
                data.map((d, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"}  hover:bg-gray-100 transition-colors`}>
                    {columns.map((column, index) => (
                      <td
                        key={index}
                        className={`px-4 py-4 font-[500] text-[#000000] text-[0.833vw]  break-words
                          ${["type", "club", "region", "eventDate", "yearPublish", "preferredDate", "alternativeDate", "date", "NZFSSSanctioning", "entryForm"].includes(column.accessorKey) ? "text-center" : ""}`}
                        style={column.width ? { width: column.width } : undefined}
                      >
                        {column.accessorKey === "image" && renderContactImage
                          ? renderContactImage(d[column.accessorKey])
                          : column.accessorKey === "yearbook" && renderYearbook
                          ? renderYearbook(d.yearbookName, d.yearbook)
                          : column.accessorKey === "file" && renderFile
                          ? renderFile(d.file, d.fileName)
                          : column.accessorKey === "action"
                          ? renderAction(d)
                          : column.accessorKey === "entryForm" && renderEntryForm
                          ? renderEntryForm(d)
                          : column.accessorKey === "result" && renderAddResult
                          ? renderAddResult(d)
                          : column.accessorKey === "club" && renderClub
                          ? renderClub({ club: d[column.accessorKey] })
                          : column.accessorKey === "date" && renderDate
                          ? renderDate(d)
                          : column.accessorKey === "NZFSSSanctioning" && renderNzfss
                          ? renderNzfss(d)
                          : column.accessorKey === "eventName" && renderName
                          ? renderName(d)
                          : column.accessorKey === "type" && renderType
                          ? renderType(d)
                          : column.accessorKey === "amendedDate" && renderAmmendedDate
                          ? renderAmmendedDate({ date: d[column.accessorKey] || "" })
                          : column.accessorKey === "public" && renderPublic
                          ? renderPublic(d)
                          : column.accessorKey === "status" && renderStatus
                          ? renderStatus(d)
                          : column.accessorKey === "preferredDate" && renderCheckDatePreferred
                          ? renderCheckDatePreferred(d)
                          : column.accessorKey === "alternativeDate" && renderCheckDateAlternative
                          ? renderCheckDateAlternative(d)
                          : column.accessorKey === "eventDate" && renderEventDate
                          ? renderEventDate(d)
                          : d[column.accessorKey]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    <div className="flex justify-center items-center w-full pt-[120px] lg:pt-[200px] 3xl:pt-[332.5px]">
                      No data available
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
    </div>
  );
};

export default Table;
