import React, { useState } from "react";

interface MusherRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DogData {
  petName: string;
  isDeceased: boolean;
  nzfssNumber: string;
  pedigreeName: string;
  breed: string;
  dateOfBirth: string;
  nzkcRegistration: string;
  nzkcOwner: string;
}

interface FormData {
  formType: "new" | "renewal" | "change";
  surname: string;
  firstName: string;
  address: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  guardianDetails?: string;
  nzfssRegistrationNumber?: string;
  dogs: DogData[];
  showProfileConsent: boolean;
}

const MusherRegistrationForm: React.FC<MusherRegistrationFormProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState<FormData>({
    formType: "new",
    surname: "",
    firstName: "",
    address: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    guardianDetails: "",
    nzfssRegistrationNumber: "",
    dogs: [{
      petName: "",
      isDeceased: false,
      nzfssNumber: "",
      pedigreeName: "",
      breed: "",
      dateOfBirth: "",
      nzkcRegistration: "",
      nzkcOwner: ""
    }],
    showProfileConsent: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDogInputChange = (index: number, field: keyof DogData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      dogs: prev.dogs.map((dog, i) => 
        i === index ? { ...dog, [field]: value } : dog
      )
    }));
  };

  const addDog = () => {
    setFormData(prev => ({
      ...prev,
      dogs: [...prev.dogs, {
        petName: "",
        isDeceased: false,
        nzfssNumber: "",
        pedigreeName: "",
        breed: "",
        dateOfBirth: "",
        nzkcRegistration: "",
        nzkcOwner: ""
      }]
    }));
  };

  const removeDog = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dogs: prev.dogs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Implement GraphQL mutation to submit form data
      // The mutation should include:
      // - formType (from select)
      // - formName (constant)
      // - applicantName
      // - file (if needed)
      // - fileName (if needed)
      
      console.log("Form submitted:", formData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[16px] w-[90%] max-w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#00000026] p-4 flex justify-between items-center">
          <h2 className="text-[24px] font-[700]">Musher/Dog Registration Form 2024</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <p className="mb-4">
            Please use this form if you are a <strong>MUSHER</strong> and like to
            register with the NZFSS and the National driver and dog point program.
            This form is also applicable for ANNUAL RENEWAL and ANY CHANGES that may
            occur during the race season.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-[600] mb-2">Instructions to use:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Please make sure the form is filled out correctly and legibly as applicable and tick all relevant boxes.</li>
              <li>The dog registration can only go on one application.</li>
              <li>Please register every dog you wish to collect award points.</li>
              <li>Please pay any fee to the club you are signing up with. Please note any deceased dog on the dog registration page box DEAD/DECEASED.</li>
              <li>If you have any questions, please contact your club representative.</li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-[600] mb-4">Fees</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>Annual Musher Renewal/New Application</div>
                <div>$23.50</div>
                <div>Junior Musher Registration</div>
                <div>Free</div>
                <div>Change of Registration</div>
                <div>$5.00</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Form Type</label>
                <select 
                  name="formType"
                  value={formData.formType}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="new">New Musher registration</option>
                  <option value="renewal">Renewal</option>
                  <option value="change">Change of Registration</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Surname</label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Guardian Details (if Junior)</label>
                <input
                  type="text"
                  name="guardianDetails"
                  value={formData.guardianDetails}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Dogs Section */}
              <div className="space-y-4">
                <h3 className="font-bold">Dogs</h3>
                {formData.dogs.map((dog, index) => (
                  <div key={index} className="border p-4 rounded">
                    <h4>Dog {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2">Pet Name</label>
                        <input
                          type="text"
                          value={dog.petName}
                          onChange={(e) => handleDogInputChange(index, "petName", e.target.value)}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      {/* Add all other dog fields similarly */}
                      {/* ... */}
                    </div>
                    {formData.dogs.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeDog(index)}
                        className="mt-2 text-red-600"
                      >
                        Remove Dog
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addDog}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Add Another Dog
                </button>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="showProfileConsent"
                    checked={formData.showProfileConsent}
                    onChange={(e) => handleInputChange({
                      target: {
                        name: "showProfileConsent",
                        value: e.target.checked
                      }
                    } as any)}
                    className="mr-2"
                  />
                  I consent to my profile being shown
                </label>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusherRegistrationForm; 