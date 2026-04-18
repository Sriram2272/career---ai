import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type NotificationType = "approved" | "rejected" | "pending" | "info" | "warning" | "announcement";
export type TargetAudience = "all" | "students" | "staff" | "specific-students" | "specific-section" | "specific-school" | "specific-department";
export type NotificationPriority = "normal" | "urgent" | "critical";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  time: Date;
  read: boolean;
  link?: string;
  sentBy?: string;
  sentByRole?: string;
  target?: TargetAudience;
  priority?: NotificationPriority;
}

export interface SentNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  target: TargetAudience;
  targetDetails: string;
  sentAt: Date;
  sentBy: string;
  sentByRole: string;
  recipientCount: number;
  readCount: number;
}

// These will be fetched from DB when connected, keep as fallback
export const MOCK_SCHOOLS = ["School of Computer Science", "School of Electronics", "School of Mechanical Engineering", "School of Civil Engineering"];
export const MOCK_DEPARTMENTS = ["CSE", "ECE", "ME", "CE", "IT", "AI-ML"];
export const MOCK_SECTIONS = ["K21EA", "K21EB", "K21EC", "K21ED", "K22EA", "K22EB", "K22EC", "K22ED"];
export const MOCK_STUDENTS: { id: string; name: string; regNo: string; section: string; dept: string }[] = [];

interface NotificationContextType {
  notifications: Notification[];
  sentNotifications: SentNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  sendNotification: (data: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    target: TargetAudience;
    targetDetails: string;
    recipientCount: number;
    link?: string;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications from DB
  const { data: dbNotifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30s
  });

  const notifications: Notification[] = useMemo(() => {
    return (dbNotifications || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as NotificationType,
      time: new Date(n.created_at),
      read: n.read,
      link: n.link,
      target: n.target_audience as TargetAudience,
      priority: n.priority as NotificationPriority,
    }));
  }, [dbNotifications]);

  // Sent notifications (for admin/HOD view)
  const { data: dbSent } = useQuery({
    queryKey: ["sent-notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("sender_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id && ["concern-hod", "school-hod", "daa", "admin"].includes(user?.role || ""),
  });

  const sentNotifications: SentNotification[] = useMemo(() => {
    return (dbSent || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as NotificationType,
      priority: n.priority as NotificationPriority,
      target: (n.target_audience || "all") as TargetAudience,
      targetDetails: n.target_details || "All",
      sentAt: new Date(n.created_at),
      sentBy: user?.name || "You",
      sentByRole: user?.role || "admin",
      recipientCount: 0,
      readCount: 0,
    }));
  }, [dbSent, user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    // Mark all where recipient_id = user.id or broadcast
    const ids = notifications.filter(n => !n.read).map(n => n.id);
    if (ids.length > 0) {
      await supabase.from("notifications").update({ read: true }).in("id", ids);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }, [notifications, user, queryClient]);

  const clearAll = useCallback(() => {
    // Just mark all as read for now (don't delete from DB)
    markAllAsRead();
  }, [markAllAsRead]);

  const sendNotification = useCallback(async (data: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    target: TargetAudience;
    targetDetails: string;
    recipientCount: number;
    link?: string;
  }) => {
    if (!user?.id) return;

    await supabase.from("notifications").insert({
      sender_id: user.id,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority,
      target_audience: data.target,
      target_details: data.targetDetails,
      link: data.link || null,
      // For broadcast, recipient_id is null
      recipient_id: null,
    });

    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["sent-notifications"] });
  }, [user, queryClient]);

  return (
    <NotificationContext.Provider value={{ notifications, sentNotifications, unreadCount, markAsRead, markAllAsRead, clearAll, sendNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
