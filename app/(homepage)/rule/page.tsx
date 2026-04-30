"use client"

import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_ALL_RULES } from "./queries";
import { downloadFile } from "@/utils/download";

/**
 * Interface representing a rule item from the backend
 */
interface RuleItem {
  _id: string;
  constitutionRules: string;
  amendedDate: string;
  file: string;
  fileName: string;
}

/**
 * Loading spinner component
 */
const LoadingSpinner = () => (
  <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-full border-4 border-[#E5E7EB] border-t-[#FFB800] animate-spin"></div>
    <p className="text-lg text-gray-600">Loading rules</p>
  </div>
);

const RulePage = () => {
  const { data, loading, error } = useQuery(GET_ALL_RULES);

  /**
   * Downloads the file with proper filename handling
   * @param fileUrl - URL of the file to download
   * @param fileName - Suggested filename for the download
   */
  const handleDownload = async (fileUrl: string, fileName: string): Promise<void> => {
    try {
      await downloadFile(fileUrl, fileName);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback to opening in new tab
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Error loading rules: {error.message}</p>
      </div>
    );
  }

  // Get rules from query data
  const rules = data?.getAllRules || [];

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex flex-col w-full max-w-[1600px] lg:max-w-[83.33vw] mx-auto px-4 sm:px-6 lg:px-[2.5vw] pb-[72px] sm:pb-[148px] lg:pb-[7.71vw] gap-y-[24px] sm:gap-y-[32px] lg:gap-y-[1.67vw] bg-white">
        <h1 className="text-3xl sm:text-4xl md:text-[5vw] font-[700] text-center leading-[1.2] mt-8 lg:mt-[1.67vw] mb-8 lg:mb-[1.67vw]">Constitution & Rules</h1>
        
        <div className="border border-[#00000033] w-full h-auto rounded-[24px]">
          {/* Mobile Card Layout */}
          <div className="block sm:hidden">
            {rules.map((rule: RuleItem, index: number) => {
              const isFirst = index === 0;
              const isLast = index === rules.length - 1;
              const rowClass = [
                "w-full flex flex-col sm:flex-row sm:justify-between px-3 sm:px-6 lg:px-[1.25vw] py-4 lg:py-[0.83vw] text-base items-start sm:items-center bg-white border-b border-[#00000011]",
                isFirst ? "rounded-t-[24px]" : "",
                isLast ? "rounded-b-[24px] border-b-0" : "last:border-b-0"
              ].join(" ");
              return (
                <div 
                  key={rule._id} 
                  className={rowClass}
                >
                  <p className="text-base sm:text-lg lg:text-[0.94vw] font-medium mb-2 sm:mb-0">{rule.constitutionRules}</p>
                  <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-y-0 gap-x-[20px] sm:gap-x-[40px] lg:gap-x-[2.08vw] items-start sm:items-center w-full sm:w-auto">
                    {rule.amendedDate && (
                      <p className="text-sm sm:text-lg lg:text-[0.94vw] text-gray-600">
                        Amended: {rule.amendedDate}
                      </p>
                    )}
                    <button 
                      className="border border-[#1A1A1A33] w-full sm:w-[120px] lg:w-[6.25vw] h-[36px] lg:h-[1.88vw] rounded-[12px]  transition-colors text-base lg:text-[0.94vw]"
                      onClick={() => handleDownload(rule.file, rule.fileName)}
                      aria-label={`Download ${rule.constitutionRules}`}
                    >
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet and Desktop Table Layout */}
          <div className="hidden sm:block">
            <div className="w-full bg-[#ECECEF] p-3 sm:p-4 lg:p-[0.83vw] rounded-t-[24px]">
              <div className="flex flex-row justify-between items-center">
                <h2 className="font-bold text-lg sm:text-xl lg:text-[1.15vw]">Constitution & Rules</h2>
                <div className="flex flex-row gap-x-[40px] sm:gap-x-[60px] lg:gap-x-[3.13vw] items-center">
                  <p className="hidden md:block font-bold text-lg sm:text-xl lg:text-[1.15vw] min-w-[150px] text-center">Amended</p>
                  <p className="font-bold text-lg sm:text-xl lg:text-[1.15vw] min-w-[120px] sm:min-w-[120px] lg:min-w-[6.25vw] text-center">Action</p>
                </div>
              </div>
            </div>
            {rules.map((rule: RuleItem, index: number) => {
              const isLast = index === rules.length - 1;
              const rowClass = [
                "w-full flex flex-col sm:flex-row sm:justify-between px-3 sm:px-6 lg:px-[1.25vw] py-4 lg:py-[0.83vw] text-base items-start sm:items-center bg-white border-b border-[#00000011]",
                isLast ? "rounded-b-[24px] border-b-0" : "last:border-b-0"
              ].join(" ");
              return (
                <div 
                  key={rule._id}
                  className={rowClass}
                >
                  <p className="text-base sm:text-lg lg:text-[0.94vw] font-medium mb-2 sm:mb-0">{rule.constitutionRules}</p>
                  <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-y-0 gap-x-[40px] sm:gap-x-[60px] lg:gap-x-[3.13vw] items-start sm:items-center w-full sm:w-auto">
                    {rule.amendedDate && (
                      <p className="hidden md:block text-sm sm:text-lg lg:text-[0.94vw] text-gray-600 min-w-[150px] text-center">
                        {rule.amendedDate}
                      </p>
                    )}
                    {!rule.amendedDate && (
                      <p className="hidden md:block text-sm sm:text-lg lg:text-[0.94vw] text-gray-600 min-w-[150px] text-center">
                        -
                      </p>
                    )}
                    <button 
                      className="border border-[#1A1A1A33] w-full sm:w-[120px] lg:w-[6.25vw] h-[36px] lg:h-[1.88vw] rounded-[12px] hover:bg-black hover:text-white transition-colors text-base lg:text-[0.94vw]"
                      onClick={() => handleDownload(rule.file, rule.fileName)}
                      aria-label={`Download ${rule.constitutionRules}`}
                    >
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulePage;