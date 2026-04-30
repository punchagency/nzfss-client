import { date_icon, pdf, trash } from "@/assets";
import { DatePicker } from "@/components/date_picker";
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
import { useRules } from "@/service/rulesService";
import { getBase64 } from "@/utils/upload";
import { AlertCircle, Plus } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { format } from "date-fns";

interface ClubTriggerProps {
  btn: string;
}
const RulesTrigger = ({ btn }: ClubTriggerProps) => {
  const [open, setOpen] = useState(false);

  const [selectedFileName, setSelectedFileName] = useState<string | undefined>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ruleFileBase64, setRuleRuleBase64] = useState<string | undefined>('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [amendedDate, setAmendedDate] = useState<Date>();
  const [constitutionRules, setConstitutionRules] = useState("");
  const [imageSizeLimit, setImageSizeLimit] = useState(false);
  const [fileSize, setFileSize] = useState<number>(0);
  
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB size limit
  const MAX_FILE_SIZE_DISPLAY = "10MB";

  const { toast } = useToast();
  const { addRule, loading, error } = useRules();

  const handleClick = () => {
    fileInputRef.current?.click(); // Trigger the file input dialog
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const fileSize = file.size;
      setFileSize(fileSize);

      // Store the file name
      setSelectedFileName(file.name);

      if (fileSize && fileSize > MAX_FILE_SIZE) {
        setImageSizeLimit(true); // File size exceeds limit
        setUploadComplete(false);
        return;
      }
      setImageSizeLimit(false);

      setUploadComplete(false);

      getBase64(file, (result) => {
        setRuleRuleBase64(result as string); // Store Base64 string
        setUploadComplete(true);
      });
    }
  };

  const handleDelete = () => {
    // Clear the Base64 data and the file name
    setRuleRuleBase64('');
    setSelectedFileName('');
    setUploadComplete(false);
    setImageSizeLimit(false);
    setFileSize(0);

    // Manually trigger file input again by clicking it after deletion
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formattedAmendedDate = amendedDate
    ? format(amendedDate, "dd-MM-yyyy")
    : undefined;

    const resetForm = () => {
      setConstitutionRules("");
      setAmendedDate(undefined);
      setSelectedFileName('');
      setRuleRuleBase64('');
      setUploadComplete(false);
      setImageSizeLimit(false);
      setFileSize(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await addRule({
        amendedDate: formattedAmendedDate,
        constitutionRules: constitutionRules,
        file: ruleFileBase64,
        fileName: selectedFileName,
      });

      if (!data) {
        toast({
          variant: "destructive",
          description: "Error adding Rule",
        });
      }

      toast({
        description: "Rule added successfully",
      });

      resetForm()

      setOpen(false); // Close dialog on success
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Error adding rule",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <div className="instant-anim flex gap-x-2 border border-[#00000033] py-2 px-2 rounded-[16px] font-[500] text-[#000000] text-[0.95vw]">
            <span>{btn}</span>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Rule</DialogTitle>
            <DialogDescription>
              Please enter the new rule information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className=" flex flex-col  gap-4 py-4">
              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="name"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Constitution & rules name
                </Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter constitution & rules name "
                  className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                  onChange={(e) => setConstitutionRules(e.target.value)}
                />
              </div>

              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="amended_date"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Amended Date
                </Label>
                <div className="relative w-full">
                <DatePicker date={amendedDate} setDate={setAmendedDate} />
                </div>
              </div>

              {!uploadComplete && (
                <div className=" flex flex-col gap-y-2 gap-4">
                  <Label
                    htmlFor="amended_date"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Upload rules Doc <span className="text-[14px] font-[400] text-gray-500">(Max file size: {MAX_FILE_SIZE_DISPLAY})</span>
                  </Label>
                  <div
                    onClick={handleClick}
                    className={`w-full border-dashed border-2 h-auto min-h-[52px] rounded-[12px] flex flex-col items-center justify-center cursor-pointer ${imageSizeLimit ? "border-red-500" : ""}`}
                  >
                    <div className="py-3 px-4 w-full text-center">
                      <Plus className="w-[11.31px] h-[11.31px] text-[#000000] mx-auto mb-1" />
                      {imageSizeLimit && (
                        <div className="flex items-center justify-center gap-2 text-red-500 mt-2 mb-1">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">File exceeds the {MAX_FILE_SIZE_DISPLAY} limit ({formatFileSize(fileSize)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uploadComplete && (
                <div className=" flex flex-col gap-y-2 gap-4">
                  <Label
                    htmlFor="amended_date"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Upload rules Doc <span className="text-[14px] font-[400] text-gray-500">(Max file size: {MAX_FILE_SIZE_DISPLAY})</span>
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
                        Completed ({formatFileSize(fileSize)})
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
                accept=".pdf"
                style={{ display: "none" }} // Hide the file input element
                onChange={handleLogoUpload} // Handle file selection
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
                  className="w-full h-[56px] font-[500] text-[18px] border hover:bg-black hover:text-white rounded-[16px] instant-anim"
                  type="submit"
                  disabled={loading || imageSizeLimit}
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

export default RulesTrigger;
