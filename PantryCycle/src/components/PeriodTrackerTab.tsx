import { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import { UserProfile } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PeriodTrackerTabProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const COLORS = {
  sage: '#8a9a84',
  sageDark: '#5a6b54',
  sageLight: '#a8b5a0',
  sageBg: '#f0f2ef',
  sageBgLight: '#e1e5de',
};

export function PeriodTrackerTab({ userProfile, onUpdateProfile }: PeriodTrackerTabProps) {
  const [showAddDatesModal, setShowAddDatesModal] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const calculateAverageCycleLength = (): number => {
    if (!userProfile.periodHistory || userProfile.periodHistory.length < 2) return 28;
    
    const cycles: number[] = [];
    for (let i = 0; i < userProfile.periodHistory.length - 1; i++) {
      const days = Math.ceil(
        (userProfile.periodHistory[i].startDate.getTime() - userProfile.periodHistory[i + 1].startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      cycles.push(days);
    }
    
    return Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
  };

  const predictNextPeriod = (): { startDate: Date; endDate: Date } | null => {
    if (!userProfile.periodHistory || userProfile.periodHistory.length === 0) return null;

    const avgCycleLength = calculateAverageCycleLength();
    const lastPeriod = userProfile.periodHistory[0];
    const avgDuration = userProfile.periodHistory.reduce((sum, p) => sum + p.duration, 0) / userProfile.periodHistory.length;

    const nextStart = new Date(lastPeriod.startDate);
    nextStart.setDate(nextStart.getDate() + avgCycleLength);

    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + Math.round(avgDuration));

    return { startDate: nextStart, endDate: nextEnd };
  };

  const getCurrentCyclePhase = (): { phase: string; description: string; dayInCycle: number } => {
    if (!userProfile.periodHistory || userProfile.periodHistory.length === 0) {
      return { 
        phase: 'No Data', 
        description: 'Add your period dates to get started', 
        dayInCycle: 0 
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastPeriod = userProfile.periodHistory[0];
    const daysSinceLastPeriod = Math.ceil(
      (today.getTime() - lastPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgCycleLength = calculateAverageCycleLength();

    if (daysSinceLastPeriod >= 0 && daysSinceLastPeriod <= lastPeriod.duration) {
      return {
        phase: 'Menstrual',
        description: 'Focus on iron-rich foods and stay hydrated.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else if (daysSinceLastPeriod > lastPeriod.duration && daysSinceLastPeriod <= 13) {
      return {
        phase: 'Follicular',
        description: 'Great time for high-energy activities and trying new foods.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else if (daysSinceLastPeriod > 13 && daysSinceLastPeriod <= 16) {
      return {
        phase: 'Ovulation',
        description: 'Enjoy complex carbs and protein-rich meals.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else if (daysSinceLastPeriod > 16 && daysSinceLastPeriod < avgCycleLength) {
      return {
        phase: 'Luteal',
        description: 'Focus on magnesium and B-vitamin rich foods.',
        dayInCycle: daysSinceLastPeriod,
      };
    } else {
      return {
        phase: 'Pre-Menstrual',
        description: 'Your next period is approaching soon.',
        dayInCycle: daysSinceLastPeriod,
      };
    }
  };

  const handleOpenAddDatesModal = () => {
    setNewStartDate('');
    setNewEndDate('');
    setShowAddDatesModal(true);
  };

  const handleSaveNewDates = () => {
    if (!newStartDate || !newEndDate) return;

    // Parse dates in local timezone at noon
    const parseLocalDate = (dateString: string): Date => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    };

    const startDate = parseLocalDate(newStartDate);
    const endDate = parseLocalDate(newEndDate);

    // Update profile with new period dates
    onUpdateProfile({
      lastPeriodStart: startDate,
      lastPeriodEnd: endDate,
    });

    // Close modal
    setShowAddDatesModal(false);
    setNewStartDate('');
    setNewEndDate('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentPhase = getCurrentCyclePhase();
  const nextPeriod = predictNextPeriod();
  const avgCycleLength = calculateAverageCycleLength();
  const avgPeriodLength = userProfile.periodHistory && userProfile.periodHistory.length > 0
    ? Math.round(userProfile.periodHistory.reduce((sum, p) => sum + p.duration, 0) / userProfile.periodHistory.length)
    : 5;

  return (
    <div className="space-y-4 pb-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg" style={{ color: COLORS.sageDark }}>Period Tracking</h2>
        <Button
          onClick={handleOpenAddDatesModal}
          className="h-9 text-white"
          style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Dates
        </Button>
      </div>

      {/* Current Phase */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: COLORS.sageBgLight }}
          >
            <Calendar className="w-6 h-6" style={{ color: COLORS.sage }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-slate-500 mb-1">{currentPhase.phase} Phase</h3>
            <p className="text-sm text-slate-600">{currentPhase.description}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Next Period */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-2">Next Period</p>
          {nextPeriod ? (
            <>
              <p className="text-xl mb-1" style={{ color: COLORS.sageDark }}>
                {formatDate(nextPeriod.startDate).split(',')[0]}
              </p>
              <p className="text-xs text-slate-500">
                in {Math.ceil((nextPeriod.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </>
          ) : (
            <p className="text-xl" style={{ color: COLORS.sageDark }}>N/A</p>
          )}
        </div>

        {/* Avg Cycle */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-2">Avg Cycle</p>
          <p className="text-xl mb-1" style={{ color: COLORS.sageDark }}>{avgCycleLength} days</p>
          <p className="text-xs text-slate-500">
            Based on {userProfile.periodHistory?.length || 0} cycles
          </p>
        </div>

        {/* Current Day */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-2">Current Day</p>
          <p className="text-xl" style={{ color: COLORS.sageDark }}>
            {currentPhase.dayInCycle > 0 ? `Day ${currentPhase.dayInCycle}` : 'N/A'}
          </p>
          <p className="text-xs text-slate-500">of your cycle</p>
        </div>

        {/* Avg Period */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-2">Avg Period</p>
          <p className="text-xl mb-1" style={{ color: COLORS.sageDark }}>{avgPeriodLength} days</p>
          <p className="text-xs text-slate-500">typical length</p>
        </div>
      </div>

      {/* Last Period */}
      {userProfile.lastPeriodStart && userProfile.lastPeriodEnd && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-sm mb-4 flex items-center gap-2" style={{ color: COLORS.sageDark }}>
            <Calendar className="w-4 h-4" />
            Last Period
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">Started</p>
              <p className="text-sm" style={{ color: COLORS.sageDark }}>
                {formatDate(userProfile.lastPeriodStart).split(',')[0]}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Ended</p>
              <p className="text-sm" style={{ color: COLORS.sageDark }}>
                {formatDate(userProfile.lastPeriodEnd).split(',')[0]}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Duration</p>
              <p className="text-sm" style={{ color: COLORS.sageDark }}>
                {Math.ceil((userProfile.lastPeriodEnd.getTime() - userProfile.lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Dates Modal */}
      {showAddDatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl" style={{ color: COLORS.sageDark }}>Add Period Dates</h2>
                <button
                  onClick={() => setShowAddDatesModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                Enter the start and end dates of your most recent period.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="new-start-date" className="text-sm mb-2 block">Period Start Date</Label>
                  <Input
                    id="new-start-date"
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="new-end-date" className="text-sm mb-2 block">Period End Date</Label>
                  <Input
                    id="new-end-date"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full h-11"
                    min={newStartDate}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAddDatesModal(false)}
                  variant="outline"
                  className="flex-1 h-11"
                  style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNewDates}
                  disabled={!newStartDate || !newEndDate}
                  className="flex-1 h-11 text-white"
                  style={{ 
                    background: newStartDate && newEndDate
                      ? `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)`
                      : '#d1d5db'
                  }}
                >
                  Save Dates
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
