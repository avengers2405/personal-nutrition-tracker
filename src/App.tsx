import { useState } from 'react';
import { Calendar as CalendarIcon, Search, Plus, ChevronDown } from 'lucide-react';
import { FoodItem, DailyStats, UserConfig, TrackedNutrient } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AddFoodModal from './components/AddFoodModal';

const DEFAULT_CONFIG: UserConfig = {
  trackedNutrients: [
    { id: 'protein', name: 'Protein', goal: 120, unit: 'g' },
    { id: 'fiber', name: 'Fiber', goal: 30, unit: 'g' },
    { id: 'vit-c', name: 'Vitamin C', goal: 90, unit: 'mg' },
    { id: 'vit-a', name: 'Vitamin A', goal: 900, unit: 'mcg' },
  ]
};

const SAMPLE_FOOD_DATABASE: FoodItem[] = [
  { 
    id: 'f1', 
    name: 'Navel Orange', 
    serving: '1 medium (140g)', 
    image: 'https://picsum.photos/seed/orange/200/200',
    nutrients: { 'vit-c': 70, 'fiber': 3, 'vit-a': 10 }
  },
  { 
    id: 'f2', 
    name: 'Steamed Spinach', 
    serving: '1 cup', 
    image: 'https://picsum.photos/seed/spinach/200/200',
    nutrients: { 'vit-a': 940, 'fiber': 4, 'vit-c': 18, 'protein': 5 }
  },
];

const DAILY_LOGS: DailyStats[] = [
  {
    date: '2026-04-18',
    nutrients: {
      'protein': 85,
      'fiber': 24,
      'vit-c': 40,
      'vit-a': 920,
    }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>(SAMPLE_FOOD_DATABASE);
  const [currentDate, setCurrentDate] = useState('2026-04-18');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const stats = DAILY_LOGS.find(log => log.date === currentDate) || { date: currentDate, nutrients: {} };
  
  const trackedNutrients: TrackedNutrient[] = config.trackedNutrients.map(n => ({
    ...n,
    value: stats.nutrients[n.id] || 0
  }));

  return (
    <div className="flex min-h-screen bg-surface selection:bg-primary/20 selection:text-primary">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden relative transition-all duration-500">
        
        {/* Responsive Header */}
        <header className="fixed top-0 left-0 lg:left-[240px] right-0 z-30 px-8 py-6 glass-header flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-2 lg:hidden">
            <h2 className="font-headline text-2xl tracking-[4px] uppercase text-primary">Aureus</h2>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-surface-container border border-outline px-6 py-3 hover:bg-surface-container-high transition-all"
            >
              <span className="font-headline text-sm uppercase tracking-[2px] text-primary">
                {currentDate === '2026-04-18' ? 'Today' : currentDate === '2026-04-19' ? 'Tomorrow' : currentDate}
              </span>
              <ChevronDown size={16} className={`text-primary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-surface-container border border-outline shadow-2xl z-50">
                <button 
                  onClick={() => { setCurrentDate('2026-04-18'); setIsDropdownOpen(false); }}
                  className="w-full text-left px-6 py-4 hover:bg-primary/5 text-on-surface font-body text-xs uppercase tracking-[1px] border-b border-outline"
                >
                  Today
                </button>
                <button 
                  onClick={() => { setCurrentDate('2026-04-19'); setIsDropdownOpen(false); }}
                  className="w-full text-left px-6 py-4 hover:bg-primary/5 text-on-surface font-body text-xs uppercase tracking-[1px] border-b border-outline"
                >
                  Tomorrow
                </button>
                <button 
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full text-left px-6 py-4 hover:bg-primary/5 text-on-surface font-body text-xs uppercase tracking-[1px] flex justify-between items-center"
                >
                  Calendar
                  <CalendarIcon size={14} className="text-primary opacity-60" />
                </button>
                
                {showCalendar && (
                  <div className="p-4 bg-surface border-t border-outline">
                    <div className="grid grid-cols-7 gap-1 text-[8px] text-on-surface-variant uppercase text-center mb-2">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => { setCurrentDate(`2026-04-${String(i + 1).padStart(2, '0')}`); setIsDropdownOpen(false); setShowCalendar(false); }}
                          className={`w-full aspect-square text-[10px] flex items-center justify-center hover:bg-primary/20 ${currentDate.endsWith(String(i + 1).padStart(2, '0')) ? 'bg-primary text-on-primary' : 'text-on-surface'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="hidden lg:block text-right">
            <h1 className="text-3xl font-normal text-on-surface font-headline">Aureus Registry</h1>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-[1px] mt-1 opacity-70">Sophisticated Metric Control</p>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto mt-28 pb-28 lg:pb-10 px-8 no-scrollbar">
          <div className="max-w-6xl mx-auto h-full flex flex-col pt-4">
            
            {activeTab === 'main' ? (
              <>
                <Dashboard nutrients={trackedNutrients} />

                {/* Search / Quick Entry Panel */}
                <div className="mt-8 bg-surface-container rounded-none p-6 flex flex-col md:flex-row items-center gap-6 border border-outline">
                  <div className="relative flex-1 w-full group">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" />
                    <input 
                      className="w-full bg-surface-container-low text-on-surface py-4 pl-14 pr-6 border border-outline focus:border-primary focus:ring-0 transition-all placeholder:text-on-surface-variant/40 font-body text-sm tracking-wide" 
                      placeholder="Analyze log entries or instruments..." 
                      type="text"
                    />
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto bg-primary text-on-primary px-10 py-4 font-headline text-sm uppercase tracking-[2px] transition-all hover:shadow-[0_0_20px_rgba(185,151,91,0.3)] active:scale-95"
                  >
                    Log Entry
                  </button>
                </div>
              </>
            ) : (
              <Settings 
                config={config} 
                setConfig={setConfig} 
                foodDatabase={foodDatabase} 
                setFoodDatabase={setFoodDatabase} 
              />
            )}
            
          </div>
        </div>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <AddFoodModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
