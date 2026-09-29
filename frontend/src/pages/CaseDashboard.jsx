import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases } from '../services/api';
import { Card, Badge, Button } from '../components/ui/components';
import { getRiskLevel, getRiskBgColor } from '../utils/riskColors';
import { formatRelativeTime } from '../utils/dateUtils';
import { 
  Search, Filter, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowRight, 
  Brain, Shield, ShieldAlert, Eye, EyeOff, Scale, Building2, Calendar, 
  PhoneCall, HeartHandshake, FileText, ChevronRight
} from 'lucide-react';

const CaseDashboard = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [isPrivacyShieldActive, setIsPrivacyShieldActive] = useState(true);

  useEffect(() => {
    getCases().then(res => {
      if (res?.data) {
        setCases(res.data);
      }
    });
  }, []);

  const filteredCases = cases.filter(c => {
    const docketStr = (c.nhaa_docket_no || '').toLowerCase();
    const nameStr = (c.victim_name || c.victimName || '').toLowerCase();
    const firStr = (c.fir_number || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = docketStr.includes(term) || nameStr.includes(term) || firStr.includes(term);
    const matchesRisk = riskFilter === 'All' || c.risk_level?.toLowerCase() === riskFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'All' || c.case_category === categoryFilter;
    const matchesStage = stageFilter === 'All' || c.legal_stage === stageFilter;

    return matchesSearch && matchesRisk && matchesCategory && matchesStage;
  }).sort((a, b) => (b.predictive_crisis_risk_7d || b.latest_risk_score || 0) - (a.predictive_crisis_risk_7d || a.latest_risk_score || 0));

  const stats = {
    total: cases.length,
    critical: cases.filter(c => c.risk_level === 'critical' || (c.predictive_crisis_risk_7d || 0) >= 80).length,
    high: cases.filter(c => c.risk_level === 'high' || ((c.predictive_crisis_risk_7d || 0) >= 60 && (c.predictive_crisis_risk_7d || 0) < 80)).length,
    witnessProtected: cases.filter(c => (c.witness_protection_status || '').includes('Armed') || c.case_category === 'witness_intimidation').length
  };

  const maskName = (name) => {
    if (!isPrivacyShieldActive || !name) return name;
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0] + '***';
    return parts[0][0] + '*** ' + parts[parts.length - 1][0] + '*** (Protected)';
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'rape_gang_rape':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-300">Rape & Gang Rape</span>;
      case 'murder_arson_grievous':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">Murder / Arson</span>;
      case 'witness_intimidation':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[10px] border border-purple-300">Witness Intimidation (Sec 15A)</span>;
      case 'caste_violence_boycott':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-bold text-[10px] border border-indigo-300">Caste Boycott</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">Atrocity Case</span>;
    }
  };

  const getStageBadge = (stg) => {
    switch (stg) {
      case 'trial':
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">Trial Deposition</span>;
      case 'investigation':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">Investigation (FIR)</span>;
      case 'rehabilitation':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">Rehabilitation</span>;
      case 'compensation':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">Compensation (DBT)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">{stg}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Official NHAA 14566 National Framework Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>National Helpline Against Atrocities (NHAA 14566)</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1.5 flex items-center space-x-2">
            <span>Atrocity Victims Dynamic Mental Health Monitoring Hub</span>
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
            Real-time multi-channel distress prediction, acoustic voice tremor analytics, and multi-tier inter-agency alerts (DM, SP & Clinical Lead) across the 4 legal lifecycle stages.
          </p>
        </div>

        {/* Action Controls: Privacy Toggle + Governance Hub Link */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsPrivacyShieldActive(!isPrivacyShieldActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
              isPrivacyShieldActive 
                ? 'bg-emerald-600/30 border-emerald-400/40 text-emerald-300 shadow-xs' 
                : 'bg-white/10 border-white/20 text-slate-300 hover:text-white'
            }`}
            title="Toggle Section 15A Witness Privacy Mode to mask victim names and PII"
          >
            {isPrivacyShieldActive ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-amber-400" />}
            <span>{isPrivacyShieldActive ? 'Sec 15A Privacy Shield: ON' : 'Privacy Shield: OFF'}</span>
          </button>

          <Button
            onClick={() => navigate('/governance')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span>Governance Command Center &rarr;</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs font-medium text-slate-500">Monitored Atrocity Cases</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">NHAA Integrated Docket Registry</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500 bg-rose-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-700 font-bold">Critical Distress Triage</p>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.critical}</p>
          <p className="text-[10px] text-rose-500 mt-0.5">Immediate SP / DM Alerts Active</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/20">
          <p className="text-xs font-medium text-amber-800 font-bold">High Pre-Crisis Vulnerability</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.high}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">7-Day Anticipatory Escalation</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-800 font-bold">Protected Witnesses</p>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.witnessProtected}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Sec 15A Armed Details Active</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-0 overflow-hidden shadow-sm">
        
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search docket #, FIR, or location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="rape_gang_rape">Rape & Gang Rape</option>
              <option value="murder_arson_grievous">Murder / Arson / Grievous</option>
              <option value="witness_intimidation">Witness Intimidation (15A)</option>
              <option value="caste_violence_boycott">Caste Boycott & Violence</option>
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Legal Stages</option>
              <option value="investigation">Investigation (FIR)</option>
              <option value="trial">Trial (Court Deposition)</option>
              <option value="rehabilitation">Rehabilitation</option>
              <option value="compensation">Compensation (DBT)</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>

          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-bold">NHAA Docket & Stage</th>
                <th className="px-4 py-3.5 font-bold">Victim / Complainant</th>
                <th className="px-4 py-3.5 font-bold">Priority Category</th>
                <th className="px-4 py-3.5 font-bold">Threat & Next Hearing</th>
                <th className="px-4 py-3.5 font-bold">Dynamic Distress & 7D Forecast</th>
                <th className="px-4 py-3.5 font-bold">Witness Protection</th>
                <th className="px-4 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => {
                const predRisk = c.predictive_crisis_risk_7d || 35;
                const isCritical = predRisk >= 80 || c.risk_level === 'critical';
                const isHigh = predRisk >= 60 && predRisk < 80;

                return (
                  <tr 
                    key={c.id} 
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                  >
                    {/* Docket & Stage */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-indigo-700 block">
                        {c.nhaa_docket_no || `NHAA-14566-2026-UP-${4800 + c.id}`}
                      </span>
                      <div className="mt-1">
                        {getStageBadge(c.legal_stage || 'trial')}
                      </div>
                    </td>

                    {/* Victim Name (Privacy Masked) */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 block text-xs">
                        {maskName(c.victim_name || c.victimName || `Complainant #${c.id}`)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {c.district || 'Varanasi'}, {c.state || 'Uttar Pradesh'} &bull; {c.fir_number || `FIR #${120 + c.id}/2026`}
                      </span>
                    </td>

                    {/* Priority Category */}
                    <td className="px-4 py-3.5">
                      {getCategoryBadge(c.case_category)}
                    </td>

                    {/* Threat & Next Hearing */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center text-[11px] font-bold ${
                        (c.threat_level || '').includes('High') ? 'text-rose-700' : 'text-amber-700'
                      }`}>
                        {(c.threat_level || '').includes('High') && <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />}
                        {c.threat_level || 'Moderate'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 flex items-center">
                        <Calendar className="w-2.5 h-2.5 mr-1 text-slate-400" />
                        {c.court_next_hearing ? c.court_next_hearing.split(' ')[0] : 'In 4 Days'}
                      </span>
                    </td>

                    {/* Dynamic Distress & 7-Day Predictive Risk */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-extrabold ${
                          isCritical ? 'text-rose-600' : (isHigh ? 'text-amber-600' : 'text-emerald-600')
                        }`}>
                          {predRisk}%
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isCritical ? 'bg-rose-100 text-rose-800' : (isHigh ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                        }`}>
                          {isCritical ? '🚨 7D Crisis Surge' : (isHigh ? '⚠️ Pre-Crisis' : 'Stable')}
                        </span>
                      </div>
                      <div className="w-28 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : (isHigh ? 'bg-amber-500' : 'bg-emerald-500')}`} 
                          style={{ width: `${predRisk}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Witness Protection Status */}
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        {c.witness_protection_status || 'Under Threat Assessment'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        PoA Sec 15A Mandate
                      </span>
                    </td>

                    {/* Action Link */}
                    <td className="px-4 py-3.5 text-right">
                      <button 
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                        title="Open Full Case Dossier"
                      >
                        <span className="text-[11px] font-bold">Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </Card>

    </div>
  );
};

export default CaseDashboard;
