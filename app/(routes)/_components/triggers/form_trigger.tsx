import { cloud_upload, pdf, trash } from "@/assets";
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
import { RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useForms } from "@/service/formService";
import { getBase64, sanitizeBase64 } from "@/utils/upload";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { Plus } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";

interface ClubTriggerProps {
  btn: string;
}
const FormTrigger = ({ btn }: ClubTriggerProps) => {
  const [open, setOpen] = useState(false);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formFileBase64, setFormFileBase64] = useState<string | null>(null);
  const [link, setLink] = useState<string>("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const [formType, setFormType] = useState("");
  const [formName, setFormName] = useState("");
  const [imageSizeLimit, setImageSizeLimit] = useState(false);

  const { toast } = useToast();
  const { addForm, loading, error } = useForms();

  const handleClick = () => {
    fileInputRef.current?.click(); // Trigger the file input dialog
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF file",
        });
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setImageSizeLimit(true);
        toast({
          variant: "destructive",
          title: "File too large",
          description: "File size should be less than 10MB",
        });
        return;
      }

      setSelectedFileName(file.name);
      
      // Use the getBase64 utility function
      getBase64(file, (base64String) => {
        if (base64String) {
          setFormFileBase64(base64String as string);
          setUploadComplete(true);
        }
      });
    }
  };

  const handleDelete = () => {
    // Clear the Base64 data and the file name
    setFormFileBase64(null);
    setSelectedFileName(null);
    setUploadComplete(false);

    // Manually trigger file input again by clicking it after deletion
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formType || !formFileBase64) {
      toast({
        variant: "destructive",
        description: "Please fill in all required fields and upload a PDF file",
      });
      return;
    }

    // Sanitize the base64 string
    const sanitizedBase64 = sanitizeBase64(formFileBase64);
    if (!sanitizedBase64) {
      toast({
        variant: "destructive",
        description: "Invalid file format. Please try uploading the file again.",
      });
      return;
    }

    console.log('Submitting form with:');
    console.log('- Form name:', formName);
    console.log('- Form type:', formType);
    console.log('- File name:', selectedFileName);
    console.log('- Original Base64 prefix:', formFileBase64.substring(0, 50));
    console.log('- Sanitized Base64 prefix:', sanitizedBase64.substring(0, 50));
    console.log('- Base64 length:', sanitizedBase64.length);

    try {
      const { data, errors } = await addForm({
        formName: formName,
        formType: formType,
        file: sanitizedBase64,
        fileName: selectedFileName,
      });

      if (errors || !data) {
        const errorMessage = errors?.[0]?.message || "Error adding Form";
        toast({
          variant: "destructive",
          description: errorMessage,
        });
        return;
      }

      toast({
        description: "Form added successfully",
      });

      // Reset form
      setFormName("");
      setFormType("");
      setSelectedFileName(null);
      setFormFileBase64(null);
      setUploadComplete(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setOpen(false); // Close dialog on success
    } catch (error: any) {
      console.error('Form submission error:', error);
      const errorMessage = error?.message || "Error adding Form";
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <div className="instant-anim flex gap-x-2 border border-[#00000033] py-2 px-2 rounded-[16px] font-[500] text-[#000000] text-[0.95vw]">
            <Image src={cloud_upload} alt="upload icon" />
            <span>{btn}</span>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload form</DialogTitle>
            <DialogDescription>Please upload your form</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className=" flex flex-col  gap-4 py-4">
              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="name"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Form Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter form name"
                  className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="formType"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Form Type
                </Label>
                <Input
                  type="text"
                  id="formType"
                  placeholder="Enter form type"
                  className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                  onChange={(e) => setFormType(e.target.value)}
                />
              </div>

              {/* <div>
              <RadioGroup
                onValueChange={setSelectedOption}
                className="flex items-center gap-x-[32px]"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="r1" />
                  <Label htmlFor="r1">Upload file</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="link" id="r2" />
                  <Label htmlFor="r2">Paste form link</Label>
                </div>
              </RadioGroup>
            </div> */}

              {!uploadComplete && (
                <div className=" flex flex-col gap-y-2 gap-4">
                  <Label
                    htmlFor="formType"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Upload form Doc
                  </Label>
                  <div
                    onClick={handleClick}
                    className="w-full border-dashed border-2 h-[52px] rounded-[12px] flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-[11.31px] h-[11.31px] text-[#000000]" />
                  </div>
                </div>
              )}

              {uploadComplete && (
                <div className=" flex flex-col gap-y-2 gap-4">
                  <Label
                    htmlFor="formType"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Upload form Doc
                  </Label>
                  <div className="w-full border-dashed border-2 h-[64px] rounded-[12px] flex flex-col relative py-[4.5px]">
                    <Image
                      src={pdf}
                      alt="pdf icon"
                      className="absolute left-[14.4px] top-5"
                    />
                    <div className="flex flex-col gap-y-[4px] px-[56px]">
                      <p className="font-[600] text-[1rem] leading-[20.8px]">
                        {selectedFileName}
                      </p>
                      <p className="font-[500] text-[12px] leading-[14.4px]">
                        Completed
                      </p>
                    </div>
                    <Image
                      onClick={handleDelete}
                      src={trash}
                      alt="trash icon"
                      className="absolute right-[14.4px] top-5"
                    />
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }} // Hide the file input element
                onChange={handleFileUpload} // Handle file selection
              />
            </div>

            <DialogFooter>
              <div className="flex justify-between items-center w-full gap-x-4">
                <Button
                  size={"lg"}
                  variant="outline"
                  className="w-full h-[56px] font-[500] text-[18px] border hover:border-gray-400 rounded-[16px] instant-anim"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-[56px] font-[500] border hover:bg-black hover:text-white text-[18px] rounded-[16px] instant-anim"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormTrigger;
