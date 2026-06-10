export interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string | null;
  lastSeen: string;
  chats?: { content: string; createdAt: string }[];
}

export interface SearchUser extends User {
  isFriend: boolean;
}

export interface Message {
  id: string;
  content: string | null;
  photoUrl?: string | null;
  createdAt: Date | string;
  updatedAt?: Date;
  isEdited?: boolean;
  conversationId: string;
  senderId: string;
  receiverId: string;
  statuses?: Record<string, unknown>[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  reactions?: {
    emoji: string;
    users: string[]; // User IDs
  }[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  type?: "text" | "audio"; // New field to differentiate voice messages
}
