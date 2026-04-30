import { useState, useRef } from "react";
import { placeholder } from "@/assets";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image";

interface ContactTriggerProps {
    btn: string | React.ReactNode;
    onSubmit?: (data: { 
      name: string; 
      designation: string; 
      email: string; 
      image: File | null; 
    }) => Promise<void>;
}

const ContactTrigger = ({ btn, onSubmit }: ContactTriggerProps) => {
  const [selectedImage, setSelectedImage] = useState<string>(placeholder.src);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    email: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({ name: "", designation: "", email: "" });
    setSelectedImage(placeholder.src);
    setImageFile(null);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!formData.name.trim()) {
      alert("Please enter a name");
      return;
    }
    if (!formData.designation.trim()) {
      alert("Please enter a designation");
      return;
    }
    if (!formData.email.trim()) {
      alert("Please enter an email");
      return;
    }

    try {
      console.log("Submitting form data:", {
        ...formData,
        imageSize: imageFile?.size,
        imageType: imageFile?.type
      });
      
      if (onSubmit) {
        await onSubmit({
          name: formData.name,
          designation: formData.designation,
          email: formData.email,
          image: imageFile
        });
      }
      
      setIsOpen(false);
      // Form is reset in handleDialogChange when dialog closes
    } catch (error) {
      // More detailed error handling
      console.error("Full error object:", error);
      
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
        alert(`Failed to submit: ${error.message}`);
      } else {
        alert("An unexpected error occurred");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
          <div>{btn}</div>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a New Contact</DialogTitle>
            <DialogDescription>
              Add contact information for club representatives
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-y-2 gap-4">
              <Image 
                width={104} 
                height={104} 
                src={selectedImage} 
                alt="Contact image" 
                className="rounded-full object-cover"
              />

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
              />
              
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border font-[700] text-[1rem] 3xl:text-[18px] w-[164px] h-[40px] rounded-[12px]"
              >
                Upload Image
              </Button>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="name" className="text-left font-[600] text-[16px] 3xl:text-[18px]">
                Name
              </Label>
              <Input 
                type="text"
                id="name"
                placeholder="Enter name"
                className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="designation" className="text-left font-[600] text-[16px] 3xl:text-[18px]">
                Designation
              </Label>
              <Input 
                type="text"
                id="designation"
                placeholder="Enter designation"
                className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="email" className="text-left font-[600] text-[16px] 3xl:text-[18px]">
                Email
              </Label>
              <Input 
                type="email"
                id="email"
                placeholder="Enter email"
                className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between items-center w-full gap-x-4">
              <Button 
                size="lg" 
                variant="outline" 
                className="instant-anim w-full h-[56px] font-[600] text-[18px] hover:border-gray-400 hover:border rounded-[16px]" 
                type="button" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="outline" 
                className="instant-anim w-full h-[56px] font-[600] text-[18px] hover:bg-black hover:text-white rounded-[16px]" 
                type="submit"
              >
                Add
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ContactTrigger