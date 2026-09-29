import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-500',
    outline: 'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-slate-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
    {children}
  </div>
);

export const Input = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input
      className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
      {...props}
    />
  </div>
);

export const Textarea = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <textarea
      className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
      {...props}
    />
  </div>
);

export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-slate-100 text-slate-800',
    red: 'bg-rose-100 text-rose-800',
    orange: 'bg-orange-100 text-orange-800',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    indigo: 'bg-indigo-100 text-indigo-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
