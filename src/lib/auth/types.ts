export type ViewerRole =
  | "CUSTOMER"
  | "SUPPORT"
  | "STAFF"
  | "ADMIN"
  | "SUPER_ADMIN";

export type ViewerProfile = {
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  minecraftUsername: string | null;
  setupStep: number;
  birthday: string | null;
  country: string | null;
  bio: string | null;
  marketingOptIn: boolean;
};

export type Viewer = {
  id: string;
  publicId: string;
  email: string;
  role: ViewerRole;
  emailVerified: boolean;
  totpEnabled: boolean;
  isDemo: boolean;
  profile: ViewerProfile | null;
};

export type ViewerStats = {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  spentLabel: string;
};

export type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalLabel: string;
  itemsLabel: string;
  createdAtLabel: string;
};

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAtLabel: string;
};
