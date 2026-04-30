export const getBase64 = (file: File | null, cb: (result: string | ArrayBuffer | null) => void) => {
  if (!file) {
    console.error("No file provided to getBase64");
    cb(null);
    return;
  }

  console.log("Processing file:", file.name, "type:", file.type, "size:", file.size);
  
  // For image files (including JPGs), use the enhanced image handling approach
  if (file.type.startsWith('image/')) {
    console.log("Image detected, using optimized image handling approach");
    handleImage(file, cb);
    return;
  }
  
  const reader = new FileReader();
  
  reader.readAsDataURL(file);
  
  reader.onload = function() {
    if (reader.result) {
      // reader.result is already a properly formatted base64 string with the correct MIME type prefix
      const result = reader.result as string;
      
      // Verify the base64 string format
      if (!result.startsWith("data:")) {
        console.error("Invalid base64 format: missing data URI prefix");
        cb(null);
        return;
      }
      
      if (file.type === "application/pdf" && !result.startsWith("data:application/pdf")) {
        // If it's a PDF but doesn't have the PDF MIME type, add it
        console.log("Correcting MIME type for PDF file");
        const base64Data = result.split(",")[1];
        const correctedResult = `data:application/pdf;base64,${base64Data}`;
        console.log("- Corrected prefix:", correctedResult.substring(0, 50));
        console.log("- Corrected length:", correctedResult.length);
        cb(correctedResult);
        return;
      }
      
      console.log("Generated base64 string:");
      console.log("- Prefix:", result.substring(0, 50));
      console.log("- Length:", result.length);
      
      // Process the base64 string to ensure it doesn't contain any characters that might cause issues
      const cleanResult = result.replace(/[\r\n]/g, "");
      cb(cleanResult);
    } else {
      console.error("FileReader result is null");
      cb(null);
    }
  };

  reader.onerror = function(error) {
    console.error("Error reading file:", error);
    cb(null);
  };
};

// Function to handle all images including JPGs more reliably
const handleImage = (file: File, cb: (result: string | ArrayBuffer | null) => void) => {
  try {
    // Create image element for processing
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // Clean up the object URL after loading
        URL.revokeObjectURL(objectUrl);
        
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error("Could not get canvas context");
          fallbackToFileReader(file, cb);
          return;
        }
        
        // Set dimensions - maintaining aspect ratio but with reasonable max sizes
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1200;
        
        let width = img.width;
        let height = img.height;
        
        // Scale down if necessary while maintaining aspect ratio
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to canvas with potentially reduced dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get MIME type, ensure JPG is handled correctly
        let mimeType = file.type || 'image/jpeg';
        
        // Normalize JPG mime types
        if (mimeType === 'image/jpg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        }
        
        // Convert to base64 with appropriate quality
        const quality = 0.85; // Balance between quality and file size
        const dataUrl = canvas.toDataURL(mimeType, quality);
        
        console.log("Processed image successfully");
        console.log("- Original size (KB):", Math.round(file.size / 1024));
        console.log("- Processed size (KB):", Math.round(dataUrl.length / 1024));
        console.log("- MIME type used:", mimeType);
        
        cb(dataUrl);
      } catch (error) {
        console.error("Error processing image:", error);
        fallbackToFileReader(file, cb);
      }
    };
    
    img.onerror = () => {
      console.error("Failed to load image");
      URL.revokeObjectURL(objectUrl);
      fallbackToFileReader(file, cb);
    };
    
    img.src = objectUrl;
  } catch (error) {
    console.error("Error in handleImage:", error);
    fallbackToFileReader(file, cb);
  }
};

// Function to handle large images specifically (maintaining for backward compatibility)
const handleLargeImage = (file: File, cb: (result: string | ArrayBuffer | null) => void) => {
  // Just call the unified image handler
  handleImage(file, cb);
};

// Simple fallback when image processing fails
const fallbackToFileReader = (file: File, cb: (result: string | ArrayBuffer | null) => void) => {
  console.log("Using FileReader fallback for image");
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    if (reader.result) {
      console.log("FileReader fallback successful");
      cb(reader.result);
    } else {
      console.error("FileReader fallback failed - no result");
      cb(null);
    }
  };
  reader.onerror = (error) => {
    console.error("FileReader fallback error:", error);
    cb(null);
  };
};

// Utility function to ensure a base64 string is properly formatted
export const sanitizeBase64 = (base64String: string | null): string | null => {
  if (!base64String) {
    console.error("No base64 string provided to sanitizeBase64");
    return null;
  }
  
  console.log("Sanitizing base64 string:");
  console.log("- Original length:", base64String.length);
  console.log("- Original prefix:", base64String.substring(0, 50));
  
  // Remove whitespace and line breaks
  let sanitized = base64String.replace(/[\r\n\t\s]/g, "");
  
  // Check if it's already a properly formatted base64 string
  if (sanitized.startsWith("data:application/pdf;base64,")) {
    console.log("Base64 string already properly formatted");
    return sanitized;
  }
  
  // If it's just the base64 data without the prefix
  if (/^[A-Za-z0-9+/=]+$/.test(sanitized)) {
    console.log("Adding PDF prefix to raw base64 data");
    return `data:application/pdf;base64,${sanitized}`;
  }
  
  // If it has a different prefix, extract the base64 part and add the correct prefix
  const match = sanitized.match(/^data:.*;base64,(.+)$/);
  if (match && match[1]) {
    console.log("Extracting base64 data from different prefix");
    return `data:application/pdf;base64,${match[1]}`;
  }
  
  console.error("Could not sanitize base64 string. Invalid format.");
  return null;
};