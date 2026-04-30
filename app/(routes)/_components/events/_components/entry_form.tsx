import { pdf } from '@/assets';
import Image from 'next/image';
import React from 'react';

interface RenderEntryFormProps {
  event: any;
  showSanctionStatus?: boolean;
  truncateAt?: number;
}

const RenderEntryForm: React.FC<RenderEntryFormProps> = ({ event, showSanctionStatus = false, truncateAt }) => {
  // Function to truncate text if truncateAt is specified
  const truncateText = (text: string, maxLength?: number) => {
    if (!maxLength || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to check if a string is a URL
  const isURL = (str: string) => {
    const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}(\/[^\s]*)?$/;
    return regex.test(str);
  };

  // Function to check if string is a data URL
  const isDataURL = (str: string) => {
    return str.startsWith('data:');
  };

  // Function to render a website URL
  const renderWebsite = (url: string) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 truncate max-w-[200px] hover:underline" title={url}>
      {truncateText(url, truncateAt)}
    </a>
  );

  // Function to render a file with a PDF icon
  const renderFile = (filePath: string) => {
    // Use the original fileName from the event object
    const fileName = event.fileName || filePath.split('/').pop() || '';
    
    return (
      <div className="flex items-center gap-x-2">
        <div className="h-[42px] w-[42px] border rounded-[33.33px] flex justify-center items-center">
          <Image width={12.72} height={16} alt="pdf icon" src={pdf} />
        </div>
        <a href={filePath} download className="text-black truncate max-w-[200px]" title={fileName}>
          {truncateText(fileName, truncateAt)}
        </a>
      </div>
    );
  };

  // Determine if the entryForm is a PDF, Word doc, or a website link
  const renderEntryFormContent = (entryForm: string) => {
    if (entryForm.toLowerCase().endsWith('.pdf') || 
        entryForm.toLowerCase().endsWith('.doc') || 
        entryForm.toLowerCase().endsWith('.docx') ||
        entryForm.includes('s3.amazonaws.com') ||
        entryForm.includes('s3.us-east-1.amazonaws.com')) {
      return renderFile(entryForm);
    } else if (isURL(entryForm)) {
      return renderWebsite(entryForm);
    } else if (isDataURL(entryForm)) {
      // Handle data URLs (e.g. for Word documents)
      return renderFile(entryForm);
    } else {
      return <span>Invalid entry form link</span>;
    }
  };

  // We're not rendering sanctioning status here anymore as it will be displayed in the Type column

  return (
    <div className="space-y-2 text-center">
      <div className="flex justify-center gap-x-[6px]">
        {event.entryForm && renderEntryFormContent(event.entryForm)}
      </div>
    </div>
  );
};

export default RenderEntryForm;