import React, { useState } from "react";

import Table from "../../_components/data_table";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import ActionIcons from "../../_components/actions_ buttons";
import EntryForm from "../../_components/entry_form";
import { usePathname } from "next/navigation";
import { EventCalendar } from "@/interface";
import DateButton from "../date_button";
import PublicButton from "../public_button";
import CheckDate from "../checkDate";
import { CreateEventCalendarInput, useEvent } from "@/service/eventService";
import { Loading } from "@/components/skeleton";
import Image from "next/image";
import { pdf } from "@/assets";
import DateButtonNzfss from "../date_button_nszss";
import RenderEntryForm from "../events/_components/entry_form";
import Name from "../name";
import { useSearch } from "@/app/context/SearchContext";
import { getClubAbbreviation } from "@/utils/clubAbbreviations";
import { useSortDirection } from "../../_components/tab";

interface Column {
  accessorKey: keyof EventCalendar;
  header: React.ReactNode;
  width: string;
}

const DraftedCalendar = () => {
  const pathname = usePathname();

  const [selectedDates, setSelectedDates] = useState<Record<string, string>>(
    {}
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const isCalendar = pathname === "/calendar";

  const { events, loading, error, updateEvent } = useEvent();

  const { searchQuery } = useSearch();
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Preferred Date column with sort button
  const preferredDateHeader = (
    <div className="text-center flex items-center justify-center gap-1">
      <span>Preferred Date</span>
      <button 
        onClick={toggleSortDirection}
        className="inline-flex items-center justify-center w-6 h-6 rounded hover:opacity-80 transition-opacity"
        title={`Sort by date (${sortDirection === 'asc' ? 'oldest' : 'newest'} first)`}
      >
        <ArrowUpDown className={`h-3 w-3 text-white ${sortDirection === 'asc' ? 'bg-blue-600 rounded-sm' : 'bg-gray-600 rounded-sm'}`} />
      </button>
    </div>
  );
  
  // Define columns with the new header for Preferred Date
  const columns: Column[] = [
    {
      accessorKey: "eventName",
      header: <div className="text-start">Event Name</div>,
      width: "20%",
    },
    {
      accessorKey: "preferredDate",
      header: preferredDateHeader,
      width: "15%",
    },
    {
      accessorKey: "alternativeDate",
      header: <div className="text-center">Alternative Date</div>,
      width: "15%",
    },
    {
      accessorKey: "date",
      header: <div className="text-center">Date</div>,
      width: "10%",
    },
    {
      accessorKey: "club",
      header: <div className="text-center">Club</div>,
      width: "10%",
    },
    {
      accessorKey: "entryForm",
      header: <div className="text-center">Entry Form</div>,
      width: "15%",
    },
    {
      accessorKey: "NZFSSSanctioning",
      header: <div className="text-center">NZFSS Sanctioning</div>,
      width: "15%",
    },
  ];
  
  // Filter events based on search query

  // Filter events with isSubmitted true and either:
  // 1. Status is Pending, OR
  // 2. Status is any value but the event needs NZFSS sanctioning (has a date but not sanctioned yet)
  const draftedEvents = events.filter(
    (event: CreateEventCalendarInput) =>
      event.isSubmitted === true &&
      (event.status === "Pending" || 
       (event.date && event.NZFSSSanctioning !== true))
  );

  const filteredEvents = draftedEvents.filter((event: CreateEventCalendarInput) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (event.eventName?.toLowerCase().includes(searchLower)) ||
      (event.preferredDate?.toLowerCase().includes(searchLower)) ||
      (event.alternativeDate?.toLowerCase().includes(searchLower))
    );
  });

  // Sort events by preferred date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    try {
      // First check preferred dates
      const dateA = a.preferredDate ? new Date(a.preferredDate).getTime() : 0;
      const dateB = b.preferredDate ? new Date(b.preferredDate).getTime() : 0;
      
      // Sort based on direction from context
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } catch (error) {
      // If sorting fails, maintain original order
      return 0;
    }
  });

  const handleDateChange = (eventId: string, value: string) => {
    setSelectedDates((prevSelectedDates) => ({
      ...prevSelectedDates,
      [eventId]: value, // Store the selected date for this event
    }));
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-6 h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="w-full px-[1.5rem]">
      <div className="border rounded-b-[24px] overflow-hidden w-[100%] mx-0 border">
        <Table
          columns={columns}
          data={sortedEvents}
          renderAction={() => {
            // Pass icons directly as props
            const icons = [
              <Pencil className="w-[14px] h-[14px] text-[#323232]" key="pen" />,
              <Trash2
                className="w-[14px] h-[14px] text-[#323232]"
                key="trash"
              />,
            ];

            return <ActionIcons icons={icons} />;
          }}
          renderEntryForm={(event: any) => {
            return <RenderEntryForm event={event} showSanctionStatus={false} />;
          }}
          renderName={(event: any) => {
            return <Name name={event.eventName} />;
          }}
          renderClub={(clubObject) => {
            const club = clubObject.club;
            if (typeof club === "string") {
              return <div className="text-center">{getClubAbbreviation(club)}</div>;
            } else {
              return <div className="text-center">Invalid club name</div>;
            }
          }}
          renderDate={(event: any) => {
            return (
              <DateButton
                eventId={event._id}
                selectedDate={selectedDates[event._id]}
                date={event.date}
                updateEvent={updateEvent}
              />
            );
          }}
          renderNzfss={(event: any) => {
            // Only show NZFSS sanctioning buttons if date has been approved
            return event.date ? (
              <DateButtonNzfss
                updateEvent={updateEvent}
                eventId={event._id}
                clubId={event.clubId}
                eventName={event.eventName}
              />
            ) : (
              <div className="text-sm text-gray-500">
                Date approval required
              </div>
            );
          }}
          renderCheckDateAlternative={(event: any) => {
            return (
              <CheckDate
                checkDate={event.alternativeDate}
                eventDate={event.eventDate}
                date={event.date}
                selectedDate={selectedDates[event._id]}
                onValueChange={(value) => handleDateChange(event._id, value)}
              />
            );
          }}
          renderCheckDatePreferred={(event: any) => {
            return (
              <CheckDate
                checkDate={event.preferredDate}
                eventDate={event.eventDate}
                date={event.date}
                selectedDate={selectedDates[event._id]}
                onValueChange={(value) => handleDateChange(event._id, value)}
              />
            );
          }}
          isCalendar={isCalendar}
        />
      </div>
    </div>
  );
};

export default DraftedCalendar;
