import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrendData, getCheckIns } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Button, Badge } from '../components/ui/components';
import { getRiskColor, getRiskBgColor } from '../utils/riskColors';
import { formatRelativeTime } from '../utils/dateUtils';
import { Phone, ArrowRight, HeartPulse, Calendar, Activity } from 'lucide-react';

const VictimDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trendData, setTrendData] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  
  useEffect(() => {
    getTrendData().then(res => setTrendData(res.data));
    getCheckIns().then(res => setCheckIns(res.data));
  }, []);

  const totalCheckIns = checkIns.length;
  const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;
  const daysSince = latestCheckIn ? Math.max(0, Math.floor((new Date() - new Date(latestCheckIn.date)) / (1000 * 60 * 60 * 24))) : 0;
  const latestScore = latestCheckIn ? latestCheckIn.aiAnalysis.riskScore : (trendData.length > 0 ? trendData[trendData.length - 1].score : 35);
  const [historyFilter, setHistoryFilter] = useState('all'); // all, entries

  const displayedCheckIns = historyFilter === 'all' ? checkIns : checkIns.filter(c => c.text && c.text.length > 0);
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name ? user.name.split(' ')[0] : 'Elena'}</h1>
          <p className="text-indigo-100 text-lg">Your wellbeing matters to us. Track your personal history and progress.</p>
        </div>
        <HeartPulse className="absolute -right-8 -bottom-8 w-48 h-48 text-indigo-500 opacity-30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center text-center p-8">
          <p className="text-slate-500 font-medium mb-4">Current Distress Score</p>
          <div className={`text-5xl font-bold ${getRiskColor(latestScore)}`}>
            {latestScore}
          </div>
          <p className="text-xs text-slate-400 mt-2">Scale: 0-100 (Lower is calmer)</p>
        </Card>
        
        <Card className="flex flex-col items-center justify-center text-center p-8">
          <Calendar className="w-10 h-10 text-indigo-500 mb-4" />
          <p className="text-slate-500 font-medium">Days Since Last Check-in</p>
          <div className="text-4xl font-bold text-slate-800 mt-2">{daysSince}</div>
        </Card>
        
        <Card className="flex flex-col items-center justify-center text-center p-8">
          <Activity className="w-10 h-10 text-emerald-500 mb-4" />
          <p className="text-slate-500 font-medium">Total Check-ins Logged</p>
          <div className="text-4xl font-bold text-slate-800 mt-2">{totalCheckIns}</div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Your Longitudinal Wellness Trend</h2>
            <p className="text-xs text-slate-400">Continuous risk trajectory generated from your check-in history</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-800">My Historical Check-ins ({displayedCheckIns.length})</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setHistoryFilter('all')} 
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${historyFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Entries
              </button>
              <button 
                onClick={() => setHistoryFilter('entries')} 
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${historyFilter === 'entries' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Journal Notes Only
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {displayedCheckIns.length === 0 ? (
              <Card className="p-8 text-center text-slate-500">
                No check-in history found. Click "Check In Now" to log your first reflection!
              </Card>
            ) : (
              displayedCheckIns.map(checkIn => (
                <Card key={checkIn.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{checkIn.mood <= 2 ? '😢' : checkIn.mood <= 4 ? '😐' : '😊'}</span>
                        <div>
                          <span className="font-semibold text-slate-800 text-sm">{formatRelativeTime(checkIn.date)}</span>
                          <span className="text-xs text-slate-400 ml-2">({new Date(checkIn.date).toLocaleDateString()})</span>
                        </div>
                        {checkIn.sleep && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                            🌙 {checkIn.sleep}h sleep
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                        "{checkIn.text || 'No written reflection provided.'}"
                      </p>
                      {checkIn.aiAnalysis?.xaiRationale && (
                        <p className="text-xs text-slate-500 italic mt-2 border-l-2 border-indigo-400 pl-2">
                          AI Insight: {checkIn.aiAnalysis.xaiRationale}
                        </p>
                      )}
                    </div>
                    <Badge variant={checkIn.aiAnalysis?.riskScore >= 80 ? 'red' : checkIn.aiAnalysis?.riskScore >= 60 ? 'orange' : checkIn.aiAnalysis?.riskScore >= 40 ? 'amber' : 'emerald'}>
                      Distress: {checkIn.aiAnalysis?.riskScore || 20}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-rose-50 border-rose-100">
            <div className="flex items-start space-x-4">
              <div className="bg-rose-100 p-3 rounded-full text-rose-600">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-rose-800">Crisis Support</h3>
                <p className="text-sm text-rose-700 mt-1 mb-3">If you're in crisis, call or text 988 Suicide & Crisis Lifeline immediately. Available 24/7 free and confidential.</p>
                <a href="tel:988" className="inline-block w-full text-center bg-rose-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-rose-700 text-sm">
                  Call 988 Now
                </a>
              </div>
            </div>
          </Card>

          <Card className="bg-indigo-50 border-indigo-100">
            <h3 className="font-bold text-indigo-800 mb-2">Ready to check in?</h3>
            <p className="text-sm text-indigo-700 mb-4">Taking a moment to reflect helps our care team support your journey.</p>
            <Button className="w-full flex items-center justify-center py-2.5" onClick={() => navigate('/check-in')}>
              Check In Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VictimDashboard;
