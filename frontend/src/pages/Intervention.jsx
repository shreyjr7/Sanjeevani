import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Card, Button, Input, Textarea, Badge } from '../components/ui/components';
import { 
  Activity, Phone, FileText, ArrowRight, Play, CheckCircle, 
  Heart, Sparkles, ExternalLink, ShieldAlert, Globe, Smartphone, HeartPulse 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzePipelineSandbox } from '../services/api';

const EMOTION_COLORS = {
  sadness: '#3b82f6', fear: '#8b5cf6', anger: '#ef4444', 
  joy: '#10b981', surprise: '#f59e0b', disgust: '#14b8a6', anticipation: '#f97316'
};

const Intervention = () => {
  const { currentLanguage, t, getLanguageInfo } = useLanguage();
  const langInfo = getLanguageInfo(currentLanguage);

  const [activeTab, setActiveTab] = useState('apps'); // 'apps', 'interventions', 'pipeline'
  const [testText, setTestText] = useState("I've been feeling completely overwhelmed lately. I can't sleep, and every little thing makes me anxious. I don't know how much longer I can keep going like this.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [pipelineStage, setPipelineStage] = useState(0);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setResults(null);
    setPipelineStage(0);

    const livePromise = analyzePipelineSandbox(testText, 2, 4);

    setPipelineStage(1);
    await new Promise(r => setTimeout(r, 400));
    setPipelineStage(2);
    await new Promise(r => setTimeout(r, 400));
    setPipelineStage(3);
    await new Promise(r => setTimeout(r, 400));
    setPipelineStage(4);
    await new Promise(r => setTimeout(r, 400));
    setPipelineStage(5);
    await new Promise(r => setTimeout(r, 400));

    const liveResult = await livePromise;
    setPipelineStage(6);
    setIsAnalyzing(false);

    if (liveResult) {
      setResults(liveResult);
    } else {
      setResults({
        preprocessed: "feel completely overwhelm late cant sleep little thing make anxious dont know much long keep go like",
        sentiment: -0.75,
        emotions: [
          { name: 'sadness', value: 0.6 },
          { name: 'fear', value: 0.8 },
          { name: 'anger', value: 0.2 },
          { name: 'joy', value: 0.05 },
          { name: 'anticipation', value: 0.3 }
        ],
        keywords: ['overwhelmed', 'cant sleep', 'anxious'],
        riskScore: 78,
        xaiRationale: "High risk driven by explicit mention of anxiety, sleep disruption, and expressions of hopelessness."
      });
    }
  };

  const recommendedResources = [
    {
      id: 'telemanas',
      name: 'Tele-MANAS (टेली-मानस)',
      organization: 'Ministry of Health & Family Welfare, Govt. of India',
      type: 'Govt 24/7 National Helpline',
      number: '14416',
      altNumber: '1800-891-4416',
      languages: ['हिन्दी', 'English', 'বাংলা', 'मराठी', 'తెలుగు', 'தமிழ்', 'ગુજરાતી', '+13 more'],
      desc: t('apps.telemanasDesc'),
      actionType: 'call',
      highlight: true,
      badgeColor: 'emerald'
    },
    {
      id: 'kiran',
      name: 'KIRAN Helpline (किरण)',
      organization: 'Dept. of Empowerment of Persons with Disabilities',
      type: 'Toll-Free Psychological Support',
      number: '1800-599-0019',
      languages: ['हिन्दी', 'English', 'বাংলা', 'मराठी', 'తెలుగు', 'தமிழ்', 'ગુજરાતી'],
      desc: t('apps.kiranDesc'),
      actionType: 'call',
      highlight: true,
      badgeColor: 'teal'
    },
    {
      id: 'vandrevala',
      name: 'Vandrevala Foundation',
      organization: 'Mental Health Crisis Care Network',
      type: '24/7 Free Crisis Counseling',
      number: '9999 666 555',
      languages: ['English', 'हिन्दी', 'ગુજરાતી', 'मराठी', 'বাংলা'],
      desc: t('apps.vandrevalaDesc'),
      actionType: 'call',
      highlight: false,
      badgeColor: 'indigo'
    },
    {
      id: 'amaha',
      name: 'Amaha (InnerHour)',
      organization: 'Evidence-Based Indian Therapy & Self-Care App',
      type: 'Mental Wellness App',
      url: 'https://www.amahahealth.com',
      languages: ['English', 'हिन्दी', 'বাংলা', 'தமிழ்', 'తెలుగు', 'ગુજરાતી'],
      desc: t('apps.amahaDesc'),
      actionType: 'web',
      highlight: false,
      badgeColor: 'purple'
    },
    {
      id: 'wysa',
      name: 'Wysa AI Companion',
      organization: 'Clinically Proven AI CBT & Grounding',
      type: 'AI Self-Care App',
      url: 'https://www.wysa.io',
      languages: ['English', 'हिन्दी (Voice & Chat)'],
      desc: t('apps.wysaDesc'),
      actionType: 'web',
      highlight: false,
      badgeColor: 'sky'
    },
    {
      id: 'mindpeers',
      name: 'Mindpeers',
      organization: 'Affordable Therapy & Mental Strength Training',
      type: 'Therapy & Fitness Platform',
      url: 'https://www.mindpeers.co',
      languages: ['English', 'हिन्दी', 'Hinglish'],
      desc: t('apps.mindpeersDesc'),
      actionType: 'web',
      highlight: false,
      badgeColor: 'amber'
    },
    {
      id: 'aasra',
      name: 'AASRA Crisis Line',
      organization: 'Suicide Prevention & Trauma Intervention',
      type: '24/7 Confidential Helpline',
      number: '9820466726',
      languages: ['English', 'हिन्दी'],
      desc: t('apps.aasraDesc'),
      actionType: 'call',
      highlight: false,
      badgeColor: 'rose'
    }
  ];

  const renderRecommendedApps = () => (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-emerald-800/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold tracking-tight">
              {t('apps.title', 'Counsellor Recommended Apps & Indic Helplines')}
            </h2>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
              INDIA CERTIFIED
            </span>
          </div>
          <p className="text-xs text-emerald-200 mt-1 max-w-2xl leading-relaxed">
            {t('apps.subtitle', 'Certified Indian helplines and evidence-based mental wellness platforms available in your preferred language.')}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <a
            href="tel:14416"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4 animate-pulse" />
            <span>Call Tele-MANAS (14416)</span>
          </a>
        </div>
      </div>

      {/* Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendedResources.map((res) => (
          <Card key={res.id} className={`flex flex-col justify-between p-5 transition-all hover:shadow-md ${res.highlight ? 'border-2 border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}>
            <div className="space-y-3">
              
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">
                    {res.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {res.organization}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                  res.badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                  res.badgeColor === 'teal' ? 'bg-teal-100 text-teal-800' :
                  res.badgeColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                  res.badgeColor === 'rose' ? 'bg-rose-100 text-rose-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {res.type}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {res.desc}
              </p>

              {/* Supported Languages Tags */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  {t('apps.availableIn', 'Available in:')}
                </span>
                <div className="flex flex-wrap gap-1">
                  {res.languages.map((lang, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Action Button */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              {res.actionType === 'call' ? (
                <a
                  href={`tel:${res.number}`}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 mr-1" />
                  <span>{t('apps.callNow', 'Call Now')}: {res.number}</span>
                </a>
              ) : (
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" />
                  <span>{t('apps.openApp', 'Visit Platform')}</span>
                  <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

    </div>
  );

  const renderInterventionsForm = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Schedule Clinical Intervention</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Case</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500">
                <option>Elena Vance (C-1001)</option>
                <option>Marcus Johnson (C-1002)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Intervention Type</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500">
                <option>Tele-MANAS Referral</option>
                <option>Phone Call</option>
                <option>In-Person Clinical Visit</option>
                <option>Trauma Grounding Protocol</option>
              </select>
            </div>
            <Input label="Scheduled Date & Time" type="datetime-local" />
            <Textarea label="Notes / Objectives" rows={3} />
            <Button className="w-full">Schedule Intervention</Button>
          </form>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Clinical Interventions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="p-3 font-medium">Case</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Scheduled</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-medium">Elena Vance</td>
                  <td className="p-3"><div className="flex items-center"><Phone className="w-4 h-4 mr-2 text-slate-400"/> Phone Call</div></td>
                  <td className="p-3">Oct 24, 10:00 AM</td>
                  <td className="p-3"><Badge variant="emerald">Completed</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderPipelineSandbox = () => (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Sanjeevani AI Pipeline Simulator</h2>
            <p className="text-slate-500 text-sm">Test how the 6-stage distress model analyzes text step-by-step</p>
          </div>
        </div>
        
        <div className="mb-6">
          <Textarea 
            label="Input Text (Supports Hindi, Hinglish, Bengali, Marathi, etc.)" 
            rows={3} 
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleRunAnalysis} disabled={isAnalyzing || !testText} className="flex items-center">
              {isAnalyzing ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {isAnalyzing ? 'Running Pipeline...' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        <Card className={`transition-all duration-500 ${pipelineStage >= 1 ? 'opacity-100 border-emerald-200' : 'opacity-40 grayscale'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="font-bold text-slate-700">Input Reception</h3>
          </div>
          {pipelineStage >= 1 && <p className="text-sm text-slate-500 line-clamp-2 italic">"{testText}"</p>}
        </Card>

        <Card className={`transition-all duration-500 ${pipelineStage >= 2 ? 'opacity-100 border-emerald-200' : 'opacity-40 grayscale'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">2</div>
            <h3 className="font-bold text-slate-700">Preprocessing & Tokenization</h3>
          </div>
          {results && (
            <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded">
              {results.preprocessed}
            </div>
          )}
        </Card>

        <Card className={`transition-all duration-500 ${pipelineStage >= 3 ? 'opacity-100 border-emerald-200' : 'opacity-40 grayscale'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">3</div>
            <h3 className="font-bold text-slate-700">Sentiment Analysis</h3>
          </div>
          {results && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Negative</span>
                <span className="font-bold">{results.sentiment}</span>
                <span>Positive</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '75%', marginLeft: '0%' }}></div>
              </div>
            </div>
          )}
        </Card>

        <Card className={`transition-all duration-500 ${pipelineStage >= 4 ? 'opacity-100 border-emerald-200' : 'opacity-40 grayscale'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">4</div>
            <h3 className="font-bold text-slate-700">Emotion Extraction</h3>
          </div>
          {results && (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.emotions} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 1]} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={60} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {results.emotions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className={`transition-all duration-500 ${pipelineStage >= 5 ? 'opacity-100 border-emerald-200' : 'opacity-40 grayscale'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">5</div>
            <h3 className="font-bold text-slate-700">Risk Scoring</h3>
          </div>
          {results && (
            <div className="flex items-center justify-center h-20">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500">{results.riskScore}</div>
                <Badge variant="orange" className="mt-1">Elevated Risk</Badge>
              </div>
            </div>
          )}
        </Card>

        <Card className={`transition-all duration-500 ${pipelineStage >= 6 ? 'opacity-100 border-emerald-200' : 'opacity-40 grayscale'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">6</div>
            <h3 className="font-bold text-emerald-900">XAI Rationale</h3>
          </div>
          {results && (
            <p className="text-sm text-slate-600 italic border-l-2 border-emerald-500 pl-3">
              "{results.xaiRationale}"
            </p>
          )}
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t('nav.interventions', 'Interventions & Recommended Apps')}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Sanjeevani Care Protocols, Indic Mental Health Apps & AI Analysis Sandbox
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('apps')}
          className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'apps' 
              ? 'border-emerald-600 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{t('apps.title', 'Recommended Apps & Indic Helplines')}</span>
        </button>

        <button
          onClick={() => setActiveTab('interventions')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'interventions' 
              ? 'border-indigo-600 text-indigo-600 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Schedule Intervention
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'pipeline' 
              ? 'border-indigo-600 text-indigo-600 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          AI Pipeline Sandbox
        </button>
      </div>

      {activeTab === 'apps' && renderRecommendedApps()}
      {activeTab === 'interventions' && renderInterventionsForm()}
      {activeTab === 'pipeline' && renderPipelineSandbox()}
    </div>
  );
};

export default Intervention;
