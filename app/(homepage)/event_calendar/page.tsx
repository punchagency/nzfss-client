import React from "react";
import { EventCalendarContent } from "../_components/clientWrapper";

function EventCalendarPage() {
  return (
    <div className="flex flex-col w-full h-full pb-[148px] bg-white min-h-screen">
      <h1 className="text-[5vw] font-[700] text-center leading-[1.2] mb-8">
        Event Calendar
      </h1>
      
      <EventCalendarContent />
    </div>
  );
}

export default EventCalendarPage;