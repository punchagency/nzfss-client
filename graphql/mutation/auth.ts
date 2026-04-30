import { gql } from "@apollo/client";

/**
 * GraphQL mutation for user login.
 * 
 * @remarks
 * This mutation accepts an input of type LoginInput and returns
 * the logged in user's _id, email, name, role, and token.
 *
 * @example
 * // Example LoginInput type (server-side):
 * // type LoginInput = {
 * //   email: string;
 * //   password: string;
 * //   rememberMe?: boolean;
 * // };
 * 
 * To use in a query:
 * const [login] = useMutation(LOGIN);
 * login({ variables: { input: { email: "user@example.com", password: "secret", rememberMe: false } } });
 */
export const LOGIN = gql`
  mutation login($input: LoginInput!) {
    login(input: $input) {
      _id
      email
      name
      role
      token
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;
