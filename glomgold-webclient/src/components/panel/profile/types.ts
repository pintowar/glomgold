export interface ProfilePasswordForm {
  actualPassword: string;
  newPassword: string;
}

export interface ProfileInfo {
  name: string;
  email: string;
  locale: string;
  timezone: string;
}

export type ProfileForm = ProfileInfo;
