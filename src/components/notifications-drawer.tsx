'use client';

import React, { useEffect, useState } from 'react';
import Modal from './ui/modal';
import { Bell, AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  time: string;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.notifications) {
            setNotifications(data.notifications);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Center">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="flex items-start gap-3 bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl text-xs"
          >
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
              {getIcon(notif.type)}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">{notif.title}</h4>
                <span className="text-[10px] text-slate-500">{notif.time}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
