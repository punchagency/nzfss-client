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
import { clubFormSchema } from "@/schema/club.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import PasswordField from "../../_components/password-field";
import { useClubs } from "@/service/ClubService";
import { useToast } from "@/hooks/use-toast";

interface ClubTriggerProps {
  btn: string;
}
const ClubTrigger = ({ btn }: ClubTriggerProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { addClub, loading, error } = useClubs();

  const form = useForm<z.infer<typeof clubFormSchema>>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof clubFormSchema>) => {
    try {
      // Trigger the addClub mutation with form values
       await addClub({
        variables: {
          input: {
            name: values.name,
            email: values.email,
            password: values.password,
          },
        },
      });
      
      toast({
        description: "Club added successfully",
      })
      form.reset();
      setOpen(false);
    } catch (error) {
      // Handle error if needed
      toast({
        variant: "destructive",
        description: "Error adding club"
      })
    }
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
            <DialogTitle>Add a Club</DialogTitle>
            <DialogDescription>
              Please enter the club information
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="">
              <div className=" flex flex-col  gap-4 py-4">
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

                <PasswordField
                  control={form.control}
                  name="password"
                  label="Enter password"
                  placeholder="Enter password"
                />

                <PasswordField
                  control={form.control}
                  name="confirmPassword"
                  label="Confirm password"
                  placeholder="Confirm password"
                />
              </div>

              <DialogFooter>
                <div className="flex justify-between items-center w-full gap-x-4">
                  <Button
                    type="button"
                    onClick={() => setOpen(false)}
                    size={"lg"}
                    variant="outline"
                    className="instant-anim border hover:border-gray-400 w-full h-[56px] font-[600] text-[18px] rounded-[16px]"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="outline"
                    className="instant-anim border hover:bg-black hover:text-white w-full h-[56px] font-[600] text-[18px] rounded-[16px]"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add"}
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

export default ClubTrigger;
