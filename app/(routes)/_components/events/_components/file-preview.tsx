"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileIcon, FileSpreadsheet, FileText, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadFile } from "@/utils/download";

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to safely encode text for HTML display
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export default function FilePreview({ fileUrl, fileName, isOpen, onClose }: FilePreviewProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [activeWorksheet, setActiveWorksheet] = useState<string>("");
  const [worksheetContents, setWorksheetContents] = useState<Record<string, string>>({});
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  const fileExtension = fileName.split(".").pop()?.toLowerCase();

  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    setIsLoading(true);
    setError(null);
    setWorksheets([]);
    setWorksheetContents({});
    setWorkbook(null);

    const fetchAndProcessFile = async () => {
      try {
        // Process based on file extension
        if (fileExtension === "xlsx" || fileExtension === "xls") {
          const response = await fetch(fileUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }

          const fileBlob = await response.blob();
          const arrayBuffer = await fileBlob.arrayBuffer();
          const wb = XLSX.read(arrayBuffer, { type: "array" });
          setWorkbook(wb);
          
          // Get all worksheet names
          const sheets = wb.SheetNames;
          setWorksheets(sheets);
          
          if (sheets.length > 0) {
            // Set first worksheet as active
            setActiveWorksheet(sheets[0]);
            
            // Generate HTML for the first worksheet
            const worksheet = wb.Sheets[sheets[0]];
            const html = XLSX.utils.sheet_to_html(worksheet);
            
            // Store the HTML for this worksheet
            setWorksheetContents(prev => ({
              ...prev,
              [sheets[0]]: html
            }));
            
            setPreviewContent(html);
          } else {
            throw new Error("No worksheets found in the Excel file");
          }
          
        } else if (fileExtension === "docx") {
          const response = await fetch(fileUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }

          const fileBlob = await response.blob();
          const arrayBuffer = await fileBlob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewContent(result.value);
          
        } else if (fileExtension === "pdf") {
          // For PDF files, we can embed them directly using an iframe
          setIsLoading(false);
          
          // Create a secure embed URL (prevents some security issues)
          const secureUrl = fileUrl.startsWith('blob:') ? fileUrl : fileUrl;
          
          setPreviewContent(`
            <div style="height: 100%; min-height: 500px; width: 100%;">
              <iframe 
                src="${secureUrl}" 
                style="width: 100%; height: 100%; min-height: 500px; border: none;" 
                title="PDF Preview"
              ></iframe>
            </div>
          `);
          
          return;
        } else if (fileExtension === "doc") {
          // For .doc files, display a better information message but still allow preview
          setIsLoading(false);
          setPreviewContent(`
            <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
              <h3 style="margin-bottom: 10px; color: #4a5568;">Legacy DOC Format</h3>
              <div style="border: 1px solid #e2e8f0; background-color: #f7fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px; text-align: left;">
                <p style="margin-bottom: 8px;"><strong>About this preview:</strong></p>
                <p style="margin-bottom: 8px;">Full preview is limited because this is a legacy Microsoft Word format (.doc).</p>
                <p style="margin-bottom: 0;">For the best experience, please download the file and open it in Microsoft Word or LibreOffice.</p>
              </div>
              
              <p style="font-size: 14px; color: #718096; margin-top: 20px;">We're still attempting to extract basic content:</p>
            </div>
          `);
          
          // Try to fetch some basic content if possible
          try {
            const response = await fetch(fileUrl);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.statusText}`);
            }

            const fileBlob = await response.blob();
            const text = await fileBlob.text();
            
            // Try to extract readable text (this will be limited)
            // Much more aggressive filtering for binary data
            const readableText = text
              // First keep only standard printable ASCII and whitespace
              .replace(/[^\x20-\x7E\r\n]/g, '')
              // Remove null characters
              .replace(/\0/g, '')
              
              // --- WORD BINARY PATTERNS ---
              // Remove common binary Word markers
              .replace(/CJOJQJmH[a-zA-Z0-9]+/g, '')
              .replace(/\$dNdA/g, '')
              .replace(/\+6!A#[^a-zA-Z\s]*/g, '')
              .replace(/\^`0a\$/g, '')
              .replace(/&F\s*;\d+c/g, '')
              .replace(/[$%@#&^*{}[\]<>]+/g, ' ')
              
              // --- OFFICE XML PATTERNS ---
              // Remove PK file signatures and related content
              .replace(/PK[!-].*?(?=\s|$)/g, '')
              // Remove XML declarations
              .replace(/[?]xml.*?[?]/g, '')
              // Remove XML schemas and namespace references
              .replace(/http:\/\/schemas\.openxmlformats\.org\/[a-zA-Z0-9/.:-]+/g, '')
              // Remove tag-like content (partial XML)
              .replace(/<[^>]*>/g, '')
              .replace(/xmlns:[a-z]="[^"]+"/g, '')
              .replace(/[a-z]+:clrMap[^}]*}/g, '')
              .replace(/[a-z]+\d?="[\w\d#]+"/g, '')
              
              // --- BINARY FORMAT MARKERS ---
              // Remove hex patterns
              .replace(/0x[0-9a-fA-F]+/g, '')
              // Remove common font references
              .replace(/Times New Roman|Symbol|Arial|Calibri|Cambria/g, '')
              // Remove character sequences with many numbers/symbols
              .replace(/\b\d+\b/g, ' ')
              .replace(/(\s\S){3,}?\s/g, ' ')
              // Remove nonsense letter groupings
              .replace(/\b[bcdfghjklmnpqrstvwxz]{5,}\b/g, '')
              
              // --- CLEAN UP ---
              // Remove repeating characters (like "666666666")
              .replace(/(.)\1{7,}/g, '$1')
              // Remove repeating words
              .replace(/\b(\w+)(\s+\1){3,}\b/g, '$1')
              // Clean up excessive spaces
              .replace(/\s{2,}/g, ' ')
              // Remove lines with no alphabetic characters
              .split('\n')
              // Require at least 3 letters per line (stricter filtering)
              .filter(line => /[a-zA-Z]{3,}/.test(line))
              .join('\n')
              .trim();
              
            if (readableText.length > 0) {
              // Need at least 20 letters total to be considered meaningful
              if (readableText.replace(/[^a-zA-Z]/g, '').length >= 20) {
                // Add the extracted text to the existing preview content
                setPreviewContent(prev => prev + `
                  <div style="border: 1px solid #e2e8f0; padding: 16px; margin-top: 20px; text-align: left; white-space: pre-wrap; font-family: monospace; font-size: 12px; max-height: 400px; overflow-y: auto;">
                    ${escapeHtml(readableText)}
                  </div>
                `);
              } else {
                // Text found but too sparse to be meaningful
                setPreviewContent(prev => prev + `
                  <div style="margin-top: 20px; color: #718096;">
                    <p>Unable to extract meaningful text content from this file.</p>
                  </div>
                `);
              }
            } else {
              // No readable text found
              setPreviewContent(prev => prev + `
                <div style="margin-top: 20px; color: #718096;">
                  <p>Unable to extract readable text from this file format.</p>
                </div>
              `);
            }
          } catch (err) {
            console.error("Error extracting .doc content:", err);
            // Add error message to existing preview content
            setPreviewContent(prev => prev + `
              <div style="margin-top: 20px; color: #e53e3e;">
                <p>Error extracting content: ${err instanceof Error ? err.message : "Unknown error"}</p>
              </div>
            `);
          }
          
          return;
        } else {
          setError(`Unsupported file type: ${fileExtension}`);
        }
      } catch (err) {
        console.error("Error processing file:", err);
        setError(`Failed to preview file: ${err instanceof Error ? err.message : "Unknown error"}`);
        
        // For .doc files, provide a fallback message if server-side conversion fails
        if (fileExtension === "doc") {
          setPreviewContent(`
            <div style="text-align: center; padding: 20px;">
              <p>Unable to preview this DOC file.</p>
              <p>Please download the file to view its contents.</p>
            </div>
          `);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessFile();
  }, [fileUrl, isOpen, fileExtension]);

  // Handle worksheet change
  const handleWorksheetChange = (sheetName: string) => {
    setActiveWorksheet(sheetName);
    
    // Check if we already have the content for this worksheet
    if (worksheetContents[sheetName]) {
      setPreviewContent(worksheetContents[sheetName]);
    } else if (workbook) {
      // Generate the HTML for this worksheet
      const worksheet = workbook.Sheets[sheetName];
      const html = XLSX.utils.sheet_to_html(worksheet);
      
      // Store it for future use
      setWorksheetContents(prev => ({
        ...prev,
        [sheetName]: html
      }));
      
      setPreviewContent(html);
    }
  };

  // Determine file icon based on extension
  const FileTypeIcon = () => {
    if (fileExtension === "xlsx" || fileExtension === "xls") {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    } else if (fileExtension === "docx" || fileExtension === "doc") {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTypeIcon />
            <DialogTitle className="text-xl">{fileName}</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        {/* Show worksheet tabs for Excel files */}
        {(fileExtension === "xlsx" || fileExtension === "xls") && worksheets.length > 1 && (
          <Tabs value={activeWorksheet} onValueChange={handleWorksheetChange} className="w-full">
            <TabsList className="w-full overflow-x-auto whitespace-nowrap">
              {worksheets.map((sheet) => (
                <TabsTrigger key={sheet} value={sheet} className="px-4">
                  {sheet}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        
        <div className="flex-1 overflow-auto mt-4 border rounded-md p-4 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3 text-gray-600">Loading document preview...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => downloadFile(fileUrl, fileName)}>
                Download File
              </Button>
            </div>
          ) : (
            <>
              <div 
                className="preview-container"
                dangerouslySetInnerHTML={{ __html: previewContent || "" }}
                style={{ 
                  fontFamily: "Arial, sans-serif", 
                  fontSize: "14px",
                  lineHeight: "1.5" 
                }}
              />
              <style jsx global>{`
                .preview-container table {
                  border-collapse: collapse;
                  width: 100%;
                }
                .preview-container td, .preview-container th {
                  border: 1px solid #ddd;
                  padding: 8px;
                }
                .preview-container tr:nth-child(even) {
                  background-color: #f2f2f2;
                }
              `}</style>
            </>
          )}
        </div>
        
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={() => downloadFile(fileUrl, fileName)}>
            Download
          </Button>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 