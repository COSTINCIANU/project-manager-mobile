export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: "ROLE_ADMIN" | "ROLE_USER";
}

export function getUserFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function getUserInitials(user: User): string {
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}
