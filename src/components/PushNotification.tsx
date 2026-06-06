import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface PushNotificationProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const PushNotification: React.FC<PushNotificationProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        // Autoclose effect
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl bg-black text-white transform transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'border-red-600/50'
                : toast.type === 'alert'
                ? 'border-yellow-500/50'
                : 'border-white/10'
            }`}
          >
            <div className="mt-0.5">
              <Bell className={`w-5 h-5 ${toast.type === 'success' ? 'text-red-500' : 'text-white'}`} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold tracking-wide font-sans">{toast.title}</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed font-mono">{toast.body}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
