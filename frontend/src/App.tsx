import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Search, Plus, ChevronDown, X, Check } from 'lucide-react';
import { FoodItem, DailyStats, UserConfig, TrackedNutrient, ConsumedFood } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AddFoodModal from './components/AddFoodModal';
import FoodProfileModal from './components/FoodProfileModal';
import FoodSourcePane from './components/FoodSourcePane';
import ConnectionError from './components/ConnectionError';
import { fetchAllMacros, fetchAllFoods, checkBackendHealth, fetchMeasurementUnits, createFood, createFoodEntry, createFoodEntryByAmount, fetchFoodEntriesByDate } from './services/api';

const DEFAULT_CONFIG: UserConfig = {
  trackedNutrients: []
};

const SAMPLE_FOOD_DATABASE: FoodItem[] = [];

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateTimestamp = (dateStr: string) => {
  // Use midday to reduce timezone boundary shifts when backend converts timestamp to date.
  return new Date(`${dateStr}T12:00:00`).getTime();
};

/**
 * Convert fetched food entries to DailyStats by looking up macros in foodDatabase
 */
const buildDailyStatsFromEntries = (entries: any[], foodDatabase: FoodItem[], date: string): DailyStats => {
  const foods: ConsumedFood[] = [];
  const dailyNutrients: Record<string, number> = {};

  entries.forEach((entry: any) => {
    const food = foodDatabase.find(f => f.id === entry.food_id.toString());
    if (!food) {
      console.warn(`[App] Food ${entry.food_id} not found in database`);
      return;
    }

    // Scale food macros by servings
    const scaledNutrients: Record<string, number> = {};
    Object.entries(food.nutrients).forEach(([macroId, macroValue]) => {
      const scaled = (macroValue as number) * entry.servings;
      scaledNutrients[macroId] = scaled;
      dailyNutrients[macroId] = (dailyNutrients[macroId] || 0) + scaled;
      console.log(`[App] Food ${food.name}, macro ${macroId}: ${macroValue} * ${entry.servings} = ${scaled}`);
    });

    foods.push({
      foodId: entry.food_id.toString(),
      foodName: entry.Foods?.name || 'Unknown Food',
      serving: `${entry.servings} servings`,
      image: `https://picsum.photos/seed/${(entry.Foods?.name || 'unknown').toLowerCase().replace(/\s+/g, '-')}/200/200`,
      nutrients: scaledNutrients
    });
  });

  return {
    date,
    foods,
    nutrients: dailyNutrients
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [dailyLogs, setDailyLogs] = useState<DailyStats[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFoodProfileModalOpen, setIsFoodProfileModalOpen] = useState(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFoodsForEntry, setSelectedFoodsForEntry] = useState<{ foodId: string; foodName: string; amount: string; units: string; eatenOnDate: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch macros and foods from backend on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('[App] Starting data load from backend...');
        
        // Check backend health first
        console.log('[App] Checking backend health...');
        await checkBackendHealth();
        console.log('[App] Backend health check passed');
        
        // Fetch all macros
        console.log('[App] Fetching macros...');
        const macrosResponse = await fetchAllMacros();
        console.log('[App] Macros fetched:', macrosResponse);
        const macros = macrosResponse.data || [];
        
        // Convert macros to UserConfig format with defaults for missing values
        const trackedNutrients = macros.map((macro: any) => ({
          id: macro.id.toString(),
          name: macro.name,
          goal: macro.target ?? 0, // Use target from DB, default to 0
          unit: macro.measurement_unit ?? 'g', // Use measurement_unit from DB, default to 'g'
          visible: macro.home_display ?? true // Use home_display from DB, default to true
        }));
        
        setConfig({ trackedNutrients });
        
        // Fetch all foods
        console.log('[App] Fetching foods...');
        const foodsResponse = await fetchAllFoods();
        console.log('[App] Foods fetched:', foodsResponse);
        const foods = foodsResponse.data || [];
        
        // Fetch measurement units
        console.log('[App] Fetching measurement units...');
        try {
          const units = await fetchMeasurementUnits();
          setMeasurementUnits(units);
        } catch (error) {
          console.error('[App] Failed to fetch measurement units:', error);
          setMeasurementUnits(['g']);
        }
        
        // Convert foods to FoodItem format
        const foodItems: FoodItem[] = foods.map((food: any) => {
          const fetchedNutrients: Record<string, number> = {};
          if (food['food-macro'] && Array.isArray(food['food-macro'])) {
            food['food-macro'].forEach((fm: any) => {
              fetchedNutrients[fm.macro_id.toString()] = fm.value;
            });
          }

          return {
            id: food.id.toString(),
            name: food.name,
            image: `https://picsum.photos/seed/${food.name.toLowerCase().replace(/\s+/g, '-')}/200/200`,
            nutrients: fetchedNutrients,
            measurement_unit: food.measurement_unit,
            serving_size: food.serving_size || 1
          } as FoodItem;
        });
        
        setFoodDatabase(foodItems);
        
        setIsLoading(false);
        setConnectionError(false);
        setIsRetrying(false);
        setRetryCount(0);
        
        console.log('[App] Data load completed successfully');
        
        // Clear any existing retry intervals
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
        }
      } catch (error) {
        console.error('[App] Error loading data from backend:', error);
        if (error instanceof Error) {
          console.error('[App] Error message:', error.message);
          console.error('[App] Error stack:', error.stack);
        }
        setIsLoading(false);
        setConnectionError(true);
        setIsRetrying(true);
      }
    };

    loadData();
  }, []);

  // Auto-retry every 5 seconds when connection fails
  useEffect(() => {
    if (connectionError && isRetrying) {
      retryIntervalRef.current = setInterval(() => {
        setRetryCount(prev => prev + 1);
        const attemptReconnect = async () => {
          try {
            // Fetch all macros
            const macrosResponse = await fetchAllMacros();
            const macros = macrosResponse.data || [];
            
            // Convert macros to UserConfig format with default settings
            const trackedNutrients = macros.map((macro: any) => ({
              id: macro.id.toString(),
              name: macro.name,
              goal: 0,
              unit: 'g',
              visible: true
            }));
            
            setConfig({ trackedNutrients });
            
            // Fetch all foods
            const foodsResponse = await fetchAllFoods();
            const foods = foodsResponse.data || [];
            
            // Convert foods to FoodItem format
            const foodItems: FoodItem[] = foods.map((food: any) => ({
              id: food.id.toString(),
              name: food.name,
              image: `https://picsum.photos/seed/${food.name.toLowerCase().replace(/\s+/g, '-')}/200/200`,
              nutrients: {},
              measurement_unit: food.measurement_unit,
              serving_size: food.serving_size || 1
            } as FoodItem));
            
            setFoodDatabase(foodItems);
            setConnectionError(false);
            setIsRetrying(false);
            setRetryCount(0);
            
            // Clear the retry interval
            if (retryIntervalRef.current) {
              clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = null;
            }
          } catch (error) {
            console.error('Retry attempt failed:', error);
            // Continue retrying
          }
        };
        
        attemptReconnect();
      }, 5000); // Retry every 5 seconds
    }

    // Cleanup on unmount or when connection error changes
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [connectionError, isRetrying]);

  useEffect(() => {
    const loadEntriesForSelectedDate = async () => {
      if (foodDatabase.length === 0) return;

      try {
        console.log('[App] Fetching food entries for date:', currentDate);
        const entriesResponse = await fetchFoodEntriesByDate(toDateTimestamp(currentDate));
        const entries = entriesResponse.data || [];

        setDailyLogs(prevLogs => {
          const otherLogs = prevLogs.filter(log => log.date !== currentDate);
          if (entries.length === 0) {
            return otherLogs;
          }

          const selectedDateLog = buildDailyStatsFromEntries(entries, foodDatabase, currentDate);
          return [...otherLogs, selectedDateLog];
        });
      } catch (error) {
        console.error('[App] Failed to fetch food entries for selected date:', error);
      }
    };

    loadEntriesForSelectedDate();
  }, [currentDate, foodDatabase]);

  const stats = dailyLogs.find(log => log.date === currentDate) || { date: currentDate, nutrients: {}, foods: [] };
  console.log('[App] Current stats for date', currentDate, ':', stats);
  console.log('[App] Stats nutrients:', stats.nutrients);
  
  const trackedNutrients: TrackedNutrient[] = config.trackedNutrients
    .filter(n => n.visible !== false)
    .map(n => ({
      ...n,
      value: stats.nutrients[n.id] || 0
    }));
  
  console.log('[App] Tracked nutrients with values:', trackedNutrients);

  const handleAddFood = (foodId: string, amount: number, units: string, eatenOnDate: string = currentDate) => {
    const food = foodDatabase.find(f => f.id === foodId);
    if (!food) return;

    // Debug: trace inputs for first-add edge cases
    console.log('handleAddFood called', { foodId, amount, units, eatenOnDate, serving_size: food.serving_size, measurement_unit: food.measurement_unit });

    // Calculate servings multiplier
    let servingsMultiplier = 1;
    
    if (units.toLowerCase() === 'servings') {
      servingsMultiplier = amount;
    } else if (units === food.measurement_unit) {
      servingsMultiplier = amount / food.serving_size;
    }

    console.log('computed servingsMultiplier', { servingsMultiplier });

    // Scale nutrients by servings multiplier
    const scaledNutrients: { [key: string]: number } = {};
    Object.entries(food.nutrients).forEach(([nutrientId, value]) => {
      scaledNutrients[nutrientId] = value * servingsMultiplier;
    });

    const consumedFood: ConsumedFood = {
      foodId: food.id,
      foodName: food.name,
      serving: `${amount} ${units}`,
      image: food.image,
      nutrients: scaledNutrients,
    };

    setDailyLogs(prevLogs => {
      const logIndex = prevLogs.findIndex(log => log.date === eatenOnDate);
      const newLogs = [...prevLogs];
      
      if (logIndex !== -1) {
        const updatedLog = { ...newLogs[logIndex] };
        updatedLog.foods = [...(updatedLog.foods || []), consumedFood];
        
        // Recalculate nutrients
        updatedLog.nutrients = {};
        updatedLog.foods.forEach(f => {
          Object.entries(f.nutrients).forEach(([nutrientId, value]) => {
            updatedLog.nutrients[nutrientId] = (updatedLog.nutrients[nutrientId] || 0) + value;
          });
        });
        
        newLogs[logIndex] = updatedLog;
      } else {
        const newLog: DailyStats = {
          date: eatenOnDate,
          foods: [consumedFood],
          nutrients: { ...consumedFood.nutrients },
        };
        newLogs.push(newLog);
      }
      
      return newLogs;
    });
  };

  const handleCreateFoodProfile = async (newFood: FoodItem) => {
    try {
      // First update the UI optimistically
      setFoodDatabase([...foodDatabase, newFood]);
      
      // Modal now provides `serving_size` (numeric) and `measurement_unit`.
      const servingAmount = Number(newFood.serving_size) || 1;
      const measurementUnitStr = newFood.measurement_unit || 'g';

      await createFood({
        name: newFood.name,
        measurementUnit: measurementUnitStr,
        servingSize: isNaN(servingAmount) ? 100 : servingAmount,
        nutrients: newFood.nutrients,
      });
      
      // Optionally we could refetch foods here to get actual IDs,
      // but UI is already updated so it's fine.
    } catch (error) {
      console.error('Error creating food profile:', error);
      alert('Failed to save to database. Only temporarily saved.');
    }
  };

  const handleRetry = () => {
    setConnectionError(false);
    setIsRetrying(false);
    setRetryCount(0);
    
    // Clear any existing retry intervals
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }

    // Trigger initial load again
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch all macros
        const macrosResponse = await fetchAllMacros();
        const macros = macrosResponse.data || [];
        
        // Convert macros to UserConfig format with default settings
        const trackedNutrients = macros.map((macro: any) => ({
          id: macro.id.toString(),
          name: macro.name,
          goal: 0,
          unit: 'g',
          visible: true
        }));
        
        setConfig({ trackedNutrients });
        
        // Fetch all foods
        const foodsResponse = await fetchAllFoods();
        const foods = foodsResponse.data || [];
        
        // Convert foods to FoodItem format
        const foodItems: FoodItem[] = foods.map((food: any) => ({
          id: food.id.toString(),
          name: food.name,
          image: `https://picsum.photos/seed/${food.name.toLowerCase().replace(/\s+/g, '-')}/200/200`,
          nutrients: {},
          measurement_unit: food.measurement_unit,
          serving_size: food.serving_size || 1
        } as FoodItem));
        
        setFoodDatabase(foodItems);
        setIsLoading(false);
        setConnectionError(false);
        setIsRetrying(false);
        setRetryCount(0);
      } catch (error) {
        console.error('Manual retry failed:', error);
        setIsLoading(false);
        setConnectionError(true);
        setIsRetrying(true);
      }
    };

    loadData();
  };

  const matchingFoods = foodSearchQuery.trim() ? 
    foodDatabase.filter(food => food.name.toLowerCase().includes(foodSearchQuery.toLowerCase())) :
    [];

  const handleSelectFoodForEntry = (food: FoodItem) => {
    const newFood = {
      foodId: food.id,
      foodName: food.name,
      amount: '1',
      units: food.measurement_unit,
      eatenOnDate: currentDate,
    };
    setSelectedFoodsForEntry([...selectedFoodsForEntry, newFood]);
    setFoodSearchQuery('');
  };

  const handleRemoveSelectedFood = (index: number) => {
    setSelectedFoodsForEntry(selectedFoodsForEntry.filter((_, i) => i !== index));
  };

  const handleAmountChange = (index: number, amount: string) => {
    const updated = [...selectedFoodsForEntry];
    updated[index].amount = amount;
    setSelectedFoodsForEntry(updated);
  };

  const handleCommitFoodEntry = async () => {
    // Persist each selected food entry to backend while updating UI optimistically
    const promises: Promise<any>[] = [];

    for (const food of selectedFoodsForEntry) {
      const amount = parseFloat(food.amount) || 0;
      if (amount <= 0) continue;

      // Optimistic UI update
      console.log('committing food entry', { food, parsedAmount: amount, units: food.units, eatenOnDate: food.eatenOnDate });
      handleAddFood(food.foodId, amount, food.units, food.eatenOnDate);

      // Persist to backend
      try {
        if (food.units.toLowerCase() === 'servings') {
          // amount represents servings
          const p = createFoodEntry(parseInt(food.foodId, 10), amount, food.eatenOnDate);
          promises.push(p);
        } else {
          // amount represents measurement unit; backend will calculate servings
          const p = createFoodEntryByAmount(parseInt(food.foodId, 10), amount, food.eatenOnDate);
          promises.push(p);
        }
      } catch (err) {
        console.error('Failed to enqueue persistence for food entry:', err);
      }
    }

    // Wait for all backend calls and handle errors
    try {
      const results = await Promise.all(promises);
      // Optionally inspect results for errors
      console.log('Food entry persistence results:', results);
    } catch (err) {
      console.error('Error persisting food entries:', err);
      alert('Some entries failed to save to the database. They are still shown locally.');
    }

    // Clear selection and search after committing
    setSelectedFoodsForEntry([]);
    setFoodSearchQuery('');
  };

  const todayDate = getTodayDate();
  const yesterdayDate = getYesterdayDate();

  let currentDateLabel = currentDate;
  if (currentDate === todayDate) {
    currentDateLabel = 'Today';
  } else if (currentDate === yesterdayDate) {
    currentDateLabel = 'Yesterday';
  }

  return (
    <>
      {/* Connection Error Screen */}
      {connectionError && !isLoading && (
        <ConnectionError 
          onRetry={handleRetry}
          isRetrying={isRetrying}
          retryCount={retryCount}
        />
      )}
      
      {/* Main App */}
      {!connectionError && (
        <div className="flex min-h-screen bg-surface selection:bg-primary/20 selection:text-primary">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden relative transition-all duration-500">
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-on-surface-variant font-body uppercase tracking-[1px]">Loading data from backend...</p>
                </div>
              </div>
        )}
        
        {!isLoading && (
          <>
        
        {/* Responsive Header */}
        <header className="fixed top-0 left-0 lg:left-60 right-0 z-30 px-8 py-6 glass-header flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-2 lg:hidden">
            <h2 className="font-headline text-2xl tracking-[4px] uppercase text-primary">Aureus</h2>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-surface-container border border-outline px-6 py-3 hover:bg-surface-container-high transition-all"
            >
              <span className="font-headline text-sm uppercase tracking-[2px] text-primary">
                {currentDateLabel}
              </span>
              <ChevronDown size={16} className={`text-primary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-surface-container border border-outline shadow-2xl z-50">
                <button 
                  onClick={() => {
                    setCurrentDate(todayDate);
                    setIsDropdownOpen(false);
                    setShowCalendar(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-primary/5 text-on-surface font-body text-xs uppercase tracking-[1px] border-b border-outline"
                >
                  Today
                </button>
                <button 
                  onClick={() => {
                    setCurrentDate(yesterdayDate);
                    setIsDropdownOpen(false);
                    setShowCalendar(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-primary/5 text-on-surface font-body text-xs uppercase tracking-[1px] border-b border-outline"
                >
                  Yesterday
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
                    <input
                      type="date"
                      max={todayDate}
                      value={currentDate}
                      onChange={(e) => {
                        setCurrentDate(e.target.value);
                        setIsDropdownOpen(false);
                        setShowCalendar(false);
                      }}
                      className="w-full bg-surface-container-low text-on-surface font-body text-xs rounded-none py-2 px-2 border border-outline focus:border-primary focus:ring-0 transition-all"
                    />
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
        <div className={`flex-1 flex flex-col mt-28 px-8 ${activeTab === 'settings' ? 'overflow-y-auto no-scrollbar' : 'overflow-hidden'}`}>
          <div className={`max-w-6xl mx-auto w-full ${activeTab === 'settings' ? '' : 'h-full flex flex-col flex-1 min-h-0'} gap-6 pb-10 lg:pb-6`}>
            
            {activeTab === 'main' ? (
              <>
                <Dashboard 
                  nutrients={trackedNutrients} 
                  onMacroClick={setSelectedMacroId}
                  selectedMacroId={selectedMacroId}
                />

                {/* Food Entry Panel */}
                <div className="shrink-0 bg-surface-container rounded-none p-6 border border-outline">
                  <div className="flex flex-col gap-4">
                    {/* Food Search Input */}
                    <div className="relative">
                      <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                        Add Food
                      </label>
                      <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" />
                        <input 
                          value={foodSearchQuery}
                          onChange={(e) => setFoodSearchQuery(e.target.value)}
                          className="w-full bg-surface-container-low text-on-surface py-4 pl-12 pr-6 border border-outline focus:border-primary focus:ring-0 transition-all placeholder:text-on-surface-variant/40 font-body text-sm tracking-wide rounded-none" 
                          placeholder="Type food name..." 
                          type="text"
                        />
                        
                        {/* Dropdown */}
                        {matchingFoods.length > 0 && foodSearchQuery && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline shadow-lg z-10 max-h-48 overflow-y-auto">
                            {matchingFoods.map((food) => (
                              <button
                                key={food.id}
                                onClick={() => handleSelectFoodForEntry(food)}
                                className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-outline last:border-b-0 flex items-center gap-3 group"
                              >
                                <img
                                  src={food.image}
                                  alt={food.name}
                                  className="w-8 h-8 object-cover border border-outline"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-body text-on-surface text-sm font-bold uppercase tracking-[0.5px] truncate">
                                    {food.name}
                                  </p>
                                  <p className="text-[9px] text-on-surface-variant uppercase tracking-[0.5px]">
                                    {`${food.serving_size || 1} ${food.measurement_unit || 'g'}`}
                                  </p>
                                </div>
                                <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Foods */}
                    {selectedFoodsForEntry.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-outline">
                        {selectedFoodsForEntry.map((food, index) => {
                          const foodData = foodDatabase.find(f => f.id === selectedFoodsForEntry[index].foodId);
                          return (
                            <div key={index} className="bg-surface rounded-none border border-outline p-3 flex flex-col gap-3">
                              <div className="flex justify-between items-start">
                                <label className="text-[9px] font-black uppercase tracking-[1px] text-on-surface-variant">
                                  {food.foodName}
                                </label>
                                <button
                                  onClick={() => handleRemoveSelectedFood(index)}
                                  className="text-on-surface-variant hover:text-primary transition-all p-1"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={food.amount}
                                  onChange={(e) => handleAmountChange(index, e.target.value)}
                                  className="flex-1 bg-surface-container-low text-on-surface font-headline text-sm rounded-none py-2 px-2 border border-outline focus:border-primary focus:ring-0 transition-all"
                                  placeholder="0"
                                />
                                <select
                                  value={food.units}
                                  onChange={(e) => {
                                    const updated = [...selectedFoodsForEntry];
                                    updated[index].units = e.target.value;
                                    setSelectedFoodsForEntry(updated);
                                  }}
                                  className="w-20 bg-surface-container-low text-on-surface font-body text-xs rounded-none py-2 px-2 border border-outline focus:border-primary focus:ring-0 transition-all"
                                >
                                  {foodData && (
                                    <>
                                      <option value={foodData.measurement_unit}>{foodData.measurement_unit}</option>
                                      <option value="servings">servings</option>
                                    </>
                                  )}
                                </select>
                              </div>
                              <input
                                type="date"
                                value={food.eatenOnDate}
                                onChange={(e) => {
                                  const updated = [...selectedFoodsForEntry];
                                  updated[index].eatenOnDate = e.target.value;
                                  setSelectedFoodsForEntry(updated);
                                }}
                                className="w-full bg-surface-container-low text-on-surface font-body text-xs rounded-none py-2 px-2 border border-outline focus:border-primary focus:ring-0 transition-all"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-outline">
                      <button
                        onClick={() => setIsFoodProfileModalOpen(true)}
                        className="shrink-0 bg-surface border border-outline text-on-surface px-6 py-3 font-headline text-xs uppercase tracking-[2px] transition-all hover:bg-surface-container-high active:scale-[0.98] flex items-center gap-2 rounded-none"
                      >
                        <Plus size={16} />
                        Create Food
                      </button>
                      {selectedFoodsForEntry.length > 0 && (
                        <button
                          onClick={handleCommitFoodEntry}
                          className="flex-1 bg-primary text-on-primary px-6 py-3 font-headline text-xs uppercase tracking-[2px] transition-all hover:shadow-[0_0_20px_rgba(185,151,91,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 rounded-none"
                        >
                          <Check size={16} />
                          Commit Entry
                        </button>
                      )}
                    </div>
                  </div>
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
          </>
        )}
      </main>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <AddFoodModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        foodDatabase={foodDatabase}
        onCreateProfile={() => {
          setIsAddModalOpen(false);
          setIsFoodProfileModalOpen(true);
        }}
        onAddFood={handleAddFood}
        measurementUnits={measurementUnits}
      />

      <FoodProfileModal
        isOpen={isFoodProfileModalOpen}
        onClose={() => setIsFoodProfileModalOpen(false)}
        onSaveFood={async (food) => {
          await handleCreateFoodProfile(food);
        }}
        trackedNutrients={config.trackedNutrients}
        measurementUnits={measurementUnits}
      />

      {selectedMacroId && (
        <FoodSourcePane
          isOpen={!!selectedMacroId}
          onClose={() => setSelectedMacroId(null)}
          macroId={selectedMacroId}
          macroName={trackedNutrients.find(n => n.id === selectedMacroId)?.name || ''}
          macroUnit={trackedNutrients.find(n => n.id === selectedMacroId)?.unit || ''}
          macroValue={trackedNutrients.find(n => n.id === selectedMacroId)?.value || 0}
          macroGoal={trackedNutrients.find(n => n.id === selectedMacroId)?.goal || 0}
          foods={stats.foods || []}
        />
      )}
        </div>
      )}
    </>
  );
  // );
}
