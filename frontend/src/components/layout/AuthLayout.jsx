import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
