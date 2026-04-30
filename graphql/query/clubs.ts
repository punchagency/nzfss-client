import { gql } from "@apollo/client";


export const GET_ALL_CLUBS = gql`
  query GetAllClubs {
    getAllClubs {
      _id
      name
      email
      role
    }
  }
`;

export const GET_ALL_CLUBS_DETAILS = gql`
  query GetAllClubs {
    getAllClubs {
      _id
      name
      email
    }
  }
`;

export const GET_ALL_CLUB_DETAILS = gql`
  query GetAllClubManagements {
    getAllClubManagements {
      clubName
      shortDescription
      clubLogo
      coverImage
      statistics {
        name
        icon
        isCustomIcon
      }
      whoWeAre {
        description
        images
      }
      services {
        name
        image
      }
      gallery {
        images
        videos
      }
      location {
        description
        address
        image
        coordinates {
          lat
          lng
        }
      }
      drivers {
        name
        image
        nzfssRR
        ipssRR
      }
      forms {
        fileName
        fileType
        fileSize
        fileData
      }
    }
  }
`;

export const GET_CLUB_BY_ID = gql`
  query findClubById($input: FindUserByIdInput!) {
    findClubById(input: $input) {
      _id
      name
      email
      role
    }
  }
`;

export const GET_CLUB_CONTACTS = gql`
  query GetAllContacts {
    getAllContacts {
      _id
      name
      designation
      email
      image
      created_at
      club
    }
  }
`;

export const GET_CLUB_CONTACT = gql`
  query GetClubContact($id: ID!) {
    getClubContact(id: $id) {
      id
      name
      designation
      email
      image
    }
  }
`;

export const CREATE_CLUB_CONTACT = gql`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      _id
      name
      designation
      email
      image
      created_at
      club
    }
  }
`;

export const UPDATE_CONTACT = gql`
  mutation UpdateContact($contactId: String!, $input: UpdateContactInput!) {
    updateContact(contactId: $contactId, input: $input) {
      _id
      name
      designation
      email
      image
      created_at
      club
    }
  }
`;

export const DELETE_CONTACT = gql`
  mutation DeleteContact($contactId: String!) {
    deleteContact(contactId: $contactId) {
      _id
      name
      designation
      email
      image
      created_at
    }
  }
`;

export const DELETE_CLUB_CONTACT = gql`
  mutation DeleteClubContact($id: ID!) {
    deleteClubContact(id: $id) {
      _id
      success
      message
    }
  }
`;

/**
 * Type definition for club contact data
 */
export interface ClubContact {
  _id: string;
  name: string;
  designation: string;
  email: string;
  image?: string;
  club: string;
  createdAt: string;
}

/**
 * Type definition for club contacts query response
 */
export interface ClubContactsResponse {
  getAllContacts: ClubContact[];
}

// Update the interface to match server s chema
export interface CreateContactInput {
  name: string;
  designation: string;
  email: string;
  image?: string | null;
  clubId: string;
}

// Update response interface
export interface CreateContactResponse {
  createContact: {
    _id: string;
    name: string;
    designation: string;
    email: string;
    image?: string;
    created_at: string;
    club: string;
  };
}

// Update the interface to match the query
export interface GetContactsResponse {
  getAllContacts: Array<{
    _id: string;
    name: string;
    designation: string;
    email: string;
    image?: string;
    created_at: string;
    club: string;
  }>;
}

// Add the response type
export interface DeleteContactResponse {
  deleteContact: {
    _id: string;
    name: string;
    designation: string;
    email: string;
    image?: string;
    created_at: string;
  }
}

// Update the interface to match the query
interface GetAllClubsData {
  getAllClubs: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

// Interface for users query response
interface GetAllUsersData {
  getAllUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

// Add the interface for update contact input
export interface UpdateContactInput {
  name: string;
  designation: string;
  email: string;
  image?: string | null;
}

// Add the interface for update contact response
export interface UpdateContactResponse {
  updateContact: {
    _id: string;
    name: string;
    designation: string;
    email: string;
    image?: string;
    created_at: string;
    club: string;
  };
}

// Update the interface for update contact parameters
export interface UpdateContactVariables {
  contactId: string;
  input: UpdateContactInput;
}

export const GET_CLUB_USERS = gql`
  query GetClubUsers {
    getAllUsers {
      _id
      name
      email
      role
    }
  }
`;

// Add interface for the new query
export interface GetClubUsersData {
  getAllUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export const GET_USER_CLUB_DETAILS = gql`
  query GetUserClubDetails {
    getUserClubDetails {
      clubName
      shortDescription
      clubLogo
      coverImage
      statistics {
        name
        value
        icon
        isCustomIcon
      }
      whoWeAre {
        description
        images
      }
      services {
        name
        image
      }
      gallery {
        images
        videos
      }
      location {
        description
        address
        image
        coordinates {
          lat
          lng
        }
      }
      drivers {
        name
        image
        nzfssRR
        ipssRR
      }
      forms {
        fileName
        fileType
        fileSize
        fileData
      }
    }
  }
`;

export const GET_CURRENT_USER_CLUB_DETAILS = gql`
  query GetCurrentUserClubDetails {
    getCurrentUserClubDetails {
      clubName
      shortDescription
      clubLogo
      coverImage
      statistics {
        name
        icon
        isCustomIcon
      }
      whoWeAre {
        description
        images
      }
      services {
        name
        image
      }
      gallery {
        images
        videos
      }
      location {
        description
        address
        image
        coordinates {
          lat
          lng
        }
      }
      drivers {
        name
        image
        nzfssRR
        ipssRR
      }
      forms {
        fileName
        fileType
        fileSize
        fileData
      }
    }
  }
`;
