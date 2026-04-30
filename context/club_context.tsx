// "use client";

// import { useMutation, useQuery } from "@apollo/client";
// import { useRouter } from "next/navigation";
// import React, { useState, useEffect, createContext, useContext } from "react";

// type ClubContextProviderProps = {
//     children: React.ReactNode;
//   };

// type ClubType = {
//   _id: string;
//   name: string;
// };

// type ClubContextType = {
//   clubs: ClubType[] | null;
//   currentClub: ClubType | null;
//   setClubs: (clubs: ClubType[]) => void;
//   getAllClubs: () => void;
//   deleteClub: (clubId: string) => Promise<void>;
//   updateClub: (clubId: string, input: any) => Promise<void>;
//   findClubById: (clubId: string) => void;
// };

// // Create the context
// const ClubContext = createContext<ClubContextType | null>(null);

// export default function ClubContextProvider({ children }: ClubContextProviderProps) {
//   const [clubs, setClubsState] = useState<ClubType[] | null>(null);
//   const [currentClub, setCurrentClubState] = useState<ClubType | null>(null);
//   const router = useRouter();

//   const { data, refetch } = useQuery(GET_ALL_CLUBS);
//   const [deleteClubMutation] = useMutation(DELETE_CLUB);
//   const [updateClubMutation] = useMutation(UPDATE_CLUB);
//   const [findClubByIdQuery] = useQuery(FIND_CLUB_BY_ID);

//   useEffect(() => {
//     if (data?.getAllClubs) {
//       setClubsState(data.getAllClubs);
//     }
//   }, [data]);

//   const setClubs = (clubs: ClubType[]) => {
//     setClubsState(clubs);
//   };

//   const getAllClubs = async () => {
//     try {
//       await refetch();
//       setClubsState(data?.getAllClubs || []);
//     } catch (error) {
//       console.error("Error fetching clubs", error);
//     }
//   };

//   const deleteClub = async (clubId: string) => {
//     try {
//       await deleteClubMutation({
//         variables: { clubId },
//       });
//       setClubsState((prev) => prev?.filter((club) => club._id !== clubId) || []);
//       router.push("/clubs"); // Navigate after delete
//     } catch (error) {
//       console.error("Error deleting club", error);
//     }
//   };

//   const updateClub = async (clubId: string, input: any) => {
//     try {
//       await updateClubMutation({
//         variables: { clubId, input },
//       });
//       await getAllClubs(); // Refetch clubs after update
//     } catch (error) {
//       console.error("Error updating club", error);
//     }
//   };

//   const findClubById = async (clubId: string) => {
//     try {
//       const response = await findClubByIdQuery({
//         variables: { clubId },
//       });
//       setCurrentClubState(response.data?.findClubById || null);
//     } catch (error) {
//       console.error("Error finding club", error);
//     }
//   };

//   return (
//     <ClubContext.Provider 
//       value={{
//           clubs,
//           currentClub,
//           setClubs,
//           getAllClubs,
//           deleteClub,
//           updateClub,
//           findClubById,
//         }}
//       >
//       {children}
//     </ClubContext.Provider>
//   );
// }

// // Custom hook to use the User context
// export function useClub() {
//   const context = useContext(ClubContext);

//   if (context === null) {
//     throw new Error("useUser must be used within a UserContextProvider");
//   }

//   return context;
// }
