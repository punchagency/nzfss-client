import { cloud_upload, pdf } from "@/assets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@apollo/client";
import { CREATE_FORM } from "@/graphql/mutation/form";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { Plus } from "lucide-react";

interface CreateFormProps {
  onSuccess?: () => void;
}

const CreateForm = ({ onSuccess }: CreateFormProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [formFileBase64, setFormFileBase64] = useState<string | null>(null);
  const [formType, setFormType] = useState("General");
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { toast } = useToast();
  const [createForm, { loading }] = useMutation(CREATE_FORM);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Direct file to base64 conversion without external utility
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        if (!reader.result) {
          console.error("Failed to read file");
          reject(new Error("Failed to read file"));
          return;
        }
        
        let base64String = reader.result.toString();
        console.log("Raw base64 prefix:", base64String.substring(0, 50));
        
        // We need to be careful about BOM or invisible characters at the start of the string
        // If data: is not at position 0, but exists in the string, extract from that position
        if (!base64String.startsWith("data:") && base64String.includes("data:")) {
          const dataIndex = base64String.indexOf("data:");
          console.log(`'data:' found at position ${dataIndex}, extracting from there`);
          base64String = base64String.substring(dataIndex);
        }
        
        // Clean up any whitespace or line breaks
        base64String = base64String.replace(/[\r\n\t\s]/g, "");
        
        // Ensure it has the correct PDF MIME type
        if (!base64String.startsWith("data:application/pdf;base64,")) {
          console.log("Fixing MIME type in base64 string");
          // Extract any existing base64 data after the comma
          const parts = base64String.split(",");
          if (parts.length === 2) {
            const base64Data = parts[1];
            base64String = `data:application/pdf;base64,${base64Data}`;
          } else if (parts.length === 1) {
            // If there's no comma, assume it's raw base64 data
            base64String = `data:application/pdf;base64,${base64String}`;
          }
        }
        
        // Sanity checks for base64 content
        const parts = base64String.split(",");
        if (parts.length !== 2) {
          console.error("Invalid base64 format: missing comma delimiter");
          reject(new Error("Invalid base64 format"));
          return;
        }
        
        const base64Content = parts[1];
        if (!base64Content || base64Content.length < 100) {
          console.error("Base64 content appears to be invalid or too short");
          reject(new Error("Invalid base64 content"));
          return;
        }
        
        // Validate base64 character set (allowing for URL-safe base64 as well)
        if (!/^[A-Za-z0-9+/=_-]+$/.test(base64Content)) {
          console.error("Base64 content contains invalid characters");
          
          // Try to clean it up
          const cleanedBase64 = base64Content.replace(/[^A-Za-z0-9+/=_-]/g, "");
          if (cleanedBase64.length > 100) {
            console.log("Using cleaned base64 content");
            base64String = `data:application/pdf;base64,${cleanedBase64}`;
          } else {
            reject(new Error("Base64 content is invalid even after cleaning"));
            return;
          }
        }
        
        // Double check the final string starts with the expected prefix
        if (!base64String.startsWith("data:application/pdf;base64,")) {
          console.error("Final base64 string still doesn't have correct prefix");
          console.error("Prefix:", base64String.substring(0, 50));
          reject(new Error("Failed to create valid base64 string"));
          return;
        }
        
        console.log("Base64 conversion successful:");
        console.log("- Prefix:", base64String.substring(0, 50));
        console.log("- Length:", base64String.length);
        resolve(base64String);
      };
      
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        reject(error);
      };
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file",
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size should be less than 10MB",
      });
      return;
    }

    try {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      
      // Convert file to base64
      const base64String = await convertFileToBase64(file);
      setFormFileBase64(base64String);
      
      console.log("File prepared for upload:");
      console.log("- Name:", file.name);
      console.log("- Type:", file.type);
      console.log("- Size:", file.size);
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the file. Please try again with a different PDF.",
      });
      
      // Reset the file
      setSelectedFile(null);
      setSelectedFileName(null);
      setFormFileBase64(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate form fields
      if (!formName) {
        toast({
          variant: "destructive",
          title: "Missing form name",
          description: "Please enter a form name",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!formType) {
        toast({
          variant: "destructive",
          title: "Missing form type",
          description: "Please select a form type",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!formFileBase64) {
        toast({
          variant: "destructive",
          title: "Missing file",
          description: "Please upload a PDF file",
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("Submitting form with:");
      console.log("- Form name:", formName);
      console.log("- Form type:", formType);
      console.log("- File name:", selectedFileName);
      console.log("- Base64 prefix:", formFileBase64.substring(0, 50));
      console.log("- Base64 length:", formFileBase64.length);
      
      // Analyze the first part of the string for potential issues
      const analyzeString = (str: string) => {
        const analysis = {
          startsWithData: str.startsWith("data:"),
          containsData: str.includes("data:"),
          dataPosition: str.indexOf("data:"),
          first20Chars: str.substring(0, 20),
          first20CharsEncoded: encodeURIComponent(str.substring(0, 20)),
          specialCharsCount: (str.substring(0, 100).match(/[^\w\s]/g) || []).length,
          hasLineBreaks: /[\r\n]/.test(str.substring(0, 100)),
        };
        console.log("String analysis:", analysis);
        return analysis;
      };
      
      // Run analysis on the base64 string
      const analysis = analyzeString(formFileBase64);

      // Create a fresh copy of the base64 string to avoid any reference issues
      let processedBase64 = formFileBase64;
      
      // Check for potential encoding issues
      if (!analysis.startsWithData && analysis.containsData) {
        console.log("Found 'data:' but not at the start. Fixing...");
        processedBase64 = formFileBase64.substring(analysis.dataPosition);
      }
      
      // Ensure the base64 has the correct prefix
      if (!processedBase64.startsWith("data:application/pdf;base64,")) {
        console.log("Fixing missing prefix in submission");
        // Extract the base64 part if it has a different prefix
        if (processedBase64.includes("base64,")) {
          const parts = processedBase64.split("base64,");
          processedBase64 = "data:application/pdf;base64," + parts[1];
        } else if (/^[A-Za-z0-9+/=]+$/.test(processedBase64)) {
          // It's a raw base64 string
          processedBase64 = "data:application/pdf;base64," + processedBase64;
        }
      }
      
      console.log("- Final base64 prefix:", processedBase64.substring(0, 50));

      // Submit the form
      const response = await createForm({
        variables: {
          input: {
            formName,
            formType,
            file: processedBase64,
            fileName: selectedFileName
          },
        },
      });

      if (response.data) {
        toast({
          title: "Success",
          description: "Form created successfully",
        });
        setOpen(false);
        onSuccess?.();
        
        // Reset form
        setSelectedFile(null);
        setSelectedFileName(null);
        setFormFileBase64(null);
        setFormName("");
        setFormType("General");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create form. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Form</DialogTitle>
          <DialogDescription>
            Add a new form to the system. Please fill in all required fields.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="formName" className="text-right">
                Form Name
              </Label>
              <Input
                id="formName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Form Type</Label>
              <RadioGroup
                value={formType}
                onValueChange={setFormType}
                className="col-span-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="General" id="general" />
                  <Label htmlFor="general">General</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Race" id="race" />
                  <Label htmlFor="race">Race</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Club" id="club" />
                  <Label htmlFor="club">Club</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Upload PDF</Label>
              <div className="col-span-3">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                {selectedFileName ? (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Image src={pdf} alt="PDF" width={24} height={24} />
                    <span className="text-sm truncate">{selectedFileName}</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClick}
                    className="w-full"
                  >
                    <Image
                      src={cloud_upload}
                      alt="upload"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    Upload PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || isSubmitting}>
              {loading || isSubmitting ? "Creating..." : "Create Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateForm;