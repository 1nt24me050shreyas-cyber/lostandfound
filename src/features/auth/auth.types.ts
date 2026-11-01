export type SignInCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: import("@/types").User;
  accessToken: string;
  refreshToken: string;
};

export type SignUpCredentials = SignInCredentials & {
  name: string;
};

export type NotificationPreferences = {
  emailUpdates: boolean;
  claimMessages: boolean;
  communityNews: boolean;
};

export type UserAccountData = {
  profile: import("@/types").User;
  preferences: NotificationPreferences;
};

export type UserClaim = {
  claim: import("@/types").Claim;
  item: import("@/types").Item;
};
