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
import { Plus } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { ChangeEvent, useEffect, useRef, useState } from "react";

interface UpdateRuleTriggerProps {
  open: boolean;
  onClose: () => void;
  rule: any;
}
const UpdateRule = ({ open, onClose, rule }: UpdateRuleTriggerProps) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ruleFileBase64, setRuleRuleBase64] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // Parse the string date into a Date object for the DatePicker
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const [day, month, year] = dateString.split("-").map(Number);
    if (!day || !month || !year) return undefined;
    return new Date(year, month - 1, day); // JavaScript months are 0-indexed
  };
  
  const [amendedDate, setAmendedDate] = useState<Date | undefined>(parseDate(rule.amendedDate));
  const [constitutionRules, setConstitutionRules] = useState(
    rule.constitutionRules
  );
  const [imageSizeLimit, setImageSizeLimit] = useState(false);

  const { toast } = useToast();
  const { updateRule, loading, error } = useRules();

  useEffect(() => {
    if (rule.fileName) {
      // If fileName exists, set rileFileBase64
      setSelectedFileName(rule.fileName);
    }
  }, [rule]);

  const handleClick = () => {
    fileInputRef.current?.click(); // Trigger the file input dialog
  };

  const formattedAmendedDate = amendedDate
  ? format(amendedDate, "dd-MM-yyyy")
  : undefined;

   // Create dataToSend dynamically
   const dataToSend: any = {
    amendedDate: formattedAmendedDate,
    constitutionRules,
    fileName: selectedFileName,
  };

  // Check if file or link needs to be added to the dataToSend
  if (ruleFileBase64) {
    dataToSend.file = ruleFileBase64; // If file is uploaded
  } else {
    delete dataToSend.file;
  }

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const maxSize = 500 * 1024; // 500KB size limit
      const fileSize = file.size;

      // Store the file name
      setSelectedFileName(file.name);

      if (fileSize && fileSize > maxSize) {
        setImageSizeLimit(true); // File size exceeds limit
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
    setRuleRuleBase64(null);
    setSelectedFileName(null);
    setUploadComplete(false);

    // Manually trigger file input again by clicking it after deletion
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, errors } = await updateRule(rule._id, dataToSend);

      if (errors) {
        toast({
          variant: "destructive",
          description: "Error updating Rule",
        });
      }

      toast({
        description: "Rule updated successfully",
      });

      setConstitutionRules("");
      setAmendedDate(undefined);
      setSelectedFileName(null);
      setRuleRuleBase64(null);
      setUploadComplete(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClose(); // Close dialog on success
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Error adding rule",
      });
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogTrigger></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>
              Please enter the rule information
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
                  value={constitutionRules}
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
                  <DatePicker 
                    date={amendedDate} 
                    setDate={setAmendedDate}
                    mode="single"
                    showMonthYearPicker={true}
                    captionLayout="dropdown-buttons"
                  />
                </div>
              </div>

              {!uploadComplete && (
                <div className=" flex flex-col gap-y-2 gap-4">
                  <Label
                    htmlFor="amended_date"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Upload rules Doc
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
                    Upload rules Doc
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
                onChange={handleLogoUpload} // Handle file selection
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
                  {loading ? "Updating..." : "Update"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateRule;
