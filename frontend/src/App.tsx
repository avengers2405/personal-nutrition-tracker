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
import { fetchAllMacros, fetchAllFoods, checkBackendHealth, fetchMeasurementUnits, createFood } from './services/api';

const DEFAULT_CONFIG: UserConfig = {
  trackedNutrients: []
};

const SAMPLE_FOOD_DATABASE: FoodItem[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [dailyLogs, setDailyLogs] = useState<DailyStats[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState('2026-04-18');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFoodProfileModalOpen, setIsFoodProfileModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFoodsForEntry, setSelectedFoodsForEntry] = useState<{ foodId: string; foodName: string; amount: string; units: string }[]>([]);
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
        const foodItems: FoodItem[] = foods.map((food: any) => ({
          id: food.id.toString(),
          name: food.name,
          serving: `${food.serving_size || 1} ${food.measurement_unit}`,
          image: `https://picsum.photos/seed/${food.name.toLowerCase().replace(/\s+/g, '-')}/200/200`,
          nutrients: {} // Nutrients will be fetched separately if needed
        }));
        
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
              serving: `${food.serving_size || 1} ${food.measurement_unit}`,
              image: `https://picsum.photos/seed/${food.name.toLowerCase().replace(/\s+/g, '-')}/200/200`,
              nutrients: {}
            }));
            
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

  const stats = dailyLogs.find(log => log.date === currentDate) || { date: currentDate, nutrients: {}, foods: [] };
  
  const trackedNutrients: TrackedNutrient[] = config.trackedNutrients
    .filter(n => n.visible !== false)
    .map(n => ({
      ...n,
      value: stats.nutrients[n.id] || 0
    }));

  const handleAddFood = (foodId: string, amount: number, units: string) => {
    const food = foodDatabase.find(f => f.id === foodId);
    if (!food) return;

    const consumedFood: ConsumedFood = {
      foodId: food.id,
      foodName: food.name,
      serving: `${amount} ${units}`,
      image: food.image,
      nutrients: food.nutrients,
    };

    setDailyLogs(prevLogs => {
      const logIndex = prevLogs.findIndex(log => log.date === currentDate);
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
          date: currentDate,
          foods: [consumedFood],
          nutrients: { ...food.nutrients },
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
      
      // serving comes formatted as `${servingAmount} ${measurementUnit}` from the modal
      // We need to parse it back
      const parts = newFood.serving.split(' ');
      const servingAmountStr = parts[0];
      const measurementUnitStr = parts.slice(1).join(' ');
      
      const servingAmount = parseFloat(servingAmountStr);
      
      await createFood(
        newFood.name,
        measurementUnitStr || 'g',
        isNaN(servingAmount) ? 100 : servingAmount,
        newFood.nutrients
      );
      
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
          serving: `${food.serving_size || 1} ${food.measurement_unit}`,
          image: `https://picsum.photos/seed/${food.name.toLowerCase().replace(/\s+/g, '-')}/200/200`,
          nutrients: {}
        }));
        
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
      units: food.serving.split('(')[0].trim(),
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

  const handleCommitFoodEntry = () => {
    selectedFoodsForEntry.forEach(food => {
      const amount = parseFloat(food.amount) || 0;
      if (amount > 0) {
        handleAddFood(food.foodId, amount, food.units);
      }
    });
    setSelectedFoodsForEntry([]);
    setFoodSearchQuery('');
  };

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
                <div className="flex-shrink-0 bg-surface-container rounded-none p-6 border border-outline">
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
                                    {food.serving}
                                  </p>
                                </div>
                                <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Foods */}
                    {selectedFoodsForEntry.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-outline">
                        {selectedFoodsForEntry.map((food, index) => (
                          <div key={index} className="bg-surface rounded-none border border-outline p-3 flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="block text-[9px] font-black uppercase tracking-[1px] text-on-surface-variant mb-1">
                                {food.foodName}
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="0.1"
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
                                  {measurementUnits.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                  {measurementUnits.length === 0 && (
                                    <option value={food.units}>{food.units || 'g'}</option>
                                  )}
                                </select>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveSelectedFood(index)}
                              className="text-on-surface-variant hover:text-primary transition-all p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-outline">
                      <button
                        onClick={() => setIsFoodProfileModalOpen(true)}
                        className="flex-shrink-0 bg-surface border border-outline text-on-surface px-6 py-3 font-headline text-xs uppercase tracking-[2px] transition-all hover:bg-surface-container-high active:scale-[0.98] flex items-center gap-2 rounded-none"
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
        onCreateFood={handleCreateFoodProfile}
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
