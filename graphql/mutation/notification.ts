import { gql } from "@apollo/client";

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      _id
      title
      message
      type
      isRead
      userId
      eventId
      createdAt
    }
  }
`;