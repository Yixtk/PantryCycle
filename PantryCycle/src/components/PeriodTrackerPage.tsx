import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Droplet, TrendingUp, Activity, Edit2, Check, X, Home, BookOpen, User as UserIcon, Clock, BarChart3, Plus } from 'lucide-react';
import { UserProfile } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';

const COLORS = {
  sage: '#8a9a84',
  sageLight: '#a8b5a0',
  sageDark: '#5a6b54',
  sageBg: '#f4f6f3',
  sageBgLight: '#fafbf9',
  // Phase colors
  menstrual: '#fce7f3',
  menstrualText: '#831843',
  follicular: '#f0fdf4',
  follicularText: '#14532d',
  ovulation: '#ccfbf1',
  ovulationText: '#134e4a',
  luteal: '#f3e8ff',
  lutealText: '#581c87',
  predictedPeriod: '#fef3f2',
  predictedText: '#b91c1c',
};

interface PeriodTrackerPageProps {
  userProfile: UserProfile;
  onNavigate: (page: string) => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

export function PeriodTrackerPage({ userProfile, onNavigate, onUpdateProfile }: PeriodTrackerPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loggedSymptoms, setLoggedSymptoms] = useState<{ [key: string]: any }>({});
  
  // Add Dates Modal state
  const [showAddDatesModal, setShowAddDatesModal] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const pastPeriods = userProfile.periodHistory || [];

  // Add Dates Modal handlers
  const handleOpenAddDatesModal = () => {
    setNewStartDate('');
    setNewEndDate('');
    setShowAddDatesModal(true);
  };

  const handleSaveNewDates = () => {
    if (!newStartDate || !newEndDate || !onUpdateProfile) return;

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

  // Calculate cycle phase for any date
  const getPhaseForDate = (date: Date): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'predicted' | null => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Check if it's a past period day
    for (const period of pastPeriods) {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (checkDate >= start && checkDate <= end) {
        return 'menstrual';
      }

      // Follicular phase (after period ends, ~7-10 days)
      const follicularEnd = new Date(end);
      follicularEnd.setDate(follicularEnd.getDate() + 9);
      if (checkDate > end && checkDate <= follicularEnd) {
        return 'follicular';
      }

      // Ovulation (3 days around ovulation, day 14-16)
      const ovulationStart = new Date(start);
      ovulationStart.setDate(ovulationStart.getDate() + 13);
      const ovulationEnd = new Date(start);
      ovulationEnd.setDate(ovulationEnd.getDate() + 15);
      if (checkDate >= ovulationStart && checkDate <= ovulationEnd) {
        return 'ovulation';
      }

      // Luteal phase (after ovulation until next period)
      const cycleEnd = new Date(start);
      cycleEnd.setDate(cycleEnd.getDate() + 27);
      if (checkDate > ovulationEnd && checkDate <= cycleEnd) {
        return 'luteal';
      }
    }

    // Predict next period
    if (pastPeriods.length > 0) {
      const lastPeriod = pastPeriods[pastPeriods.length - 1];
      const avgCycle = 28;
      const nextPeriodStart = new Date(lastPeriod.startDate);
      nextPeriodStart.setDate(nextPeriodStart.getDate() + avgCycle);
      const nextPeriodEnd = new Date(nextPeriodStart);
      nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 4);

      if (checkDate >= nextPeriodStart && checkDate <= nextPeriodEnd) {
        return 'predicted';
      }
    }

