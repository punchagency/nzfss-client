import { Musher, IMusher } from "../../models/Musher";

export const musherResolvers = {
  Query: {
    getAllMushers: async (): Promise<IMusher[]> => {
      try {
        return await Musher.find();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch mushers: ${errorMessage}`);
      }
    },

    getMusherById: async (_: any, { id }: { id: string }): Promise<IMusher | null> => {
      try {
        return await Musher.findById(id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch musher: ${errorMessage}`);
      }
    },
  },

  Mutation: {
    createMusher: async (_: any, { input }: { input: any }): Promise<IMusher> => {
      try {
        console.log("Resolver received input:", JSON.stringify(input, null, 2));
        
        const { name, registrationNo, dogs } = input;
        
        // Validate required fields
        if (!name || !registrationNo || !dogs) {
          console.error("Missing required fields:", { name, registrationNo, dogs });
          throw new Error("Missing required fields");
        }

        // Log the data being saved
        const musherData = {
          name,
          registrationNo,
          dogs: dogs.map((dog: any) => ({
            name: dog.name,
            pedigreeName: dog.pedigreeName,
            nzkcNo: dog.nzkcNo,
            nzfssNo: dog.nzfssNo,
            dateOfBirth: dog.dateOfBirth,
            breed: dog.breed,
            deceased: dog.deceased || false
          }))
        };
        
        console.log("Creating musher with data:", JSON.stringify(musherData, null, 2));
        
        const musher = new Musher(musherData);
        
        // Log any validation errors
        const validationError = musher.validateSync();
        if (validationError) {
          console.error("Mongoose validation error:", validationError);
          throw new Error(`Validation failed: ${validationError.message}`);
        }
        
        const savedMusher = await musher.save();
        console.log("Successfully saved musher:", savedMusher);
        return savedMusher;
      } catch (error) {
        console.error("Error in createMusher resolver:", error);
        throw error;
      }
    },

    updateMusher: async (_: any, { id, input }: { id: string; input: any }): Promise<IMusher | null> => {
      try {
        return await Musher.findByIdAndUpdate(
          id,
          { $set: input },
          { new: true, runValidators: true }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to update musher: ${errorMessage}`);
      }
    },

    deleteMusher: async (_: any, { id }: { id: string }): Promise<boolean> => {
      try {
        const result = await Musher.findByIdAndDelete(id);
        return !!result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to delete musher: ${errorMessage}`);
      }
    },
  },
}; 