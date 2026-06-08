// src/components/NotificationBell.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { API_URL } from "../api";

const POLL_MS = 30000;

export default function NotificationBell() {
  const { getToken, isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/me/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.items || data || [];
      setItems(list);
      setUnread(list.filter((n) => !n.read).length);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(id);
  }, [isSignedIn]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const markAllRead = async () => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/me/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const getCode = (n) =>
    n.code ||
    n.complaintCode ||
    n.ticket ||
    n.complaintNumber ||
    n.publicToken ||
    n?.meta?.code;

  const getLink = (n) => {
    const code = getCode(n);
    return n.link || n.url || (code ? `/t/${encodeURIComponent(code)}` : null);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 rounded-full bg-slate-900 border border-slate-700 text-slate-200 hover:border-sky-500 transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto">
          <path
            d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
            fill="currentColor"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-slate-200 text-sm font-semibold">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-sky-400 hover:text-sky-300">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">No notifications yet</div>
            ) : (
              items.map((n) => {
                const code = getCode(n);
                const link = getLink(n);
                return (
                  <div
                    key={n._id || `${n.title}-${n.createdAt}-${Math.random()}`}
                    className={`px-4 py-3 text-sm border-b border-slate-800 ${
                      n.read ? "text-slate-400" : "text-slate-200 bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{n.title || "Update"}</p>
                        {n.message && <p className="text-slate-400">{n.message}</p>}
                        {code && (
                          <div className="mt-1 text-[11px] text-sky-400 font-mono">#{code}</div>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                        </p>
                      </div>

                      {link && (
                        <a
                          href={link}
                          className="shrink-0 text-xs px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-500"
                          title="Track"
                        >
                          Track
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}