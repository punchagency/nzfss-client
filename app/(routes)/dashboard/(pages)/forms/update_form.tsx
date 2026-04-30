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
import { ChangeEvent, useEffect, useRef, useState } from "react";

interface UpdateFormTriggerProps {
  open: boolean;
  onClose: () => void;
  form: any;
}

const UpdateForm = ({ open, onClose, form }: UpdateFormTriggerProps) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formFileBase64, setFormFileBase64] = useState<string | null>(null);
  const [link, setLink] = useState<string>("");
  const [formType, setFormType] = useState(form.formType);
  const [formName, setFormName] = useState(form.formName);
  const [imageSizeLimit, setImageSizeLimit] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const { toast } = useToast();
  const { updateForm, loading, error } = useForms();

  useEffect(() => {
    if (form.fileName) {
      // If fileName exists, set formFileBase64
      setSelectedFileName(form.fileName);
    }
  }, [form]);

  const handleClick = () => {
    fileInputRef.current?.click(); // Trigger the file input dialog
  };

  const dataToSend: any = {
    formName: formName,
    formType: formType,
    // Conditionally set the fileName
    fileName: selectedFileName,
  };

  // Conditionally set the file
  if (formFileBase64) {
    dataToSend.file = formFileBase64;
  } else {
    delete dataToSend.file;
  }

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

    if (!formName || !formType) {
      toast({
        variant: "destructive",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Create a copy of the data to send
    const dataToSubmit = { ...dataToSend };

    // Sanitize the base64 string if it exists
    if (formFileBase64) {
      const sanitizedBase64 = sanitizeBase64(formFileBase64);
      if (!sanitizedBase64) {
        toast({
          variant: "destructive",
          description: "Invalid file format. Please try uploading the file again.",
        });
        return;
      }
      dataToSubmit.file = sanitizedBase64;
    }

    console.log('Submitting form update with:');
    console.log('- Form name:', formName);
    console.log('- Form type:', formType);
    console.log('- File name:', selectedFileName);
    if (formFileBase64) {
      console.log('- Base64 prefix:', dataToSubmit.file.substring(0, 50));
      console.log('- Base64 length:', dataToSubmit.file.length);
    }

    try {
      const { data, errors } = await updateForm(form._id, dataToSubmit);

      if (errors) {
        const errorMessage = errors?.[0]?.message || "Error updating Form";
        toast({
          variant: "destructive",
          description: errorMessage,
        });
        return;
      }

      toast({
        description: "Form updated successfully",
      });

      setUploadComplete(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClose(); // Close dialog on success
    } catch (error: any) {
      console.error('Form update error:', error);
      const errorMessage = error?.message || "Error updating Form";
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogTrigger>
          <div className="flex gap-x-2 border rounded-[16px] py-2 px-3 text-[0.7rem]  lg:text-[0.8rem] 2xl:text-[1rem] 3xl:text-[18px] font-[600]"></div>
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
                  value={formName}
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
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                />
              </div>

              {!uploadComplete && (
                <div className=" flex flex-col gap-y-2 gap-4">
                  <Label
                    htmlFor="amended_date"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Upload form Doc
                  </Label>
                  <div
                    onClick={handleClick}
                    className="w-full border-dashed border-2 h-[52px] rounded-[12px] flex items-center justify-center"
                  >
                    <Plus className="w-[11.31px] h-[11.31px] text-[#000000]" />
                  </div>
                </div>
              )}

              {uploadComplete && (
                <div className=" flex flex-col gap-y-2 gap-4">
                  <Label
                    htmlFor="amended_date"
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
                  className="w-full h-[56px] font-[500] text-[18px] border hover:border-gray-400 rounded-[16px]"
                  type="button"
                  onClick={() => onClose()}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-[56px] font-[500] text-[18px] border hover:bg-black hover:text-white rounded-[16px]"
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

export default UpdateForm;
