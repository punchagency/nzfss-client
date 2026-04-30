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
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateClubFormSchema } from "@/schema/club.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useClubs } from "@/service/ClubService";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user_context";

interface UpdateClubTriggerProps {
    open: boolean;
    onClose: () => void;
    club: any;
  }
const UpdateClubTrigger = ({ open, onClose, club}: UpdateClubTriggerProps) => {
  const { toast } = useToast();
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const { updateClub, loading, error } = useClubs();

  const form = useForm<z.infer<typeof updateClubFormSchema>>({
    resolver: zodResolver(updateClubFormSchema),
    defaultValues: {
      name: club.name,
      email: club.email,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof updateClubFormSchema>) => {
    try {
      // Prepare update object
      const updateObj: any = {
        name: values.name,
        email: values.email,
      };

      // Only include password in update if provided
      if (values.newPassword) {
        updateObj.password = values.newPassword;
      }

      // Update club
      const result = await updateClub({
        variables: {
          clubId: club._id,
          input: updateObj,
        },
      });

      if (result.errors) {
        toast({
          variant: "destructive",
          description: result.errors[0].message
        });
        return;
      }

      if (!result.data?.updateClub) {
        toast({
          variant: "destructive",
          description: "Failed to update club"
        });
        return;
      }
      
      toast({
        description: "Club updated successfully",
      });
      
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Error updating club:", error);
      toast({
        variant: "destructive",
        description: error.message || "Error updating club"
      });
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogTrigger>
          <div className="flex gap-x-2 border rounded-[16px] py-2 px-3 text-[0.7rem]  lg:text-[0.8rem] 2xl:text-[1rem] 3xl:text-[18px] font-[600]">
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit a Club</DialogTitle>
            <DialogDescription>
              Please enter the club information
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="">
              <div className="flex flex-col gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label
                        htmlFor="name"
                        className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                      >
                        Enter club name
                      </Label>
                      <FormControl>
                        <Input
                          className="outline-none border border-[#00000033] rounded-[12px] h-[52px] px-3 py-2 md:py-4 2xl:text-[1rem] 3xl:text-[1.125rem]"
                          placeholder="Enter club name"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label
                        htmlFor="email"
                        className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                      >
                        Enter club email
                      </Label>
                      <FormControl>
                        <Input
                          className="outline-none border border-[#00000033] rounded-[12px] h-[52px] px-3 py-2 md:py-4 2xl:text-[1rem] 3xl:text-[1.125rem]"
                          placeholder="Enter club email"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin && (
                  <>
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <Label
                            htmlFor="newPassword"
                            className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                          >
                            New Password
                          </Label>
                          <FormControl>
                            <Input
                              type="password"
                              className="outline-none border border-[#00000033] rounded-[12px] h-[52px] px-3 py-2 md:py-4 2xl:text-[1rem] 3xl:text-[1.125rem]"
                              placeholder="Enter new password"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <Label
                            htmlFor="confirmPassword"
                            className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                          >
                            Confirm New Password
                          </Label>
                          <FormControl>
                            <Input
                              type="password"
                              className="outline-none border border-[#00000033] rounded-[12px] h-[52px] px-3 py-2 md:py-4 2xl:text-[1rem] 3xl:text-[1.125rem]"
                              placeholder="Confirm new password"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <DialogFooter>
                <div className="flex justify-between items-center w-full gap-x-4">
                  <Button
                    type="button"
                    onClick={onClose}
                    size={"lg"}
                    variant="outline"
                    className="instant-anim w-full h-[56px] font-[600] text-[18px] rounded-[16px]"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="outline"
                    className="instant-anim w-full h-[56px] font-[600] text-[18px] rounded-[16px]"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateClubTrigger;
