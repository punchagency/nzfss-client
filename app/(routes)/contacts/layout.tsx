"use client";

import React from "react";

/**
 * Layout component for the Contacts section.
 * 
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be rendered within this layout.
 * @returns {JSX.Element} The rendered layout component.
 */
export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="contacts-layout">
      {children}
    </div>
  );
} 