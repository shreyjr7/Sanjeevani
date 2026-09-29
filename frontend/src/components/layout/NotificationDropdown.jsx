import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../../services/api';
import { Bell, AlertTriangle, CheckCircle2, ChevronRight, Clock, ShieldAlert, Sparkles } from 'lucide-react';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(3);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAlerts().then(res => {
      if (res?.data && res.data.length > 0) {
        setAlerts(res.data.slice(0, 5));
        setUnreadCount(res.data.filter(a => a.unread).length || 3);
      }
    });

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
  };

  const handleAlertClick = (alert) => {
    setIsOpen(false);
    navigate('/alerts');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Interactive Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        title="Clinical Alerts & Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Clinical Alerts</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-bold border border-rose-400/30">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-indigo-300 hover:text-white transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Alert Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                No active alerts right now. Patient vitals stable.
              </div>
            ) : (
              alerts.map((alert) => {
                const isCritical = alert.type === 'critical';
                const isHigh = alert.type === 'high';
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 ${
                      alert.unread ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-100 text-rose-600' : isHigh ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isCritical ? 'bg-rose-100 text-rose-700' : isHigh ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {alert.type || 'Alert'}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          <span>{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                        {alert.title || 'Distress Threshold Exceeded'}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {alert.description || 'Elevated biometric distress detected in recent patient assessment.'}
                      </p>
                    </div>

                    {alert.unread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => { setIsOpen(false); navigate('/alerts'); }}
              className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-1 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>Open Triage Alerts Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
