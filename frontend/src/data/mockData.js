export const mockCases = [
  {
    id: 'C-1001',
    victimName: 'Elena Vance',
    riskScore: 85,
    lastCheckIn: new Date(Date.now() - 3600000).toISOString(),
    trend: 'increasing',
    status: 'Active',
    totalCheckIns: 42,
    averageMood: 3.2,
    daysMonitored: 45
  },
  {
    id: 'C-1002',
    victimName: 'Marcus Johnson',
    riskScore: 65,
    lastCheckIn: new Date(Date.now() - 86400000).toISOString(),
    trend: 'stable',
    status: 'Active',
    totalCheckIns: 18,
    averageMood: 5.1,
    daysMonitored: 20
  },
  {
    id: 'C-1003',
    victimName: 'Sarah Smith',
    riskScore: 35,
    lastCheckIn: new Date(Date.now() - 172800000).toISOString(),
    trend: 'decreasing',
    status: 'Active',
    totalCheckIns: 90,
    averageMood: 7.4,
    daysMonitored: 100
  }
];

export const mockCheckIns = [
  {
    id: 'CHK-01',
    date: new Date(Date.now() - 3600000).toISOString(),
    mood: 2,
    text: "I couldn't sleep at all last night. Everything feels overwhelming and I don't know how to keep going like this. The anxiety is constant.",
    aiAnalysis: {
      sentiment: -0.8,
      emotions: { sadness: 0.7, fear: 0.8, anger: 0.2, joy: 0.0, surprise: 0.1, disgust: 0.2, anticipation: 0.3 },
      riskScore: 85,
      keywords: ['overwhelming', 'anxiety', 'constant'],
      xaiRationale: "High risk indicated by expressions of severe overwhelm ('couldn't sleep at all', 'everything feels overwhelming') and persistent anxiety."
    }
  },
  {
    id: 'CHK-02',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    mood: 4,
    text: "Feeling a bit better today. Managed to go for a short walk. Still tired though.",
    aiAnalysis: {
      sentiment: 0.4,
      emotions: { sadness: 0.3, fear: 0.2, anger: 0.0, joy: 0.4, surprise: 0.1, disgust: 0.0, anticipation: 0.5 },
      riskScore: 45,
      keywords: ['better', 'walk', 'tired'],
      xaiRationale: "Moderate to low risk. Positive indicators ('feeling better', 'walk') combined with lingering fatigue."
    }
  }
];

export const mockAlerts = [
  {
    id: 'ALT-1',
    type: 'critical',
    title: 'Increasing Risk Detected — Elena Vance',
    description: 'Distress score increased by 23 points over last 3 check-ins',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    caseId: 'C-1001',
    unread: true
  },
  {
    id: 'ALT-2',
    type: 'high',
    title: 'Missed Check-ins — Marcus Johnson',
    description: 'No check-ins recorded for 3 consecutive days',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    caseId: 'C-1002',
    unread: false
  }
];

export const mockInterventions = [
  {
    id: 'INV-1',
    caseId: 'C-1001',
    type: 'Phone Call',
    counsellor: 'Dr. Sarah Jenkins',
    scheduled: new Date(Date.now() - 86400000).toISOString(),
    status: 'Completed',
    outcome: 'Patient agreed to emergency appointment tomorrow.'
  }
];

export const mockTrendData = Array.from({ length: 30 }).map((_, i) => ({
  day: i + 1,
  score: Math.floor(Math.random() * 40) + 30 + (i > 20 ? 20 : 0),
  mood: Math.floor(Math.random() * 4) + 3
}));
