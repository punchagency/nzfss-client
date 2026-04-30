import { pdf } from '@/assets';
import Image from 'next/image';
import React from 'react';

// Define the EntryForm component
const EntryForm = ({ data }: { data: string[] }) => {
  // Function to check if a string is a URL
  const isURL = (str: string) => {
    const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}(\/[^\s]*)?$/;
    return regex.test(str);
  };

  // Function to render a website URL
  const renderWebsite = (url: string) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 truncate max-w-[200px]">
      {url}
    </a>
  );

  // Function to render a file with a PDF icon
  const renderFile = (filePath: string) => {
    // Extract the filename from the file path (e.g., "/files/entry-form-math-olympiad.pdf" -> "olympiad.pdf")
    const fileName = filePath.split('/').pop() || '';

    return (
      <div className="flex items-center gap-x-">
        <div className="h-[32px] w-[42px] border rounded-[33.33px] flex justify-center items-center">
          <Image width={12.72} height={16} alt="pdf icon" src={pdf} />
        </div>
        <a href={filePath} download className="">
          {fileName}
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-center">
      {data.map((item, index) => (
        <div key={index} className="flex justify-center gap-x-[6px]">
          {/* If the item is a URL, render a link */}
          {isURL(item) ? renderWebsite(item) : renderFile(item)}
        </div>
      ))}
    </div>
  );
};

export default EntryForm;
