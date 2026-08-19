export const USER_ROLES = ['OWNER', 'READ_ONLY'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}
