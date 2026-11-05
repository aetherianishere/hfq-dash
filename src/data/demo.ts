import type {
  NotificationRow,
  OrderRow,
  Viewer,
  ViewerStats,
} from "@/lib/auth/types";

export const demoStats: ViewerStats = {
  totalOrders: 4,
  pendingOrders: 1,
  completedOrders: 3,
  spentLabel: "$24.96",
};

export const demoOrders: OrderRow[] = [
  {
    id: "demo-1",
    orderNumber: "HFQ-2026-0042",
    status: "COMPLETED",
    totalLabel: "$5.99",
    itemsLabel: "LEGEND",
    createdAtLabel: "28 Oct 2026",
  },
  {
    id: "demo-2",
    orderNumber: "HFQ-2026-0039",
    status: "UNDER_REVIEW",
    totalLabel: "$7.99",
    itemsLabel: "Blood Key",
    createdAtLabel: "24 Oct 2026",
  },
  {
    id: "demo-3",
    orderNumber: "HFQ-2026-0031",
    status: "COMPLETED",
    totalLabel: "$9.99",
    itemsLabel: "500 Shards",
    createdAtLabel: "12 Oct 2026",
  },
  {
    id: "demo-4",
    orderNumber: "HFQ-2026-0018",
    status: "REJECTED",
    totalLabel: "$2.00",
    itemsLabel: "ELITE to HEROIC",
    createdAtLabel: "02 Oct 2026",
  },
];

export const demoNotifications: NotificationRow[] = [
  {
    id: "demo-n1",
    title: "Order HFQ-2026-0042 delivered",
    message: "Your LEGEND rank is now active in-game. Enjoy the cosmetics!",
    type: "SUCCESS",
    read: false,
    createdAtLabel: "28 Oct 2026, 18:42",
  },
  {
    id: "demo-n2",
    title: "Receipt received",
    message:
      "We received your proof for HFQ-2026-0039. A staff member will review it shortly.",
    type: "INFO",
    read: false,
    createdAtLabel: "24 Oct 2026, 11:07",
  },
  {
    id: "demo-n3",
    title: "Payment rejected",
    message:
      "The receipt for HFQ-2026-0018 was unreadable. Please upload a clearer screenshot.",
    type: "ERROR",
    read: true,
    createdAtLabel: "03 Oct 2026, 09:15",
  },
];

export function demoViewer(publicId: string): Viewer {
  return {
    id: "demo",
    publicId,
    email: "player@hfqmc.xyz",
    role: "CUSTOMER",
    emailVerified: true,
    totpEnabled: false,
    isDemo: true,
    profile: {
      firstName: "HFQ",
      lastName: "Player",
      displayName: "HFQ Player",
      avatarUrl: null,
      minecraftUsername: "HFQ_Player",
      setupStep: 4,
      birthday: "2004-06-18",
      country: "Sri Lanka",
      bio: "HFQ player since 2024.",
      marketingOptIn: true,
    },
  };
}
