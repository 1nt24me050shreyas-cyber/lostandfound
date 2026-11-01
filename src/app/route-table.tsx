import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteErrorPage } from "@/app/RouteErrorPage";
import { RequireAuth } from "@/app/RequireAuth";
import { RequireAdmin } from "@/app/RequireAdmin";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "sign-in",
        lazy: async () => {
          const { SignInPage } = await import("@/pages/AuthPages");
          return { Component: SignInPage };
        },
      },
      {
        path: "sign-up",
        lazy: async () => {
          const { SignUpPage } = await import("@/pages/AuthPages");
          return { Component: SignUpPage };
        },
      },
      {
        path: "forgot-password",
        lazy: async () => {
          const { ForgotPasswordPage } = await import("@/pages/AuthPages");
          return { Component: ForgotPasswordPage };
        },
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireAdmin />,
            children: [
              {
                path: "admin",
                lazy: async () => {
                  const { AdminPage } = await import("@/pages/AdminPage");
                  return { Component: AdminPage };
                },
              },
            ],
          },
          {
            path: "account",
            lazy: async () => {
              const { AccountPage } = await import("@/pages/AccountPage");
              return { Component: AccountPage };
            },
          },
          {
            path: "claims/:claimId",
            lazy: async () => {
              const { ClaimStatusPage } = await import("@/pages/ClaimFlowPages");
              return { Component: ClaimStatusPage };
            },
          },
          {
            path: "claims/:claimId/handover",
            lazy: async () => {
              const { HandoverPage } = await import("@/pages/ClaimFlowPages");
              return { Component: HandoverPage };
            },
          },
          {
            path: "messages",
            lazy: async () => {
              const { MessagesPage } = await import("@/pages/ClaimFlowPages");
              return { Component: MessagesPage };
            },
          },
          {
            path: "messages/:threadId",
            lazy: async () => {
              const { MessagesPage } = await import("@/pages/ClaimFlowPages");
              return { Component: MessagesPage };
            },
          },
        ],
      },
      {
        index: true,
        lazy: async () => {
          const { HomePage } = await import("@/pages/HomePage");
          return { Component: HomePage };
        },
      },
      {
        path: "items",
        lazy: async () => {
          const { BrowsePage } = await import("@/pages/BrowsePage");
          return { Component: BrowsePage };
        },
      },
      {
        path: "items/:id",
        lazy: async () => {
          const { ItemDetailPage } = await import("@/pages/ItemDetailPage");
          return { Component: ItemDetailPage };
        },
      },
      {
        path: "report/:kind",
        lazy: async () => {
          const { ReportPage } = await import("@/pages/ReportPage");
          return { Component: ReportPage };
        },
      },
      {
        path: "design-system",
        lazy: async () => {
          const { DesignSystemPage } = await import("@/pages/DesignSystemPage");
          return { Component: DesignSystemPage };
        },
      },
      ...["how-it-works", "contact", "privacy", "guidelines", "faq"].map((topic) => ({
        path: topic,
        lazy: async () => {
          const { InfoPage } = await import("@/pages/InfoPage");
          return { Component: InfoPage };
        },
      })),
      {
        path: "*",
        lazy: async () => {
          const { NotFoundPage } = await import("@/pages/NotFoundPage");
          return { Component: NotFoundPage };
        },
      },
    ],
  },
]);
