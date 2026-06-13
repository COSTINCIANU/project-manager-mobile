export interface User {
  id: number;
  email: string;
  name: string | null;
  firstName?: string;
  lastName?: string;
  avatar: string | null;
  role: string;
  createdAt?: string;
}

export function getUserFullName(user: User): string {
  if (user.name) return user.name;
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName}`;
  return user.email;
}

export function getUserInitials(user: User): string {
  if (user.name) {
    const parts = user.name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return user.email[0].toUpperCase();
}
