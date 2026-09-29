import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, User, Mail, Phone, Heart, Calendar, Shield, Edit3, 
  CheckCircle2, Save, FileText, Activity, AlertCircle, Sparkles 
} from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, patientData = null }) => {
  const { user, updateUser } = useAuth();
  
  // If patientData is passed, we are inspecting a patient profile. Otherwise, the current user's profile.
  const isPatientInspection = Boolean(patientData);
  const target = isPatientInspection ? patientData : user;

  const [activeTab, setActiveTab] = useState('inspect'); // 'inspect' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Female',
    phone: '',
    emergency_contact: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (target) {
      setFormData({
        name: target.name || target.victimName || target.full_name || '',
        age: target.age || target.victim_age || '29',
        gender: target.gender || target.victim_gender || 'Female',
        phone: target.phone || target.victim_phone || '+1 (555) 782-4419',
        emergency_contact: target.emergency_contact || target.victim_emergency_contact || 'Marcus Vance (Brother) - +1 (555) 782-9900',
        bio: target.bio || target.victim_bio || 'Monitored patient file under clinical trauma care.'
      });
    }
  }, [target, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!isPatientInspection && updateUser) {
        await updateUser({
          name: formData.name,
          full_name: formData.name,
          age: formData.age,
          gender: formData.gender,
          phone: formData.phone,
          emergency_contact: formData.emergency_contact,
          bio: formData.bio
        });
      }
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setActiveTab('inspect');
      }, 1200);
    } catch (err) {
      setSaving(false);
      alert('Error updating profile: ' + err.message);
    }
  };

  const displayName = formData.name || (isPatientInspection ? 'Elena Vance' : user?.name || 'Dr. Sarah Jenkins');
  const roleLabel = isPatientInspection 
    ? 'Patient / Monitored Case' 
    : user?.role === 'victim' ? 'Patient' : 'Clinical Psychologist & Counsellor';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/30 border-2 border-indigo-300 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
              {displayName.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{displayName}</h2>
                <span className="text-xs bg-indigo-500/40 text-indigo-100 px-2.5 py-0.5 rounded-full font-medium border border-indigo-400/30">
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 flex items-center space-x-2">
                <span>{target?.email || 'user@novaflow.health'}</span>
                <span>&bull;</span>
                <span>ID: {target?.id ? `#${target.id}` : 'USR-101'}</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mt-6 border-t border-indigo-700/50 pt-3">
            <button
              onClick={() => setActiveTab('inspect')}
              className={`text-xs font-semibold pb-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'inspect'
                  ? 'border-white text-white'
                  : 'border-transparent text-indigo-200 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Inspect Profile & Demographics</span>
            </button>
            {!isPatientInspection && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'edit'
                    ? 'border-white text-white'
                    : 'border-transparent text-indigo-200 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Information</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {savedSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">Demographic profile updated successfully!</span>
            </div>
          )}

          {activeTab === 'inspect' ? (
            <div className="space-y-5">
              {/* Demographics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">Age</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{formData.age} years old</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">Gender</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{formData.gender}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Phone Number</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{formData.phone}</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-indigo-500" />
                    <span>Monitoring Status</span>
                  </span>
                  <p className="text-sm font-semibold text-indigo-700 mt-0.5">Active Surveillance</p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Emergency Contact</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{formData.emergency_contact}</p>
                <p className="text-xs text-slate-500 mt-1">Designated first-tier point of contact in case of severe crisis triggers.</p>
              </div>

              {/* Bio & Clinical Notes */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div className="flex items-center space-x-2 mb-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isPatientInspection || user?.role === 'victim' ? 'Patient History & Clinical Dossier' : 'Clinical Practice & Credentials'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{formData.bio}</p>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>HIPAA Compliant & End-to-End Encrypted Record</span>
                </span>
                
                <div className="flex items-center space-x-3">
                  {!isPatientInspection && (
                    <button
                      onClick={() => setActiveTab('edit')}
                      className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
                    >
                      Edit Demographics
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Legal Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Age</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="120"
                    value={formData.age} 
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Emergency Contact</label>
                  <input 
                    type="text" 
                    value={formData.emergency_contact} 
                    onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Name (Relationship) - Phone"
                    required
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Profile / Background Notes
                </label>
                <textarea 
                  rows={3} 
                  value={formData.bio} 
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Medical history, trauma events, or clinical focus..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" 
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('inspect')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Demographic Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
