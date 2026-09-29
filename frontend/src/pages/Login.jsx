import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Heart, UserPlus, LogIn, Sparkles, Shield, User, Phone, AlertCircle, HeartHandshake } from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [role, setRole] = useState('counsellor');
  const [email, setEmail] = useState('counsellor@demo.com');
  const [password, setPassword] = useState('demo1234');
  
  // Registration Profile Fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('+1 (555) 234-8901');
  const [emergencyContact, setEmergencyContact] = useState('Marcus Vance (Brother) - +1 (555) 782-9900');
  const [bio, setBio] = useState('Patient seeking longitudinal trauma monitoring and AI grounding support.');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password, role);
      setLoading(false);
      if (loggedUser?.role === 'counsellor' || role === 'counsellor') {
        navigate('/cases');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      setError('Login failed. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !age || !gender || !emergencyContact) {
      setError('Please complete all demographic and profile fields.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        full_name: fullName,
        email,
        password,
        role,
        age: parseInt(age),
        gender,
        phone,
        emergency_contact: emergencyContact,
        bio
      });
      setLoading(false);
      if (newUser?.role === 'counsellor' || role === 'counsellor') {
        navigate('/cases');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Registration failed. Please check your details.');
    }
  };

  const quickLoginAs = async (targetRole) => {
    setRole(targetRole);
    const targetEmail = targetRole === 'counsellor' ? 'counsellor@demo.com' : 'victim@demo.com';
    setEmail(targetEmail);
    setPassword('demo1234');
    setLoading(true);
    try {
      const loggedUser = await login(targetEmail, 'demo1234', targetRole);
      setLoading(false);
      if (targetRole === 'counsellor') {
        navigate('/cases');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className={`w-full transition-all duration-300 ${mode === 'register' ? 'max-w-xl' : 'max-w-md'}`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 text-white mb-3 shadow-lg shadow-emerald-500/20">
          <HeartHandshake className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>Sanjeevani</span>
          <span className="text-emerald-600 text-2xl font-bold">(संजीवनी)</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">National AI Mental Health EHR & Decision Support</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Mode Toggle: Sign In vs Create Profile */}
        <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 p-1.5 gap-1.5">
          <button
            type="button"
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          
          <button
            type="button"
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => {
              setMode('register');
              setError('');
              setEmail('');
              setPassword('');
              setFullName(role === 'victim' ? 'New Patient' : 'Dr. Practitioner');
            }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Profile & Register</span>
          </button>
        </div>

        {/* Role Selector */}
        <div className="flex border-b border-slate-100">
          <button
            type="button"
            className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer ${
              role === 'counsellor' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => { 
              setRole('counsellor'); 
              if (mode === 'login') {
                setEmail('counsellor@demo.com'); 
                setPassword('demo1234');
              } else {
                setFullName('Dr. Emily Vance');
                setBio('Clinical Psychologist specializing in trauma, EMDR, and acute psychiatric triage.');
              }
            }}
          >
            Counsellor / Clinician
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer ${
              role === 'victim' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
            onClick={() => { 
              setRole('victim'); 
              if (mode === 'login') {
                setEmail('victim@demo.com'); 
                setPassword('demo1234');
              } else {
                setFullName('Elena Vance');
                setBio('Patient undergoing active trauma monitoring and psychological check-in surveillance.');
              }
            }}
          >
            Patient / Victim
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          /* Sign In Form */
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" 
                placeholder="demo@example.com" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-2 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing in...' : `Sign In as ${role === 'counsellor' ? 'Counsellor' : 'Patient'}`}
            </button>

            {/* Quick Demo Access Buttons */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block text-center mb-2 uppercase tracking-wider">
                Instant Quick-Start Demo Logins
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => quickLoginAs('counsellor')}
                  className="flex-1 text-xs py-2 px-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-semibold transition-colors border border-indigo-200 cursor-pointer"
                >
                  🚀 Dr. Sarah Jenkins (Counsellor)
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('victim')}
                  className="flex-1 text-xs py-2 px-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors border border-slate-200 cursor-pointer"
                >
                  👤 Elena Vance (Patient)
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Profile Creation & Demographics Registration Form */
          <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-4">
            
            <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl mb-3 flex items-start space-x-2.5">
              <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-900 leading-relaxed">
                <strong>New Clinical Profile Setup:</strong> Please provide your legal demographics (Name, Age, Gender, Emergency Contact) to initialize your HIPAA-compliant care profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Legal Name *
                </label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  required
                  placeholder="e.g. Dr. Maya Lin or Elena Vance"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  placeholder="name@novaflow.health"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Age *
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="120"
                  value={age} 
                  onChange={e => setAge(e.target.value)} 
                  required
                  placeholder="e.g. 29"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gender *
                </label>
                <select 
                  value={gender} 
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Emergency Contact *
                </label>
                <input 
                  type="text" 
                  value={emergencyContact} 
                  onChange={e => setEmergencyContact(e.target.value)} 
                  required
                  placeholder="Name (Relation) - Phone"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {role === 'victim' ? 'Clinical Profile & Trauma History' : 'Clinical Specialization & Bio'}
              </label>
              <textarea 
                rows={2}
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                placeholder="Details for clinical triage and ambient intelligence monitoring..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-3 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Care Profile...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Profile & Launch Sanjeevani (संजीवनी)</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Already have an account? Sign In &rarr;
              </button>
            </div>
          </form>
        )}
      </div>
      
      <p className="text-center text-xs text-slate-500 mt-6 max-w-sm mx-auto flex items-center justify-center">
        <Heart className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
        Protected by 256-bit encryption & AI Clinical Safety Guardrails.
      </p>
    </div>
  );
};

export default Login;
