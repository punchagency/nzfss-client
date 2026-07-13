import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@apollo/client";
import { UPDATE_ENTRANT } from "@/graphql/mutation/addResult";
import { GET_ALL_RESULTS } from "@/graphql/query/addResult";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import SelectComponent from "@/components/selectComponent";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StartTimeInput } from "@/components/start-time";

interface Driver {
  name: string;
  dogs: string[];
  raceTime?: string;
  raceStatus: "Started" | "Did not start" | "Did not qualify";
}

interface EditResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrant: {
    _id: string;
    raceFormat: string;
    class: string;
    customClass?: string;
    drivers: Driver[];
  };
}

export const EditResultModal = ({ isOpen, onClose, entrant }: EditResultModalProps) => {
  console.log("entrant in edit result modal",entrant);
  const [formData, setFormData] = useState({
    raceFormat: entrant.raceFormat || "",
    classType: entrant.class?.toLowerCase() || "",
    class: entrant.customClass || entrant.class || "",
    drivers: entrant.drivers || []
  });

  // Class type options
  const speed = [
    "Bikejoring",
    "Canicross",
    "Single-Dog Scooter",
    "Two-Dog Scooter",
    "2-Dog Rig",
    "3-Dog Rig",
    "4-Dog Rig",
    "6-Dog Rig",
    "8-Dog Rig",
  ];

  const freight = [
    "Single-Dog Scooter",
    "Two-Dog Scooter",
    "2-Dog Rig",
    "3-Dog Rig",
    "4-Dog Rig",
    "6-Dog Rig",
    "8-Dog Rig",
    "Open Class Rig",
  ];

  const snow = [
    "Skijoring",
    "2-Dog Rig",
    "3-Dog Rig",
    "4-Dog Rig",
    "6-Dog Rig",
    "8-Dog Rig",
    "Open Class Rig",
  ];

  const weightPull = ["Single-Dog Scooter"];

  const getClassOptions = (classType: string) => {
    switch (classType.toLowerCase()) {
      case "speed": return speed;
      case "freight": return freight;
      case "snow": return snow;
      case "weight pull": return weightPull;
      default: return [];
    }
  };

  const handleDriverChange = (index: number, field: keyof Driver, value: any) => {
    setFormData(prev => {
      const newDrivers = [...prev.drivers];
      newDrivers[index] = {
        ...newDrivers[index],
        [field]: value
      };
      return { ...prev, drivers: newDrivers };
    });
  };

  const handleDogsChange = (index: number, dogsString: string) => {
    const dogsArray = dogsString.split(',').map(dog => dog.trim());
    handleDriverChange(index, 'dogs', dogsArray);
  };

  const [updateEntrant, { loading }] = useMutation(UPDATE_ENTRANT, {
    onCompleted: () => {
      toast.success("Result updated successfully");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update result: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEntrant({
        variables: {
          entrantId: entrant._id,
          input: formData
        },
      });
    } catch (error) {
      console.error("Error updating entrant:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Edit Result</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Race Formfat */}
          <div className="space-y-2">
            <Label>Race Format</Label>
            <SelectComponent
              placeholder="Select race format"
              items={["Single", "Heated"]}
              value={formData.raceFormat}
              onChange={(value) => setFormData(prev => ({ ...prev, raceFormat: value }))}
            />
          </div>

          {/* Class Type */}
          <div className="space-y-2">
            <Label>Class Type</Label>
            <RadioGroup 
              value={formData.classType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, classType: value, class: "" }))}
            >
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="speed" id="speed" />
                  <Label htmlFor="speed">Speed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="freight" id="freight" />
                  <Label htmlFor="freight">Freight</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="snow" id="snow" />
                  <Label htmlFor="snow">Snow</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weight pull" id="weight-pull" />
                  <Label htmlFor="weight-pull">Weight pull</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Class */}
          <div className="space-y-2">
            <Label>Class</Label>
            <SelectComponent
              placeholder="Select class"
              items={getClassOptions(formData.classType)}
              value={formData.class}
              onChange={(value) => setFormData(prev => ({ ...prev, class: value }))}
            />
          </div>

          {/* Driver Details */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Driver Details</Label>
            {formData.drivers.map((driver, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  {/* Driver Name */}
                  <div className="space-y-2">
                    <Label>Driver Name</Label>
                    <Input
                      value={driver.name}
                      onChange={(e) => handleDriverChange(index, 'name', e.target.value)}
                      placeholder="Enter driver name"
                    />
                  </div>

                  {/* Race Status */}
                  <div className="space-y-2">
                    <Label>Race Status</Label>
                    <SelectComponent
                      placeholder="Select status"
                      items={["Started", "Did not start", "Did not qualify"]}
                      value={driver.raceStatus}
                      onChange={(value) => handleDriverChange(index, 'raceStatus', value)}
                    />
                  </div>
                </div>

                {/* Dogs */}
                <div className="space-y-2">
                  <Label>Associated Dogs</Label>
                  <Input
                    value={driver.dogs.join(', ')}
                    onChange={(e) => handleDogsChange(index, e.target.value)}
                    placeholder="Enter dog names, separated by commas"
                  />
                </div>

                {/* Race Time - Only show if status is "Started" */}
                {driver.raceStatus === "Started" && (
                  <div className="space-y-2">
                    <Label>Race Time</Label>
                    <StartTimeInput
                      value={driver.raceTime || ""}
                      onChange={(value) => handleDriverChange(index, 'raceTime', value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-black/90"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditResultModal; 