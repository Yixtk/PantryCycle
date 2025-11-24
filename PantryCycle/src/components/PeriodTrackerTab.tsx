import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X,
  Droplet,
  Frown,
  Meh,
  Smile,
  Zap,
  ZapOff,
  TrendingUp,
  Activity,
  BarChart3,
  Sparkles,
  Sun,
  Moon as MoonIcon,
  Heart,
  Wind,
  Thermometer
} from 'lucide-react';
import { UserProfile, PeriodRecord, DayLog } from '../types';

interface PeriodTrackerTabProps {
  userProfile: UserProfile;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

const COLORS = {
  sage: '#8a9a84',
  sageDark: '#5a6b54',
  sageLight: '#a8b5a0',
  sageBg: '#f0f2ef',
  sageBgLight: '#e1e5de',
  
  menstrual: '#f4c2c2',
  menstrualText: '#9b6b6b',
  menstrualLight: '#fce8e8',
  
  follicular: '#c8d5c0',
  follicularText: '#5a6b54',
  follicularLight: '#e8ede5',
  
  ovulation: '#b8d4d1',
  ovulationText: '#4a7370',
  ovulationLight: '#e5f1f0',
  
  luteal: '#d4c5d8',
  lutealText: '#7a6b7e',
  lutealLight: '#ede8ef',
  
  predictedPeriod: '#f8d4d4',
  predictedText: '#b89090',
};

export function PeriodTrackerTab({ userProfile, onUpdateProfile }: PeriodTrackerTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pastPeriods, setPastPeriods] = useState<PeriodRecord[]>([]);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [dayLogs, setDayLogs] = useState<{ [key: string]: Omit<DayLog, 'id' | 'userId'> }>({});
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'phases' | 'insights'>('calendar');

