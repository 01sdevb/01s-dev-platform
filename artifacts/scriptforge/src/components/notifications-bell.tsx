import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead, markAllNotificationsRead, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: getGetNotificationsQueryKey(),
    queryFn: () => getNotifications(),
    refetchInterval: 60000,
  });

  const unread = (notifications as Notification[]).filter((n) => !n.isRead).length;

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const apiBase = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "";
    const url = `${apiBase}/api/notifications/stream`;
    let es: EventSource;
    try {
      es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;
      es.onmessage = () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      };
      es.onerror = () => { es.close(); };
    } catch (_e) {
      // SSE not available
    }
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [queryClient]);

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold text-sm">Notificaciones</span>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Marcar todo leído
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Sin notificaciones por ahora
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {(notifications as Notification[]).slice(0, 20).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start gap-1 px-3 py-2 cursor-pointer ${!n.isRead ? "bg-primary/5" : ""}`}
                onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}
              >
                <div className="flex items-start gap-2 w-full">
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-medium" : "text-muted-foreground"} leading-tight`}>
                      {n.message}
                    </p>
                    {n.scriptId && (
                      <Link
                        href={`/script/${n.scriptId}`}
                        className="text-xs text-primary hover:underline mt-0.5 block"
                        onClick={() => setOpen(false)}
                      >
                        Ver script →
                      </Link>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
