export type ItemStatus = "lost" | "found" | "claimed" | "returned";

export type Category = string;

export type Item = {
  id: string;
  title: string;
  category: Category;
  status: ItemStatus;
  location: string;
  date: string;
  time?: string;
  description: string;
  image: string;
  images?: string[];
  reporter: string;
  reporterId?: string;
};

export type NewItem = Omit<Item, "id"> & {
  contactEmail: string;
  contactPhone?: string;
};

export type Claim = {
  id?: string;
  itemId?: string;
  name: string;
  email: string;
  details: string;
  uniqueMarks?: string;
  lostDate?: string;
  lostLocation?: string;
  photoUrl?: string;
  consent?: boolean;
  ownerId?: string;
  status?: ClaimStatus;
  createdAt?: string;
  userId?: string;
  statusHistory?: ClaimStatusEntry[];
};

export type ClaimStatus = "submitted" | "under_review" | "approved" | "rejected" | "handed_over";

export type ClaimStatusEntry = {
  status: ClaimStatus;
  timestamp: string;
  note?: string;
};

export type HandoverDetails = {
  pickupLocation: string;
  pickupTime: string;
  idRequired: boolean;
  updatedAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
  avatarUrl?: string;
};

export type Message = {
  id: string;
  itemId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt?: string;
  threadId?: string;
};

export type MessageThread = {
  id: string;
  claimId: string;
  itemId: string;
  itemTitle: string;
  otherParticipantName: string;
  lastMessage?: Message;
  unreadCount: number;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt?: string;
};
