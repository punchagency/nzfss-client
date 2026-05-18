import { cloud_upload } from "@/assets";
import { SelectDropdown } from "@/components/selectDropdown";
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
import { useToast } from "@/hooks/use-toast";
import { useYearbooks } from "@/service/yearbookService";
import { getBase64 } from "@/utils/upload";
import {
  YEARBOOK_MAX_FILE_SIZE_BYTES,
  YEARBOOK_MAX_FILE_SIZE_MB,
} from "@/constants/upload";
import { Loader } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useState } from "react";

interface ClubTriggerProps {
  btn: string;
}

const YourbookTrigger = ({ btn }: ClubTriggerProps) => {
  const [open, setOpen] = useState(false);
  const [yearbookFileBase64, setYearbookFileBase64] = useState<string | null>(null);
  const [loadingState, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [imageSizeLimit, setImageSizeLimit] = useState(false);
  const [yearPublish, setYearPublish] = useState<string>(''); // Store selected year
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { toast } = useToast();
  const { addYearbook, loading:mutationLoading, error } = useYearbooks();

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const maxSize = YEARBOOK_MAX_FILE_SIZE_BYTES;
      const fileSize = file.size;

      // Clear previously selected file state before handling the next upload.
      setYearbookFileBase64(null);
      setUploadComplete(false);
      setSelectedFileName(null);
      setLoading(false);

      if (fileSize && fileSize > maxSize) {
        setImageSizeLimit(true); // File size exceeds limit
        e.target.value = "";
        return;
      }
      setImageSizeLimit(false);
      setSelectedFileName(file.name);

      // Trigger loading state and simulate file processing time
      setLoading(true);
      setUploadComplete(false);

      // Simulate file processing (3 seconds)
      setTimeout(() => {
        getBase64(file, (result) => {
          setYearbookFileBase64(result as string); // Store Base64 string
          setLoading(false);
          setUploadComplete(true);
        });
      }, 2000);
    }
  };


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (imageSizeLimit) {
        toast({
          variant: "destructive",
          description: `File size exceeds ${YEARBOOK_MAX_FILE_SIZE_MB}MB`,
        });
        return;
      }

      if (!yearbookFileBase64 || !yearPublish) {
        toast({
          variant: "destructive",
          description: "Please upload a yearbook and select a year",
        });
        return;
      }

      // Trigger the addYearbook mutation
      await addYearbook({
        variables: {
          input: {
            yearbook: yearbookFileBase64,
            yearbookName: selectedFileName,
            yearPublish: yearPublish,
          },
        },
      });

      toast({
        description: "Yearbook added successfully",
      });

      setOpen(false); // Close dialog on success
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Error adding yearbook",
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
            <DialogTitle>Upload yearbook</DialogTitle>
            <DialogDescription>Please upload your yearbook</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="">
            <div className="flex flex-col gap-4 py-4 w-full border-2 border-dashed justify-center items-center">
              {loadingState && (
                <div className="animate-spin">
                  <Loader />
                </div>
              )}

              {uploadComplete && !loadingState && !imageSizeLimit && (
                <div className="text-[18px] font-[700]">
                  ✔ File is ready for use
                </div>
              )}

              {!uploadComplete && !loadingState && imageSizeLimit && (
                <div className="text-[18px] text-red-500 font-[700]">
                  File size exceeds {YEARBOOK_MAX_FILE_SIZE_MB}MB
                </div>
              )}

              {!uploadComplete && !loadingState && !imageSizeLimit && (
                <>
                  <div className="flex justify-center items-center">
                    <Image
                      width={50}
                      height={48}
                      src={cloud_upload}
                      alt="upload image"
                    />
                  </div>

                  <div className="w-[280px] 3xl:w-[298px] flex flex-col justify-center items-center gap-y-2">
                    <h3 className="font-[600] leading-[25px] text-[1rem] 3xl:text-[18px] text-center">
                      Upload Yearbook
                    </h3>

                    <p className="text-[14px] 3xl:text-[1rem] font-[600] leading-[19.2px] text-center ">
                      Please add document image and then submit your image.
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <Input
                  className="outline-none text-center border font-[500] border-[#00000033] rounded-[12px] h-[44px] w-[120px] px-3 py-2 md:py-4 2xl:text-[1rem] 3xl:text-[1.125rem]"
                  placeholder="+ Upload"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleLogoUpload}
                />
                <p className="text-center text-xs text-[#696A6A]">
                  Max file size: {YEARBOOK_MAX_FILE_SIZE_MB}MB
                </p>
              </div>
            </div>

            <div className="w-full flex flex-col gap-y-2 pt-2 pb-4">
              <Label className="text-left font-[600] text-[16px] 3xl:text-[18px]">
                Published Year
              </Label>
              <SelectDropdown setYearPublish={setYearPublish} />
            </div>

            <DialogFooter>
              <div className="flex justify-between items-center w-full gap-x-4">
                <Button
                  size={"lg"}
                  variant="outline"
                  className="w-full h-[56px] font-[500] text-[18px] rounded-[16px] instant-anim"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-[56px] font-[500] text-[18px] rounded-[16px] instant-anim"
                  type="submit"
                  disabled={mutationLoading}
                >
                  {mutationLoading  ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YourbookTrigger;
