export interface ProfilePasswordForm {
  actualPassword: string;
  newPassword: string;
}

interface ProfileInfo {
  name: string;
  email: string;
  locale: string;
  timezone: string;
}

export type ProfileForm = ProfileInfo;
