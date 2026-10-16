import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, CheckCircle, Edit2, Check, X, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserProfileMenu() {
  const { user, isAuthenticated, logout, updateDisplayName, openAuthModal, purchasedRecipeIds } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsEditingName(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleStartEdit = () => {
    setNewName(user?.name || '');
    setEditError('');
    setIsEditingName(true);
  };

  const handleSaveName = async (e) => {
    if (e) e.preventDefault();
    if (!newName.trim()) {
      setEditError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      await updateDisplayName(newName.trim());
      setIsEditingName(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => openAuthModal()}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/10 hover:bg-emerald-800/20 text-emerald-900 font-semibold text-sm transition-all border border-emerald-800/20"
        aria-label="Sign in"
      >
        <User size={16} className="text-emerald-800" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 py-1 px-2.5 rounded-full hover:bg-emerald-50 transition-all border border-emerald-100"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
        </div>
        <div className="hidden sm:block text-left pr-1">
          <p className="text-xs text-slate-500 font-medium leading-none">Welcome back</p>
          <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[120px]">
            {user?.name || 'Chef'}
          </p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in">
          {/* Header & Verification */}
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Shield size={13} className="text-emerald-700" /> Verified Account
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle size={12} /> Active
              </span>
            </div>

            {/* Display Name Edit / View */}
            <div className="mt-2.5">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="space-y-2">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-sm rounded-lg border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-900"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="p-1.5 rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {editError && <p className="text-[11px] text-red-600">{editError}</p>}
                </form>
              ) : (
                <div className="flex items-center justify-between group">
                  <h4 className="font-bold text-slate-900 text-base font-serif">{user?.name}</h4>
                  <button
                    onClick={handleStartEdit}
                    className="p-1 rounded text-slate-400 hover:text-emerald-800 transition-colors"
                    title="Change display name"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Email / Phone info */}
            <p className="text-xs text-slate-500 mt-1 truncate">
              {user?.email || user?.phone || 'Verified Member'}
            </p>
          </div>

          {/* Premium Purchases Section */}
          <div className="py-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Sparkles size={14} className="text-amber-500" />
                Unlocked Premium Recipes:
              </span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                {purchasedRecipeIds.size}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
