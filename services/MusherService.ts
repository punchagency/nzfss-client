import { Musher, IMusher } from "../models/Musher";

export class MusherService {
  static async getAllMushers(): Promise<IMusher[]> {
    try {
      return await Musher.find();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error fetching mushers: ${errorMessage}`);
    }
  }

  static async getMusherById(id: string): Promise<IMusher | null> {
    try {
      return await Musher.findById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error fetching musher: ${errorMessage}`);
    }
  }

  static async createMusher(musherData: any): Promise<IMusher> {
    try {
      const musher = new Musher(musherData);
      return await musher.save();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error creating musher: ${errorMessage}`);
    }
  }

  static async updateMusher(id: string, musherData: any): Promise<IMusher | null> {
    try {
      return await Musher.findByIdAndUpdate(
        id,
        { $set: musherData },
        { new: true, runValidators: true }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error updating musher: ${errorMessage}`);
    }
  }

  static async deleteMusher(id: string): Promise<boolean> {
    try {
      const result = await Musher.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error deleting musher: ${errorMessage}`);
    }
  }
} 