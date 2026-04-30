"use client";

import { withSuspense } from "./with-suspense";
import { SearchLoadingFallback } from "./with-suspense";

// Import all components that need wrapping
import Navbar from "@/app/(routes)/_components/navbar";
import AddNewResult from "@/app/(routes)/_components/events/_components/add_new_result";
import SubmittedEvents from "@/app/(routes)/_components/events/submitted";
import EventsLayout from "@/app/(routes)/(events)/layout";
import CalendarPage from "@/app/(routes)/dashboard/(pages)/calendar/page";
import EventPage from "@/app/(routes)/(events)/events/[eventId]/page";
import FormPage from "@/app/(routes)/dashboard/(pages)/forms/formPage";
import ClubContactsPage from "@/app/(routes)/dashboard/(pages)/club-contacts/page";
import EventsPage from "@/app/(routes)/(events)/events/page";

// Create suspense-wrapped versions of all components
export const NavbarWithSuspense = withSuspense(Navbar, <SearchLoadingFallback />);
export const AddNewResultWithSuspense = withSuspense(AddNewResult, <SearchLoadingFallback />);
export const SubmittedEventsWithSuspense = withSuspense(SubmittedEvents, <SearchLoadingFallback />);
export const EventsLayoutWithSuspense = withSuspense(EventsLayout, <SearchLoadingFallback />);
export const CalendarPageWithSuspense = withSuspense(CalendarPage, <SearchLoadingFallback />);
export const EventPageWithSuspense = withSuspense(EventPage, <SearchLoadingFallback />);
export const FormPageWithSuspense = withSuspense(FormPage, <SearchLoadingFallback />);
export const ClubContactsPageWithSuspense = withSuspense(ClubContactsPage, <SearchLoadingFallback />);
export const EventsPageWithSuspense = withSuspense(EventsPage, <SearchLoadingFallback />); 