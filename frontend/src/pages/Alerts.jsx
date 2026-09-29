import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../services/api';
import { Card, Button } from '../components/ui/components';
import { formatRelativeTime } from '../utils/dateUtils';
import { AlertTriangle, AlertCircle, Info, CheckCircle, ArrowRight } from 'lucide-react';

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    getAlerts().then(res => setAlerts(res.data));
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Resolved') return !alert.unread;
    return alert.type === activeTab.toLowerCase();
  });

  const getAlertIcon = (type) => {
    switch(type) {
      case 'critical': return <AlertTriangle className="w-6 h-6 text-rose-500" />;
      case 'high': return <AlertCircle className="w-6 h-6 text-orange-500" />;
      default: return <Info className="w-6 h-6 text-amber-500" />;
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'critical': return 'border-l-rose-500';
      case 'high': return 'border-l-orange-500';
      default: return 'border-l-amber-500';
    }
  };

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, unread: false } : a));
  };

  const handleResolveAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, unread: false })));
  };

  const tabs = ['All', 'Critical', 'High', 'Moderate', 'Resolved'];

  const unreadCount = alerts.filter(a => a.unread).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          Clinical Alerts & Triage Center
          {unreadCount > 0 && (
            <span className="ml-3 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold border border-rose-200">
              {unreadCount} Unresolved
            </span>
          )}
        </h1>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleResolveAll}
            className="text-xs py-1.5 px-3 border-slate-300 hover:bg-slate-50 flex items-center text-slate-700"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Mark All as Resolved
          </Button>
        )}
      </div>

      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <Card key={alert.id} className={`p-0 overflow-hidden border-l-4 ${getAlertColor(alert.type)} ${alert.unread ? 'bg-white' : 'bg-slate-50'}`}>
              <div className="p-5 flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base font-semibold truncate ${alert.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                      {alert.title}
                    </h3>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                  
                  <div className="mt-4 flex items-center space-x-3">
                    <Button 
                      variant="primary" 
                      className="text-xs py-1.5 px-3 flex items-center"
                      onClick={() => navigate(`/cases/${alert.caseId}`)}
                    >
                      View Case <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    {alert.unread && (
                      <Button 
                        variant="outline" 
                        className="text-xs py-1.5 px-3 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                        Acknowledge & Resolve
                      </Button>
                    )}
                  </div>
                </div>
                {alert.unread && (
                  <div className="flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No alerts at this time</h3>
            <p className="text-slate-500">All cases are being monitored. You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