    return null;
  };

  const getCurrentCyclePhase = () => {
    const today = new Date();
    return getPhaseForDate(today);
  };

  const predictNextPeriod = () => {
    if (pastPeriods.length === 0) return null;
    const lastPeriod = pastPeriods[pastPeriods.length - 1];
    const avgCycle = 28;
    const nextPeriodDate = new Date(lastPeriod.startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycle);
    return nextPeriodDate;
  };

  const getDaysUntilNextPeriod = () => {
    const nextPeriod = predictNextPeriod();
    if (!nextPeriod) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextPeriod.setHours(0, 0, 0, 0);
    const diff = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getAverageCycleLength = () => {
    if (pastPeriods.length < 2) return 28;
    let totalDays = 0;
    for (let i = 1; i < pastPeriods.length; i++) {
      const prev = new Date(pastPeriods[i - 1].startDate);
      const curr = new Date(pastPeriods[i].startDate);
      const diff = Math.ceil((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += diff;
    }
    return Math.round(totalDays / (pastPeriods.length - 1));
  };

  const getAveragePeriodLength = () => {
    if (pastPeriods.length === 0) return 5;
    const totalDays = pastPeriods.reduce((sum, period) => sum + period.duration, 0);
    return Math.round(totalDays / pastPeriods.length);
  };

  const getCurrentCycleDay = () => {
    if (pastPeriods.length === 0) return null;
    const lastPeriod = pastPeriods[pastPeriods.length - 1];
    const today = new Date();
    const lastPeriodStart = new Date(lastPeriod.startDate);
    today.setHours(0, 0, 0, 0);
    lastPeriodStart.setHours(0, 0, 0, 0);
    const diff = Math.ceil((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1; // Day 1 starts on period start
  };

  const getLastPeriodInfo = () => {
    if (pastPeriods.length === 0) return null;
    const lastPeriod = pastPeriods[pastPeriods.length - 1];
    return {
      startDate: new Date(lastPeriod.startDate),
      endDate: new Date(lastPeriod.endDate),
      duration: lastPeriod.duration
    };
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const days = [];
  // Empty cells before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const checkDate = new Date(year, month, day);
    const phase = getPhaseForDate(checkDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    const isToday = checkDate.getTime() === today.getTime();
    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month;

    let bgColor = 'white';
    let textColor = '#64748b';
    let borderColor = '#e5e7eb';
    let borderWidth = '1px';
    let borderStyle = 'solid';

    // Apply phase colors
    if (phase === 'menstrual') {
      bgColor = COLORS.menstrual;
      textColor = COLORS.menstrualText;
    } else if (phase === 'follicular') {
      bgColor = COLORS.follicular;
      textColor = COLORS.follicularText;
    } else if (phase === 'ovulation') {
      bgColor = COLORS.ovulation;
      textColor = COLORS.ovulationText;
    } else if (phase === 'luteal') {
      bgColor = COLORS.luteal;
      textColor = COLORS.lutealText;
    } else if (phase === 'predicted') {
      bgColor = COLORS.predictedPeriod;
      textColor = COLORS.predictedText;
      borderStyle = 'dashed';
    }

    // Today styling
    if (isToday) {
      borderColor = COLORS.sage;
      borderWidth = '2px';
    }

    // Selected styling
    if (isSelected) {
      borderColor = COLORS.sageDark;
      borderWidth = '2px';
    }

    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className="aspect-square p-2 rounded-lg transition-all"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          borderStyle: borderStyle
        }}
      >
        <div className="text-sm text-center" style={{ color: textColor, fontWeight: isToday ? '600' : '400' }}>
          {day}
        </div>
      </button>
    );
  }

  const currentPhase = getCurrentCyclePhase();
  const nextPeriod = predictNextPeriod();
  const daysUntil = getDaysUntilNextPeriod();
  const avgCycle = getAverageCycleLength();

  const phaseInfo = {
    menstrual: {
      name: 'Menstrual Phase',
      icon: <Droplet className="h-5 w-5" />,
      color: COLORS.menstrualText,
      description: 'Focus on iron-rich foods and rest.',
    },
    follicular: {
      name: 'Follicular Phase',
      icon: <TrendingUp className="h-5 w-5" />,
      color: COLORS.follicularText,
      description: 'Energy is rising. Great time for new activities.',
    },
    ovulation: {
      name: 'Ovulation Phase',
      icon: <Activity className="h-5 w-5" />,
      color: COLORS.ovulationText,
      description: 'Peak energy. Stay hydrated and active.',
    },
    luteal: {
      name: 'Luteal Phase',
      icon: <Calendar className="h-5 w-5" />,
      color: COLORS.lutealText,
      description: 'Focus on comfort foods and self-care.',
    },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
      <div className="flex-1 p-4 pb-20 overflow-y-auto">
        {/* Header with Add Dates Button */}
        <div className="mb-6 pt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl mb-1" style={{ color: COLORS.sageDark }}>Period Tracker</h1>
            <p className="text-sm text-slate-600">Track your cycle and symptoms</p>
          </div>
          <Button
            onClick={handleOpenAddDatesModal}
            className="h-9 text-white"
            style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Dates
          </Button>
        </div>

        {/* Current Phase Card */}
        {currentPhase && currentPhase !== 'predicted' && (
          <Card className="p-4 mb-4" style={{ backgroundColor: COLORS.sageBgLight, borderColor: COLORS.sageLight }}>
            <div className="flex items-start gap-3">
              <div style={{ color: phaseInfo[currentPhase].color }}>
                {phaseInfo[currentPhase].icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm mb-1" style={{ color: COLORS.sageDark }}>
                  {phaseInfo[currentPhase].name}
                </h3>
                <p className="text-xs text-slate-600">{phaseInfo[currentPhase].description}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-4">
            <div className="text-xs text-slate-600 mb-1">Next Period</div>
            <div className="text-lg" style={{ color: COLORS.sageDark }}>
              {nextPeriod ? formatDate(nextPeriod) : 'N/A'}
            </div>
            {daysUntil !== null && (
              <div className="text-xs mt-1" style={{ color: COLORS.sage }}>
                {daysUntil === 0 ? 'Today' : `in ${daysUntil} days`}
              </div>
            )}
          </Card>
          <Card className="p-4">
            <div className="text-xs text-slate-600 mb-1">Avg Cycle</div>
            <div className="text-lg" style={{ color: COLORS.sageDark }}>
              {avgCycle} days
            </div>
            <div className="text-xs mt-1 text-slate-500">
              Based on {pastPeriods.length} cycles
            </div>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" style={{ color: COLORS.sage }} />
              <div className="text-xs text-slate-600">Current Day</div>
            </div>
            <div className="text-lg" style={{ color: COLORS.sageDark }}>
              {getCurrentCycleDay() ? `Day ${getCurrentCycleDay()}` : 'N/A'}
            </div>
            <div className="text-xs mt-1 text-slate-500">
              of your cycle
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4" style={{ color: COLORS.sage }} />
              <div className="text-xs text-slate-600">Avg Period</div>
            </div>
            <div className="text-lg" style={{ color: COLORS.sageDark }}>
              {getAveragePeriodLength()} days
            </div>
            <div className="text-xs mt-1 text-slate-500">
              typical length
            </div>
          </Card>
        </div>

        {/* Last Period Info */}
        {getLastPeriodInfo() && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="h-5 w-5" style={{ color: COLORS.sage }} />
              <h3 className="text-sm" style={{ color: COLORS.sageDark }}>Last Period</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-slate-600 mb-1">Started</div>
                <div className="text-sm" style={{ color: COLORS.sageDark }}>
                  {formatDate(getLastPeriodInfo()!.startDate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-1">Ended</div>
                <div className="text-sm" style={{ color: COLORS.sageDark }}>
                  {formatDate(getLastPeriodInfo()!.endDate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-1">Duration</div>
                <div className="text-sm" style={{ color: COLORS.sageDark }}>
                  {getLastPeriodInfo()!.duration} days
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Period History */}
        {pastPeriods.length > 1 && (
          <Card className="p-4 mb-4">
            <h3 className="text-sm mb-3" style={{ color: COLORS.sageDark }}>Recent Periods</h3>
            <div className="space-y-2">
              {pastPeriods.slice(-3).reverse().map((period, index) => {
                const start = new Date(period.startDate);
                const end = new Date(period.endDate);
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: COLORS.sageBg }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.menstrualText }} />
                      <div>
                        <div className="text-sm" style={{ color: COLORS.sageDark }}>
                          {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {period.duration} days
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      to {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Calendar */}
        <Card className="p-4 mb-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5" style={{ color: COLORS.sage }} />
            </button>
            <h2 className="text-lg" style={{ color: COLORS.sageDark }}>
              {monthNames[month]} {year}
            </h2>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5" style={{ color: COLORS.sage }} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </Card>

        {/* Phase Legend */}
        <Card className="p-4">
          <h3 className="text-sm mb-3" style={{ color: COLORS.sageDark }}>Cycle Phases</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: COLORS.menstrual }} />
              <span className="text-xs text-slate-600">Menstrual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: COLORS.follicular }} />
              <span className="text-xs text-slate-600">Follicular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: COLORS.ovulation }} />
              <span className="text-xs text-slate-600">Ovulation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: COLORS.luteal }} />
              <span className="text-xs text-slate-600">Luteal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border-2" style={{ backgroundColor: COLORS.predictedPeriod, borderStyle: 'dashed', borderColor: COLORS.predictedText }} />
              <span className="text-xs text-slate-600">Predicted</span>
            </div>
          </div>
        </Card>
      </div>

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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => onNavigate('recipes')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-xs">Recipes</span>
          </button>
          <button
            onClick={() => onNavigate('grocery')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Grocery</span>
          </button>
          <button
            onClick={() => onNavigate('period')}
            className="flex flex-col items-center gap-1"
            style={{ color: COLORS.sage }}
          >
            <Droplet className="h-6 w-6" />
            <span className="text-xs">Period</span>
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <UserIcon className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
