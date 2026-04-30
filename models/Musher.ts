import mongoose, { Schema, Document } from "mongoose";

export interface IDog extends Document {
  name: string;
  pedigreeName?: string;
  nzkcNo?: string;
  nzfssNo?: string;
  dateOfBirth?: string;
  breed?: string;
  deceased: boolean;
}

export interface IMusher extends Document {
  name: string;
  registrationNo: string;
  dogs: IDog[];
}

const DogSchema = new Schema({
  name: { type: String, required: true },
  pedigreeName: String,
  nzkcNo: String,
  nzfssNo: String,
  dateOfBirth: String,
  breed: String,
  deceased: { type: Boolean, default: false }
});

const MusherSchema = new Schema({
  name: { type: String, required: true },
  registrationNo: { type: String, required: true, unique: true },
  dogs: [DogSchema]
}, { timestamps: true });

export const Musher = mongoose.model<IMusher>("Musher", MusherSchema); 