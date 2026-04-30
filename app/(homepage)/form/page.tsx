"use client"
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_ALL_FORMS } from "@/graphql/query/form";
import { downloadFile } from "@/utils/download";

/**
 * Interface for API form data
 */
interface ApiForm {
  _id: string;
  formName: string;
  file: string;
  fileName: string;
  formType: string;
}

/**
 * Interface for form item structure
 */
interface FormItem {
  title: string;
  description: string;
  formName: string;
  buttonText: string;
  path: string;
  isExternalLink?: boolean;
  pdfUrl?: string;
  directUrl: string;
}

/**
 * Type for grouped forms by section
 */
type GroupedForms = Record<string, ApiForm[]>;

/**
 * Loading spinner component
 */
const LoadingSpinner = () => (
  <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-full border-4 border-[#E5E7EB] border-t-[#FFB800] animate-spin"></div>
    <p className="text-lg text-gray-600">Loading forms</p>
  </div>
);

const FormPageContent: React.FC = () => {
  const router = useRouter();
  const { data: formData, loading, error } = useQuery(GET_ALL_FORMS);

  /**
   * Handles navigation to the specified internal page
   * @param path - The path to navigate to
   */
  const handleNavigate = (path: string): void => {
    console.log("Navigating internally to:", path);
    router.push(path);
  };

  /**
   * Handles navigation to the specified form page
   * @param directUrl - Direct URL to open
   */
  const handleNavigateToForm = (directUrl: string): void => {
    console.log("Navigating to form URL:", directUrl);
    
    if (directUrl.startsWith('/')) {
      // Internal navigation
      router.push(directUrl);
    } else {
      // External navigation
      window.open(directUrl, "_blank", "noopener,noreferrer");
    }
  };

  /**
   * Handles file download with proper filename handling
   * @param fileUrl - The URL of the file to download
   * @param fileName - Optional suggested filename
   */
  const handleDownload = async (fileUrl: string, fileName?: string): Promise<void> => {
    if (fileUrl) {
      try {
        await downloadFile(fileUrl, fileName);
      } catch (error) {
        console.error('Error downloading file:', error);
        // Fallback to opening in new tab
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  /**
   * Static online forms data
   */
  const onlineForms: Record<string, FormItem[]> = {
    "Musher Registration": [
      {
        title: "Musher Registration Application",
        description: "NZFSS Registration Form",
        formName: "",
        buttonText: "Fill Online",
        path: "/form/musher-registration",
        isExternalLink: false,
        directUrl: "/form/musher-registration"
      }
    ],
    // "Event Sanctioning": [
    //   {
    //     title: "Event Sanctioning Application",
    //     description: "Sanctioning application generic form",
    //     formName: "",
    //     buttonText: "Fill Online",
    //     path: "",
    //     isExternalLink: true,
    //     directUrl: "https://nzfss-three.vercel.app"
    //   }
    // ],
    // "Event Sanctioning": [
    //   {
    //     title: "Event Sanctioning Application",
    //     description: "Sanctioning application generic form",
    //     formName: "",
    //     buttonText: "Fill Online",
    //     path: "",
    //     isExternalLink: true,
    //     directUrl: "https://nzfss-three.vercel.app"
    //   }
    // ],
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <p className="text-xl text-red-500">Error loading forms. Please try again later.</p>
      </div>
    );
  }

  // Group forms by their type
  const groupedForms: GroupedForms = formData?.getAllForms.reduce((acc: GroupedForms, form: ApiForm) => {
    const type = form.formType || "Other Forms";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(form);
    return acc;
  }, {} as GroupedForms) || {};

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex flex-col w-full max-w-[1600px] lg:max-w-[83.33vw] mx-auto px-4 sm:px-6 lg:px-[2.5vw] pb-[72px] sm:pb-[148px] lg:pb-[7.71vw] gap-y-[24px] sm:gap-y-[32px] lg:gap-y-[1.67vw] bg-white">
        <h1 className="text-3xl sm:text-4xl md:text-[5vw] font-[700] text-center leading-[1.2] mt-8 lg:mt-[1.67vw] mb-8 lg:mb-[1.67vw]">NZFSS Forms</h1>
        
        <div className="border border-[#00000033] w-full h-auto rounded-[24px]">
        {/* Display static online forms first */}
        {Object.entries(onlineForms).map(([section, items], sectionIdx, sectionArr) => (
          <div key={section} className="w-full">
            <div className={`w-full bg-[#ECECEF] p-3 sm:p-4 lg:p-[0.83vw]${sectionIdx === 0 ? ' rounded-t-[24px]' : ''}`}> 
              <h2 className="font-bold text-lg sm:text-xl lg:text-[1.15vw]">{section}</h2>
            </div>
            {items.map((item, itemIdx) => {
              const isLastSection = sectionIdx === sectionArr.length - 1;
              const isLastItem = itemIdx === items.length - 1;
              const rowClass = [
                "w-full flex flex-col sm:flex-row sm:justify-between px-3 sm:px-6 lg:px-[1.25vw] py-4 lg:py-[0.83vw] text-base items-start sm:items-center bg-white border-b border-[#00000011]",
                isLastSection && isLastItem ? "rounded-b-[24px] border-b-0" : "last:border-b-0"
              ].join(" ");
              return (
                <div 
                  key={item.title}
                  className={rowClass}
                >
                  <p className="text-base sm:text-lg lg:text-[0.94vw] font-medium mb-2 sm:mb-0">{item.title}</p>
                  <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-y-0 gap-x-[20px] sm:gap-x-[40px] lg:gap-x-[2.08vw] items-start sm:items-center w-full sm:w-auto">
                    <p className="text-sm sm:text-lg lg:text-[0.94vw] text-gray-600">{item.description}</p>
                    <button 
                      className="border border-[#1A1A1A33] w-full sm:w-[120px] lg:w-[6.25vw] h-[36px] lg:h-[1.88vw] rounded-[12px] hover:bg-black hover:text-white transition-colors text-base lg:text-[0.94vw]"
                      onClick={() => handleNavigateToForm(item.directUrl)}
                    >
                      {item.buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Display dynamic forms from API */}
        {Object.entries(groupedForms).map(([section, forms], sectionIdx, sectionArr) => (
          <div key={section} className="w-full">
            <div className={`w-full bg-[#ECECEF] p-3 sm:p-4 lg:p-[0.83vw]${sectionIdx === 0 && Object.entries(onlineForms).length === 0 ? ' rounded-t-[24px]' : ''}`}> 
              <h2 className="font-bold text-lg sm:text-xl lg:text-[1.15vw]">{section}</h2>
            </div>
            {forms.map((form, formIdx) => {
              const isLastSection = sectionIdx === sectionArr.length - 1;
              const isLastForm = formIdx === forms.length - 1;
              const rowClass = [
                "w-full flex flex-col sm:flex-row sm:justify-between px-3 sm:px-6 lg:px-[1.25vw] py-4 lg:py-[0.83vw] text-base items-start sm:items-center bg-white border-b border-[#00000011]",
                isLastSection && isLastForm ? "rounded-b-[24px] border-b-0" : "last:border-b-0"
              ].join(" ");
              return (
                <div 
                  key={form._id}
                  className={rowClass}
                >
                  <p className="text-base sm:text-lg lg:text-[0.94vw] font-medium mb-2 sm:mb-0">{form.formName}</p>
                  <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-y-0 gap-x-[20px] sm:gap-x-[40px] lg:gap-x-[2.08vw] items-start sm:items-center w-full sm:w-auto">
                    <p className="text-sm sm:text-lg lg:text-[0.94vw] text-gray-600">{form.fileName || "Form"}</p>
                    <button 
                      className="border border-[#1A1A1A33] w-full sm:w-[120px] lg:w-[6.25vw] h-[36px] lg:h-[1.88vw] rounded-[12px] hover:bg-black hover:text-white transition-colors text-base lg:text-[0.94vw]"
                      onClick={() => handleDownload(form.file, form.fileName)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

const FormPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FormPageContent />
    </Suspense>
  );
};

export default FormPage;
