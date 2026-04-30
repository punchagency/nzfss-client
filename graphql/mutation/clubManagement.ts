import { gql } from '@apollo/client';

export const CREATE_CLUB_MANAGEMENT = gql`
  mutation CreateClubManagement($input: CreateClubManagementInput!) {
    createClubManagement(input: $input) {
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

export const UPDATE_CLUB_MANAGEMENT = gql`
  mutation UpdateClubManagement($clubId: String!, $input: UpdateClubManagementInput!) {
    updateClubManagement(clubId: $clubId, input: $input) {
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