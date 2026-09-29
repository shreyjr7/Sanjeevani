export const getRiskColor = (score) => {
  if (score >= 80) return 'text-rose-600';
  if (score >= 60) return 'text-orange-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-emerald-500';
};

export const getRiskBgColor = (score) => {
  if (score >= 80) return 'bg-rose-100 text-rose-800';
  if (score >= 60) return 'bg-orange-100 text-orange-800';
  if (score >= 40) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
};

export const getRiskLevel = (score) => {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
};
