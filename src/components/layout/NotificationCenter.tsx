import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/claims/claims.api";
import { useAuth } from "@/hooks/useAuth";

function formatRelativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export function NotificationCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });
  const unreadCount = query.data?.filter((notification) => !notification.readAt).length ?? 0;
  const readOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (notification) => {
      queryClient.setQueryData(["notifications"], (current: typeof query.data) =>
        current?.map((entry) => (entry.id === notification.id ? notification : entry)),
      );
    },
  });
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      const readAt = new Date().toISOString();
      queryClient.setQueryData(["notifications"], (current: typeof query.data) =>
        current?.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? readAt,
        })),
      );
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !detailsRef.current?.contains(event.target)) {
        detailsRef.current?.removeAttribute("open");
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  if (!user) return null;

  return (
    <details className="notification-menu" ref={detailsRef}>
      <summary aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </summary>
      <section className="notification-popover" aria-label="Notifications">
        <header className="notification-popover-header">
          <div>
            <strong>Notifications</strong>
            <span>{unreadCount ? `${unreadCount} unread` : "You’re all caught up"}</span>
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </header>
        {query.isLoading ? (
          <p className="notification-empty">Loading notifications…</p>
        ) : query.isError ? (
          <div className="notification-empty" role="alert">
            <p>Notifications couldn’t be loaded.</p>
            <button type="button" onClick={() => void query.refetch()}>
              Try again
            </button>
          </div>
        ) : query.data?.length ? (
          <ul className="notification-list">
            {query.data.map((notification) => (
              <li className={notification.readAt ? "" : "is-unread"} key={notification.id}>
                <Link
                  to={notification.href}
                  onClick={() => {
                    if (!notification.readAt) readOne.mutate(notification.id);
                    detailsRef.current?.removeAttribute("open");
                  }}
                >
                  <span className="notification-item-icon">
                    {notification.readAt ? <Check size={14} /> : <span />}
                  </span>
                  <span className="notification-item-copy">
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                    <time dateTime={notification.createdAt}>
                      {formatRelativeTime(notification.createdAt)}
                    </time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="notification-empty">Updates about claims and messages will show up here.</p>
        )}
      </section>
    </details>
  );
}
