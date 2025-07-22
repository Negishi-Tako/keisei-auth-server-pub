export interface LoginRequest {
  studentid: number;
  pin: string;
}

export interface AuthLogEntry {
  studentId: number;
  result: boolean;
  ip: string;
}

export interface DatabaseError extends Error {
  sqlMessage?: string;
}

export interface Session {
  id: string;
  ticketId: number;
  expiresAt: Date;
}

export interface ContainerSASOptions {
  containerName: string;
  permissions?: string;
  expiresIn?: number; // minutes
  prefix?: string;
}

export interface SASUrlResponse {
  url: string;
  expiresAt: Date;
  containerName: string;
  prefix?: string;
} 