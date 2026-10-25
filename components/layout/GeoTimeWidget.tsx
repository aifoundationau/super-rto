'use client';

import React, { useState, useEffect } from 'react';
import { CloudSun, MapPin, Clock, Settings, X, Check } from 'lucide-react';

interface GeoTimeSettings {
  suburb: string;
  state: string;
  country: string;
  is24Hour: boolean;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

export const GeoTimeWidget: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [settings, setSettings] = useState<GeoTimeSettings>({
    suburb: 'Sydney CBD',
    state: 'NSW',
    country: 'Australia',
    is24Hour: false,
    dateFormat: 'DD/MM/YYYY'
  });

  const [tempSettings, setTempSettings] = useState<GeoTimeSettings>(settings);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-AU', {
        hour12: !settings.is24Hour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Australia/Sydney'
      });
      setCurrentTime(timeStr);

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();

      if (settings.dateFormat === 'YYYY-MM-DD') {
        setCurrentDate(`${year}-${month}-${day}`);
      } else if (settings.dateFormat === 'MM/DD/YYYY') {
        setCurrentDate(`${month}/${day}/${year}`);
      } else {
        setCurrentDate(`${day}/${month}/${year}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const handleOpenModal = () => {
    setTempSettings(settings);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(tempSettings);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Thin Sticky Footer Bar - rto-ai white & slate-100 styling */}
      <div
        data-agent-id="geo-time-bar"
        data-testid="geo-time-footer-bar"
        className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200 text-[11px] text-slate-500 py-1.5 px-4 z-40 select-none shadow-xs"
      >
        <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-3">
          {/* Location & Weather */}
          <div
            onClick={handleOpenModal}
            className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors py-0.5"
            title="Click to configure local suburb, weather, and time format"
          >
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{settings.suburb}, {settings.state}</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <CloudSun className="w-3.5 h-3.5 text-amber-500" />
              <span>22°C Clear</span>
            </span>
          </div>

          {/* Time & Settings Trigger */}
          <div
            onClick={handleOpenModal}
            className="flex items-center gap-2 font-mono cursor-pointer hover:text-indigo-600 transition-colors"
          >
            <span className="hidden md:inline text-slate-400">{currentDate}</span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="flex items-center gap-1 text-slate-800 font-bold">
              <Clock className="w-3 h-3 text-indigo-600" />
              <span>{currentTime || '12:00:00 PM'} AEST</span>
            </span>
            <Settings className="w-3 h-3 text-slate-400 hover:text-indigo-600 ml-1" />
          </div>
        </div>
      </div>

      {/* Centered Modal (No Scrollbar Directive) - rto-ai crisp white card */}
      {isModalOpen && (
        <div
          data-testid="geo-time-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            data-testid="geo-time-modal-card"
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 text-slate-900 shadow-2xl overflow-hidden"
            style={{ maxHeight: '90vh', overflowY: 'hidden' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Configure Suburb & Time Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
                aria-label="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Suburb / City
                </label>
                <input
                  type="text"
                  required
                  value={tempSettings.suburb}
                  onChange={(e) => setTempSettings({ ...tempSettings, suburb: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="e.g. Sydney CBD, Melbourne, Brisbane"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State / Region
                  </label>
                  <input
                    type="text"
                    required
                    value={tempSettings.state}
                    onChange={(e) => setTempSettings({ ...tempSettings, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                    placeholder="e.g. NSW, VIC, QLD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={tempSettings.country}
                    onChange={(e) => setTempSettings({ ...tempSettings, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Time Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempSettings({ ...tempSettings, is24Hour: false })}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                      !tempSettings.is24Hour
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    12-Hour (AM/PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempSettings({ ...tempSettings, is24Hour: true })}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                      tempSettings.is24Hour
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    24-Hour (Military)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date Format
                </label>
                <select
                  value={tempSettings.dateFormat}
                  onChange={(e) => setTempSettings({ ...tempSettings, dateFormat: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Australian Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standards)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
