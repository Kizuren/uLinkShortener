export interface SessionInfo {
  id: string;
  accountId: string;
  userAgent: string;
  lastActive: Date;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
  isCurrentSession?: boolean;
}