/**
 * Utility functions for handling file downloads
 */

/**
 * Extract filename from URL or use fallback
 */
const getFilenameFromUrl = (url: string, fallbackName: string = 'download'): string => {
  try {
    // Try to extract filename from URL path
    const urlPath = new URL(url).pathname;
    const segments = urlPath.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment && lastSegment.includes('.')) {
      return decodeURIComponent(lastSegment);
    }
  } catch (error) {
    console.warn('Error parsing URL for filename:', error);
  }
  
  return fallbackName;
};

/**
 * Get proper file extension based on content type
 */
const getExtensionFromContentType = (contentType: string): string => {
  const contentTypeMap: Record<string, string> = {
    // PDF files
    'application/pdf': 'pdf',
    
    // Microsoft Excel files
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    
    // Microsoft Word files
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    
    // Microsoft PowerPoint files
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    
    // Image files
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    
    // Text files
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/json': 'json',
    'application/xml': 'xml',
    'text/xml': 'xml',
    
    // Archive files
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    
    // Other common formats
    'application/rtf': 'rtf',
  };
  
  return contentTypeMap[contentType] || 'pdf';
};

/**
 * Download file with proper filename and error handling
 */
export const downloadFile = async (
  fileUrl: string, 
  suggestedFileName?: string,
  options: {
    openInNewTab?: boolean;
    fallbackName?: string;
  } = {}
): Promise<void> => {
  const { openInNewTab = false, fallbackName = 'download' } = options;
  
  try {
    // Fetch the file to get proper headers and content
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Determine the filename
    let fileName = suggestedFileName;
    
    if (!fileName) {
      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      }
      
      // Fallback to extracting from URL
      if (!fileName) {
        fileName = getFilenameFromUrl(fileUrl, fallbackName);
      }
    }
    
    // Ensure the filename has the correct extension
    if (fileName && !fileName.includes('.')) {
      const extension = getExtensionFromContentType(contentType);
      fileName = `${fileName}.${extension}`;
    } else if (fileName) {
      // Check if the existing extension matches the content type
      const currentExt = fileName.split('.').pop()?.toLowerCase();
      const expectedExt = getExtensionFromContentType(contentType);
      
      // If extensions don't match and we have a more specific one, update it
      if (currentExt && expectedExt && currentExt !== expectedExt) {
        // Only update if the current extension is generic or wrong
        if (['sheet', 'document', 'presentation', 'bin', 'octet-stream'].includes(currentExt)) {
          fileName = fileName.replace(/\.[^.]+$/, `.${expectedExt}`);
        }
      }
    }
    
    console.log(`Downloading file: ${fileName} (Content-Type: ${contentType})`);
    
    // For certain file types, open in new tab if requested
    if (openInNewTab && ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'].includes(contentType)) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Download the file
    const blob = await response.blob();
    
    // Create blob URL with correct MIME type
    const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || fallbackName;
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    
    // Fallback to simple download
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = suggestedFileName || fallbackName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
      // Last resort: open in new window
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  }
};

/**
 * Download PDF with specific handling
 */
export const downloadPDF = async (pdfUrl: string, fileName?: string): Promise<void> => {
  return downloadFile(pdfUrl, fileName, { openInNewTab: false, fallbackName: 'document.pdf' });
};

/**
 * Download Excel file with specific handling
 */
export const downloadExcel = async (excelUrl: string, fileName?: string): Promise<void> => {
  return downloadFile(excelUrl, fileName, { fallbackName: 'spreadsheet.xlsx' });
};

/**
 * Download Word document with specific handling
 */
export const downloadWord = async (wordUrl: string, fileName?: string): Promise<void> => {
  return downloadFile(wordUrl, fileName, { fallbackName: 'document.docx' });
}; 