  // Initialize past periods from user data
  useEffect(() => {
    if (userProfile.periodHistory && userProfile.periodHistory.length > 0) {
      setPastPeriods(userProfile.periodHistory);
      console.log('✅ Period History Loaded:', userProfile.periodHistory);
      console.log('Most recent period:', {
        start: userProfile.periodHistory[0].startDate,
        end: userProfile.periodHistory[0].endDate,
        duration: userProfile.periodHistory[0].duration
      });
    } else if (userProfile.lastPeriodStart && userProfile.lastPeriodEnd) {
      const duration = Math.ceil(
        (userProfile.lastPeriodEnd.getTime() - userProfile.lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      setPastPeriods([{
        id: 'temp',
        userId: userProfile.userId,
        startDate: userProfile.lastPeriodStart,
        endDate: userProfile.lastPeriodEnd,
        duration: duration,
      }]);
      console.log('Period created from profile:', {
        start: userProfile.lastPeriodStart,
        end: userProfile.lastPeriodEnd,
        duration
      });
    }
  }, [userProfile]);

  // Load day logs on mount
  useEffect(() => {
    const loadDayLogs = async () => {
      try {
        const { getDayLogs } = await import('../services/api');
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        const logs = await getDayLogs(
          userProfile.userId,
          formatDateKey(threeMonthsAgo),
          formatDateKey(today)
        );
        
        // Convert array to object keyed by date
        const logsObj: { [key: string]: Omit<DayLog, 'id' | 'userId'> } = {};
        logs.forEach(log => {
          logsObj[log.date] = {
            date: log.date,
            flow: log.flow,
            symptoms: log.symptoms,
            mood: log.mood,
            energy: log.energy,
            notes: log.notes,
          };
        });
        
        setDayLogs(logsObj);
      } catch (error) {
        console.error('Failed to load day logs:', error);
      }
    };

    loadDayLogs();
  }, [userProfile.userId]);

  // ========== CALCULATIONS ==========

  const calculateAverageCycleLength = (): number => {
    if (pastPeriods.length < 2) return 28;
    
    const cycles: number[] = [];
    for (let i = 0; i < pastPeriods.length - 1; i++) {
      const days = Math.ceil(
        (pastPeriods[i].startDate.getTime() - pastPeriods[i + 1].startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      cycles.push(days);
    }
    
    return Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
  };

  const calculateAveragePeriodLength = (): number => {
    if (pastPeriods.length === 0) return 5;
    return Math.round(pastPeriods.reduce((sum, p) => sum + p.duration, 0) / pastPeriods.length);
  };

  const calculateCycleConsistency = (): number => {
    if (pastPeriods.length < 3) return 0;
    
    const cycles: number[] = [];
    for (let i = 0; i < pastPeriods.length - 1; i++) {
      const days = Math.ceil(
        (pastPeriods[i].startDate.getTime() - pastPeriods[i + 1].startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      cycles.push(days);
    }
    
    const avg = cycles.reduce((a, b) => a + b, 0) / cycles.length;
    const variance = cycles.reduce((sum, cycle) => sum + Math.pow(cycle - avg, 2), 0) / cycles.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to percentage (lower std dev = higher consistency)
    const consistency = Math.max(0, Math.min(100, 100 - (stdDev * 10)));
    return Math.round(consistency);
  };

  const getMostCommonSymptoms = (): { symptom: string; count: number }[] => {
    const symptomCounts: { [key: string]: number } = {};
    
    Object.values(dayLogs).forEach(log => {
      Object.entries(log.symptoms).forEach(([symptom, value]) => {
        if (value) {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        }
      });
    });
    
    return Object.entries(symptomCounts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getCurrentCyclePhase = (): { 
    phase: 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal' | 'Unknown'; 
    description: string; 
    dayInCycle: number;
    daysRemaining: number;
  } => {
    if (pastPeriods.length === 0) {
      return { 
        phase: 'Unknown', 
        description: 'Add your period data to start tracking your cycle', 
        dayInCycle: 0,
        daysRemaining: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastPeriod = pastPeriods[0];
    const daysSinceLastPeriod = Math.ceil(
      (today.getTime() - lastPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgCycleLength = calculateAverageCycleLength();

    // Menstrual Phase
    if (daysSinceLastPeriod >= 0 && daysSinceLastPeriod < lastPeriod.duration) {
      return {
        phase: 'Menstrual',
        description: 'Focus on iron-rich foods and stay hydrated. Rest and gentle movement recommended.',
        dayInCycle: daysSinceLastPeriod + 1,
        daysRemaining: lastPeriod.duration - daysSinceLastPeriod,
      };
    } 
    // Follicular Phase
    else if (daysSinceLastPeriod >= lastPeriod.duration && daysSinceLastPeriod <= 13) {
      return {
        phase: 'Follicular',
        description: 'Energy is rising! Great time for high-intensity activities and trying new foods.',
        dayInCycle: daysSinceLastPeriod + 1,
        daysRemaining: 13 - daysSinceLastPeriod,
      };
    } 
    // Ovulation Phase
    else if (daysSinceLastPeriod > 13 && daysSinceLastPeriod <= 16) {
      return {
        phase: 'Ovulation',
        description: 'Peak energy and metabolism. Enjoy complex carbs and protein-rich meals.',
        dayInCycle: daysSinceLastPeriod + 1,
        daysRemaining: 16 - daysSinceLastPeriod,
      };
    } 
    // Luteal Phase
    else if (daysSinceLastPeriod > 16 && daysSinceLastPeriod < avgCycleLength) {
      return {
        phase: 'Luteal',
        description: 'Focus on magnesium and B-vitamins. Listen to your body and rest when needed.',
        dayInCycle: daysSinceLastPeriod + 1,
        daysRemaining: avgCycleLength - daysSinceLastPeriod,
      };
    } 
    else {
      return {
        phase: 'Menstrual',
        description: 'Your next period should arrive soon. Track any pre-menstrual symptoms.',
        dayInCycle: daysSinceLastPeriod + 1,
        daysRemaining: 0,
      };
    }
  };

  const getPhaseDetails = () => {
    if (pastPeriods.length === 0) return null;

    const avgCycleLength = calculateAverageCycleLength();
    const avgPeriodLength = calculateAveragePeriodLength();
    const lastPeriod = pastPeriods[0];
    
    // Calculate next period
    const nextPeriodStart = new Date(lastPeriod.startDate);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + avgCycleLength);
    
    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + avgPeriodLength);

    // Calculate follicular phase
    const follicularStart = new Date(lastPeriod.endDate);
    follicularStart.setDate(follicularStart.getDate() + 1);
    
    const follicularEnd = new Date(lastPeriod.startDate);
    follicularEnd.setDate(follicularEnd.getDate() + 13);

    // Calculate ovulation
    const ovulationDay = new Date(lastPeriod.startDate);
    ovulationDay.setDate(ovulationDay.getDate() + 14);

    // Calculate luteal phase
    const lutealStart = new Date(lastPeriod.startDate);
    lutealStart.setDate(lutealStart.getDate() + 17);
    
    const lutealEnd = new Date(nextPeriodStart);
    lutealEnd.setDate(lutealEnd.getDate() - 1);

    return {
      menstrual: {
        current: lastPeriod,
        next: { start: nextPeriodStart, end: nextPeriodEnd, duration: avgPeriodLength },
      },
      follicular: {
        start: follicularStart,
        end: follicularEnd,
      },
      ovulation: {
        date: ovulationDay,
      },
      luteal: {
        start: lutealStart,
        end: lutealEnd,
      },
    };
  };

  const predictNextPeriod = (): { startDate: Date; endDate: Date } | null => {
    if (pastPeriods.length === 0) return null;

    const avgCycleLength = calculateAverageCycleLength();
    const lastPeriod = pastPeriods[0];
    const avgDuration = pastPeriods.reduce((sum, p) => sum + p.duration, 0) / pastPeriods.length;

    const nextStart = new Date(lastPeriod.startDate);
    nextStart.setDate(nextStart.getDate() + avgCycleLength);

    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + Math.round(avgDuration));

    return { startDate: nextStart, endDate: nextEnd };
  };

  const getPhaseForDate = (date: Date): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'predicted' | null => {
    if (pastPeriods.length === 0) return null;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check if this date falls within any recorded period
    for (const period of pastPeriods) {
      const start = new Date(period.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(period.endDate);
      end.setHours(0, 0, 0, 0);
      
      if (checkDate >= start && checkDate <= end) {
        console.log(`Date ${checkDate.toDateString()} is MENSTRUAL`);
        return 'menstrual';
      }
    }

    // Check if date is in predicted period
    const predicted = predictNextPeriod();
    if (predicted) {
      const predStart = new Date(predicted.startDate);
      predStart.setHours(0, 0, 0, 0);
      const predEnd = new Date(predicted.endDate);
      predEnd.setHours(0, 0, 0, 0);
      
      if (checkDate >= predStart && checkDate <= predEnd) {
        console.log(`Date ${checkDate.toDateString()} is PREDICTED PERIOD`);
        return 'predicted';
      }
    }

    // Calculate which cycle day this is based on most recent period
    const lastPeriod = pastPeriods[0];
    const lastPeriodStart = new Date(lastPeriod.startDate);
    lastPeriodStart.setHours(0, 0, 0, 0);
    
    const daysSinceLastPeriodStart = Math.round(
      (checkDate.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Only show phases for dates after the last period started and before predicted next period
    if (daysSinceLastPeriodStart < 0) {
      return null; // Before last period
    }
    
    const avgCycleLength = calculateAverageCycleLength();
    if (daysSinceLastPeriodStart >= avgCycleLength) {
      return null; // After predicted next period should start
    }
    
    const cycleDay = daysSinceLastPeriodStart + 1; // Day 1, Day 2, etc.
    
    // Phase determination based on cycle day
    // Days 1-5: Menstrual (already handled above in pastPeriods check)
    // Days 6-13: Follicular
    // Days 14-16: Ovulation
    // Days 17-28: Luteal
    
    if (cycleDay >= 6 && cycleDay <= 13) {
      console.log(`Date ${checkDate.toDateString()} is FOLLICULAR (cycle day ${cycleDay})`);
      return 'follicular';
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      console.log(`Date ${checkDate.toDateString()} is OVULATION (cycle day ${cycleDay})`);
      return 'ovulation';
    } else if (cycleDay >= 17) {
      console.log(`Date ${checkDate.toDateString()} is LUTEAL (cycle day ${cycleDay})`);
      return 'luteal';
    }

    return null;
  };

  // ========== CALENDAR GENERATION ==========

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    return days;
  };

  const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDayLog = (date: Date): Omit<DayLog, 'id' | 'userId'> => {
    const key = formatDateKey(date);
    return dayLogs[key] || { date: key, symptoms: {} };
  };

  const updateDayLog = (date: Date, updates: Partial<Omit<DayLog, 'id' | 'userId'>>) => {
    const key = formatDateKey(date);
    setDayLogs(prev => ({
      ...prev,
      [key]: {
        ...getDayLog(date),
        ...updates,
      }
    }));
  };

  const toggleSymptom = (date: Date, symptom: keyof DayLog['symptoms']) => {
    const log = getDayLog(date);
    updateDayLog(date, {
      symptoms: {
        ...log.symptoms,
        [symptom]: !log.symptoms[symptom]
      }
    });
  };

  // ========== HANDLERS ==========

  const handleAddPeriod = () => {
    if (newStartDate && newEndDate) {
      const start = new Date(newStartDate);
      const end = new Date(newEndDate);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const newPeriod: PeriodRecord = {
        id: Date.now().toString(),
        userId: userProfile.userId,
        startDate: start,
        endDate: end,
        duration: duration,
      };

      const updated = [newPeriod, ...pastPeriods].sort(
        (a, b) => b.startDate.getTime() - a.startDate.getTime()
      );
      setPastPeriods(updated);
      
      if (updated.length > 0) {
        onUpdateProfile({
          lastPeriodStart: updated[0].startDate,
          lastPeriodEnd: updated[0].endDate,
          periodHistory: updated,
        });
      }

      setNewStartDate('');
      setNewEndDate('');
      setShowAddPeriod(false);
    }
  };

  const quickLogToday = () => {
    setSelectedDay(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ========== DATA ==========

  const currentPhase = getCurrentCyclePhase();
  const phaseDetails = getPhaseDetails();
  const nextPeriod = predictNextPeriod();
  const avgCycleLength = calculateAverageCycleLength();
  const avgPeriodLength = calculateAveragePeriodLength();
  const consistency = calculateCycleConsistency();
  const commonSymptoms = getMostCommonSymptoms();
  const calendarDays = generateCalendarDays();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          onClick={quickLogToday}
          className="flex-1 text-white"
          style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Today
        </Button>
        <Button
          onClick={() => setShowAddPeriod(!showAddPeriod)}
          variant="outline"
          className="flex-1"
          style={{ borderColor: COLORS.sage, color: COLORS.sageDark }}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Add Period
        </Button>
      </div>

      {/* Add Period Form */}
      {showAddPeriod && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 style={{ color: COLORS.sageDark }}>Add Period</h3>
          <div>
            <Label className="text-xs mb-1 block text-slate-600">Start Date</Label>
            <Input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block text-slate-600">End Date</Label>
            <Input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              min={newStartDate}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowAddPeriod(false);
                setNewStartDate('');
                setNewEndDate('');
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPeriod}
              size="sm"
              className="flex-1 text-white"
              style={{ background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` }}
              disabled={!newStartDate || !newEndDate}
            >
              Save Period
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('calendar')}
          className="flex-1 py-2 rounded-xl transition-colors text-sm"
          style={{
            background: activeTab === 'calendar' ? `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` : 'transparent',
            color: activeTab === 'calendar' ? 'white' : '#64748b'
          }}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('phases')}
          className="flex-1 py-2 rounded-xl transition-colors text-sm"
          style={{
            background: activeTab === 'phases' ? `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` : 'transparent',
            color: activeTab === 'phases' ? 'white' : '#64748b'
          }}
        >
          Phases
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className="flex-1 py-2 rounded-xl transition-colors text-sm"
          style={{
            background: activeTab === 'insights' ? `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)` : 'transparent',
            color: activeTab === 'insights' ? 'white' : '#64748b'
          }}
        >
          Insights
        </button>
      </div>

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <>
          {/* Current Phase Card */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.sageBgLight }}
              >
                <Activity className="h-5 w-5" style={{ color: COLORS.sageDark }} />
              </div>
              <div className="flex-1">
                <h3 style={{ color: COLORS.sageDark }}>{currentPhase.phase} Phase</h3>
                <p className="text-xs text-slate-600">Day {currentPhase.dayInCycle} of cycle</p>
              </div>
              {currentPhase.daysRemaining > 0 && (
                <div className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: COLORS.sageBg, color: COLORS.sage }}>
                  {currentPhase.daysRemaining} days left
                </div>
              )}
            </div>

            <p className="text-sm text-slate-700 mb-4">{currentPhase.description}</p>

            {nextPeriod && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.menstrualLight }}>
                <div className="flex items-center gap-2 mb-1">
                  <Droplet className="h-4 w-4" style={{ color: COLORS.menstrualText }} />
                  <span className="text-xs" style={{ color: COLORS.menstrualText }}>Next Period Predicted</span>
                </div>
                <p className="text-sm" style={{ color: COLORS.menstrualText }}>
                  {formatDate(nextPeriod.startDate)} ({avgPeriodLength} days)
                </p>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: COLORS.sageDark }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={previousMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: COLORS.sageBg }}
                >
                  <ChevronLeft className="h-4 w-4" style={{ color: COLORS.sage }} />
                </button>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: COLORS.sageBg }}
                >
                  <ChevronRight className="h-4 w-4" style={{ color: COLORS.sage }} />
                </button>
              </div>
            </div>

            {/* Phase Legend */}
            <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBgLight }}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.menstrual }} />
                  <span className="text-slate-600">Menstrual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.follicular }} />
                  <span className="text-slate-600">Follicular</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.ovulation }} />
                  <span className="text-slate-600">Ovulation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.luteal }} />
                  <span className="text-slate-600">Luteal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: COLORS.predictedPeriod, borderColor: COLORS.predictedText, borderStyle: 'dashed' }} />
                  <span className="text-slate-600">Predicted Period</span>
                </div>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs text-slate-500 p-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayData, idx) => {
                const phase = getPhaseForDate(dayData.date);
                const dayLog = getDayLog(dayData.date);
                const isToday = dayData.date.getTime() === today.getTime();
                
                let bgColor = 'white';
                let textColor = dayData.isCurrentMonth ? '#1e293b' : '#cbd5e1';
                let borderColor = '#f1f5f9';
                
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
                }
                
                if (isToday) {
                  borderColor = COLORS.sage;
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(dayData.date)}
                    className="aspect-square p-1 rounded-lg flex flex-col items-center justify-start text-xs transition-all hover:shadow-md"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      opacity: dayData.isCurrentMonth ? 1 : 0.4,
                    }}
                  >
                    <div className="font-medium mb-0.5">{dayData.date.getDate()}</div>
                    
                    {/* Indicators */}
                    <div className="flex items-center gap-0.5 flex-wrap justify-center">
                      {dayLog.flow && <Droplet className="h-2.5 w-2.5" />}
                      {dayLog.symptoms.cramps && <span className="text-[8px]">💢</span>}
                      {dayLog.mood === 'happy' && <Smile className="h-2.5 w-2.5" />}
                      {dayLog.mood === 'sad' && <Frown className="h-2.5 w-2.5" />}
                      {dayLog.energy === 'high' && <Zap className="h-2.5 w-2.5" />}
                      {dayLog.energy === 'low' && <ZapOff className="h-2.5 w-2.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Editor */}
          {selectedDay && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ color: COLORS.sageDark }}>
                  {formatDate(selectedDay)}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Flow */}
                <div>
                  <Label className="text-xs text-slate-600 mb-2 block">Flow</Label>
                  <div className="flex gap-2">
                    {(['light', 'medium', 'heavy'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => {
                          const log = getDayLog(selectedDay);
                          updateDayLog(selectedDay, { 
                            flow: log.flow === level ? undefined : level 
                          });
                        }}
                        className="flex-1 py-2 px-3 rounded-lg text-sm transition-all capitalize"
                        style={{
                          backgroundColor: getDayLog(selectedDay).flow === level ? COLORS.sage : COLORS.sageBg,
                          color: getDayLog(selectedDay).flow === level ? 'white' : COLORS.sageDark,
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <Label className="text-xs text-slate-600 mb-2 block">Symptoms</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'cramps', label: 'Cramps', icon: '💢' },
                      { key: 'headache', label: 'Headache', icon: '🤕' },
                      { key: 'bloating', label: 'Bloating', icon: '🎈' },
                      { key: 'fatigue', label: 'Fatigue', icon: '😴' },
                      { key: 'insomnia', label: 'Insomnia', icon: '🌙' },
                      { key: 'cravings', label: 'Cravings', icon: '🍫' },
                    ].map(symptom => {
                      const isActive = getDayLog(selectedDay).symptoms[symptom.key as keyof DayLog['symptoms']];
                      return (
                        <button
                          key={symptom.key}
                          onClick={() => toggleSymptom(selectedDay, symptom.key as keyof DayLog['symptoms'])}
                          className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-all"
                          style={{
                            backgroundColor: isActive ? COLORS.sage : COLORS.sageBg,
                            color: isActive ? 'white' : COLORS.sageDark,
                          }}
                        >
                          <span>{symptom.icon}</span>
                          <span>{symptom.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <Label className="text-xs text-slate-600 mb-2 block">Mood</Label>
                  <div className="flex gap-2">
                    {([
                      { key: 'happy', icon: Smile },
                      { key: 'neutral', icon: Meh },
                      { key: 'sad', icon: Frown },
                    ] as const).map(mood => {
                      const Icon = mood.icon;
                      const isActive = getDayLog(selectedDay).mood === mood.key;
                      return (
                        <button
                          key={mood.key}
                          onClick={() => {
                            const log = getDayLog(selectedDay);
                            updateDayLog(selectedDay, { 
                              mood: log.mood === mood.key ? undefined : mood.key 
                            });
                          }}
                          className="flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center"
                          style={{
                            backgroundColor: isActive ? COLORS.sage : COLORS.sageBg,
                            color: isActive ? 'white' : COLORS.sageDark,
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <Label className="text-xs text-slate-600 mb-2 block">Energy</Label>
                  <div className="flex gap-2">
                    {([
                      { key: 'high', icon: Zap, label: 'High' },
                      { key: 'low', icon: ZapOff, label: 'Low' },
                    ] as const).map(energy => {
                      const Icon = energy.icon;
                      const isActive = getDayLog(selectedDay).energy === energy.key;
                      return (
                        <button
                          key={energy.key}
                          onClick={() => {
                            const log = getDayLog(selectedDay);
                            updateDayLog(selectedDay, { 
                              energy: log.energy === energy.key ? undefined : energy.key 
                            });
                          }}
                          className="flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: isActive ? COLORS.sage : COLORS.sageBg,
                            color: isActive ? 'white' : COLORS.sageDark,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{energy.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-xs text-slate-600 mb-2 block">Notes</Label>
                  <Textarea
                    placeholder="How are you feeling today?"
                    value={getDayLog(selectedDay).notes || ''}
                    onChange={(e) => updateDayLog(selectedDay, { notes: e.target.value })}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* PHASES TAB */}
      {activeTab === 'phases' && phaseDetails && (
        <div className="space-y-4">
          {/* Menstrual Phase */}
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ borderLeft: `4px solid ${COLORS.menstrual}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="h-5 w-5" style={{ color: COLORS.menstrualText }} />
              <h3 style={{ color: COLORS.menstrualText }}>Menstrual Phase</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.menstrualLight }}>
                <Label className="text-xs text-slate-600 mb-1 block">Last Period</Label>
                <p className="text-sm" style={{ color: COLORS.menstrualText }}>
                  {formatDate(phaseDetails.menstrual.current.startDate)} - {formatDate(phaseDetails.menstrual.current.endDate)}
                </p>
                <p className="text-xs text-slate-600">{phaseDetails.menstrual.current.duration} days</p>
              </div>

              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.menstrualLight }}>
                <Label className="text-xs text-slate-600 mb-1 block">Next Predicted Period</Label>
                <p className="text-sm" style={{ color: COLORS.menstrualText }}>
                  {formatDate(phaseDetails.menstrual.next.start)} - {formatDate(phaseDetails.menstrual.next.end)}
                </p>
                <p className="text-xs text-slate-600">Expected {phaseDetails.menstrual.next.duration} days</p>
              </div>

              <div>
                <Label className="text-sm mb-2 block" style={{ color: COLORS.sageDark }}>Recommendations</Label>
                <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                  <li className="list-disc">Focus on iron-rich foods (spinach, lentils, red meat)</li>
                  <li className="list-disc">Stay hydrated and warm</li>
                  <li className="list-disc">Gentle movement like yoga or walking</li>
                  <li className="list-disc">Anti-inflammatory foods to ease cramps</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Follicular Phase */}
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ borderLeft: `4px solid ${COLORS.follicular}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Sun className="h-5 w-5" style={{ color: COLORS.follicularText }} />
              <h3 style={{ color: COLORS.follicularText }}>Follicular Phase</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.follicularLight }}>
                <Label className="text-xs text-slate-600 mb-1 block">Phase Duration</Label>
                <p className="text-sm" style={{ color: COLORS.follicularText }}>
                  {formatDate(phaseDetails.follicular.start)} - {formatDate(phaseDetails.follicular.end)}
                </p>
              </div>

              <div>
                <Label className="text-sm mb-2 block" style={{ color: COLORS.sageDark }}>What to Expect</Label>
                <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                  <li className="list-disc">Energy levels rising</li>
                  <li className="list-disc">Improved mood and focus</li>
                  <li className="list-disc">Skin may appear clearer</li>
                  <li className="list-disc">Great time for high-intensity workouts</li>
                </ul>
              </div>

              <div>
                <Label className="text-sm mb-2 block" style={{ color: COLORS.sageDark }}>Meal Recommendations</Label>
                <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                  <li className="list-disc">Fresh vegetables and fruits</li>
                  <li className="list-disc">Lean proteins for muscle recovery</li>
                  <li className="list-disc">Whole grains for sustained energy</li>
                  <li className="list-disc">Lighter, nutrient-dense meals</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ovulation Phase */}
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ borderLeft: `4px solid ${COLORS.ovulation}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5" style={{ color: COLORS.ovulationText }} />
              <h3 style={{ color: COLORS.ovulationText }}>Ovulation Phase</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.ovulationLight }}>
                <Label className="text-xs text-slate-600 mb-1 block">Predicted Ovulation</Label>
                <p className="text-sm" style={{ color: COLORS.ovulationText }}>
                  {formatDate(phaseDetails.ovulation.date)}
                </p>
                <p className="text-xs text-slate-600">Around day 14 of cycle</p>
              </div>

              <div>
                <Label className="text-sm mb-2 block" style={{ color: COLORS.sageDark }}>Physical Signs</Label>
                <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                  <li className="list-disc flex items-center gap-2">
                    <Thermometer className="h-3 w-3" />
                    Slight body temperature rise
                  </li>
                  <li className="list-disc flex items-center gap-2">
                    <Droplet className="h-3 w-3" />
                    Cervical fluid changes (clear, stretchy)
                  </li>
                  <li className="list-disc flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Peak energy levels
                  </li>
                  <li className="list-disc flex items-center gap-2">
                    <Heart className="h-3 w-3" />
                    Possible increased libido
                  </li>
                </ul>
              </div>

              <div>
                <Label className="text-sm mb-2 block" style={{ color: COLORS.sageDark }}>Nutrition Tips</Label>
                <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                  <li className="list-disc">Complex carbohydrates</li>
                  <li className="list-disc">High-protein meals</li>
                  <li className="list-disc">Calcium-rich foods</li>
                  <li className="list-disc">Antioxidant-rich fruits</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Luteal Phase */}
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ borderLeft: `4px solid ${COLORS.luteal}` }}>
            <div className="flex items-center gap-2 mb-3">
              <MoonIcon className="h-5 w-5" style={{ color: COLORS.lutealText }} />
              <h3 style={{ color: COLORS.lutealText }}>Luteal Phase</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.lutealLight }}>
                <Label className="text-xs text-slate-600 mb-1 block">Phase Duration</Label>
                <p className="text-sm" style={{ color: COLORS.lutealText }}>
                  {formatDate(phaseDetails.luteal.start)} - {formatDate(phaseDetails.luteal.end)}
                </p>
              </div>

              <div>
                <Label className="text-sm mb-2 block" style={{ color: COLORS.sageDark }}>Common PMS Symptoms</Label>
                <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                  <li className="list-disc">Mood changes or irritability</li>
                  <li className="list-disc">Bloating and water retention</li>
                  <li className="list-disc">Food cravings (especially sweets)</li>
                  <li className="list-disc">Breast tenderness</li>
                  <li className="list-disc">Fatigue or low energy</li>
                </ul>
              </div>

              <div>
                <Label className="text-sm mb-2 block" style={{ color: COLORS.sageDark }}>Self-Care Tips</Label>
                <ul className="text-xs text-slate-700 space-y-1.5 ml-4">
                  <li className="list-disc">Focus on magnesium-rich foods (dark chocolate, nuts)</li>
                  <li className="list-disc">B-vitamin foods (leafy greens, eggs)</li>
                  <li className="list-disc">Reduce salt to minimize bloating</li>
                  <li className="list-disc">Gentle exercise like walking or swimming</li>
                  <li className="list-disc">Prioritize sleep and rest</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Cycle Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" style={{ color: COLORS.sage }} />
              <h3 style={{ color: COLORS.sageDark }}>Cycle Statistics</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBg }}>
                <Label className="text-xs text-slate-600 mb-1 block">Average Cycle</Label>
                <p className="text-2xl" style={{ color: COLORS.sageDark }}>{avgCycleLength}</p>
                <p className="text-xs text-slate-600">days</p>
              </div>

              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBg }}>
                <Label className="text-xs text-slate-600 mb-1 block">Average Period</Label>
                <p className="text-2xl" style={{ color: COLORS.sageDark }}>{avgPeriodLength}</p>
                <p className="text-xs text-slate-600">days</p>
              </div>

              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBg }}>
                <Label className="text-xs text-slate-600 mb-1 block">Periods Tracked</Label>
                <p className="text-2xl" style={{ color: COLORS.sageDark }}>{pastPeriods.length}</p>
                <p className="text-xs text-slate-600">total</p>
              </div>

              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBg }}>
                <Label className="text-xs text-slate-600 mb-1 block">Consistency</Label>
                <p className="text-2xl" style={{ color: COLORS.sageDark }}>{consistency}%</p>
                <p className="text-xs text-slate-600">regular</p>
              </div>
            </div>
          </div>

          {/* Cycle Consistency */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5" style={{ color: COLORS.sage }} />
              <h3 style={{ color: COLORS.sageDark }}>Cycle Consistency</h3>
            </div>

            <div className="mb-3">
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.sageBgLight }}>
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${consistency}%`,
                    background: `linear-gradient(135deg, ${COLORS.sageLight} 0%, ${COLORS.sage} 100%)`
                  }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {consistency >= 80 ? 'Very consistent cycle' : 
                 consistency >= 60 ? 'Moderately consistent cycle' : 
                 consistency >= 40 ? 'Some variation in cycle length' :
                 'Irregular cycle - track more periods for better predictions'}
              </p>
            </div>

            {pastPeriods.length < 3 && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBgLight }}>
                <p className="text-xs text-slate-700">
                  Track at least 3 periods to get accurate consistency insights
                </p>
              </div>
            )}
          </div>

          {/* Most Common Symptoms */}
          {commonSymptoms.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5" style={{ color: COLORS.sage }} />
                <h3 style={{ color: COLORS.sageDark }}>Most Common Symptoms</h3>
              </div>

              <div className="space-y-2">
                {commonSymptoms.map((symptom, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize" style={{ color: COLORS.sageDark }}>
                          {symptom.symptom.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-xs text-slate-600">{symptom.count} times</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.sageBgLight }}>
                        <div 
                          className="h-full"
                          style={{ 
                            width: `${(symptom.count / Math.max(...commonSymptoms.map(s => s.count))) * 100}%`,
                            backgroundColor: COLORS.sage
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Period History */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="mb-4" style={{ color: COLORS.sageDark }}>Period History</h3>
            
            <div className="space-y-2">
              {pastPeriods.length > 0 ? (
                pastPeriods.slice(0, 6).map((period, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: COLORS.sageBg }}
                  >
                    <div>
                      <p className="text-sm" style={{ color: COLORS.sageDark }}>
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </p>
                      <p className="text-xs text-slate-600">{period.duration} days</p>
                    </div>
                    {idx === 0 && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: COLORS.sageLight, color: 'white' }}>
                        Latest
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">No periods recorded yet</p>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5" style={{ color: COLORS.sage }} />
              <h3 style={{ color: COLORS.sageDark }}>Smart Insights</h3>
            </div>

            <div className="space-y-3">
              {pastPeriods.length >= 2 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBgLight }}>
                  <p className="text-sm" style={{ color: COLORS.sageDark }}>
                    📊 Your cycle averages {avgCycleLength} days, which is {avgCycleLength >= 21 && avgCycleLength <= 35 ? 'within the normal range' : 'slightly outside typical range (21-35 days)'}.
                  </p>
                </div>
              )}

              {pastPeriods.length >= 3 && consistency >= 80 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.follicularLight }}>
                  <p className="text-sm" style={{ color: COLORS.follicularText }}>
                    ✨ Your cycle is very consistent! This makes predictions more accurate.
                  </p>
                </div>
              )}

              {commonSymptoms.length > 0 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.lutealLight }}>
                  <p className="text-sm" style={{ color: COLORS.lutealText }}>
                    💡 Your most common symptom is {commonSymptoms[0].symptom}. Consider tracking this pattern across different cycle phases.
                  </p>
                </div>
              )}

              {pastPeriods.length < 3 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.sageBgLight }}>
                  <p className="text-sm" style={{ color: COLORS.sageDark }}>
                    📝 Track at least 3 periods to unlock personalized insights and accurate predictions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}