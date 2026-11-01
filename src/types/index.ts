export type ItemStatus = "lost" | "found" | "claimed" | "returned";

export type Category =
  | "Bags"
  | "Clothing"
  | "Documents"
  | "Electronics"
  | "Jewelry"
  | "Keys"
  | "Personal items"
  | "Sports & outdoors"
  | "Other";

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
  status?: "pending" | "approved" | "declined";
  createdAt?: string;
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
};
