import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteErrorPage } from "@/app/RouteErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
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
