import { useState, useEffect } from 'react';
import { FoodItem, UserConfig } from '../types';
import { Plus, Trash2, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { fetchMeasurementUnits, createMacro, updateMacro, deleteMacro, createFood, updateFood, deleteFood } from '../services/api';
import FoodProfileModal from './FoodProfileModal';
import AddNutrientModal from './AddNutrientModal';

interface SettingsProps {
  config: UserConfig;
  setConfig: (config: UserConfig) => void;
  foodDatabase: FoodItem[];
  setFoodDatabase: (db: FoodItem[]) => void;
}

export default function Settings({ config, setConfig, foodDatabase, setFoodDatabase }: SettingsProps) {
  const [editingNutrient, setEditingNutrient] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<string | null>(null);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isNutrientModalOpen, setIsNutrientModalOpen] = useState(false);
  const [measurementUnits, setMeasurementUnits] = useState<string[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  useEffect(() => {
    const loadMeasurementUnits = async () => {
      try {
        const units = await fetchMeasurementUnits();
        setMeasurementUnits(units);
      } catch (error) {
        console.error('Error fetching measurement units:', error);
        setMeasurementUnits(['g']); // Fallback to default
      } finally {
        setLoadingUnits(false);
      }
    };

    loadMeasurementUnits();
  }, []);

  const addNutrient = () => {
    setIsNutrientModalOpen(true);
  };

  const handleCreateNutrientFromModal = async (nutrientData: { name: string; goal: number; unit: string; visible: boolean }) => {
    try {
      console.log('[Settings] Creating new macro with params:', {
        name: nutrientData.name,
        target: nutrientData.goal,
        measurementUnit: nutrientData.unit,
        homeDisplay: nutrientData.visible
      });
      const response = await createMacro(nutrientData.name, nutrientData.goal, nutrientData.unit, nutrientData.visible);
      const createdMacro = response.data[0] || response.data;
      
      const newNutrient = {
        id: createdMacro.id.toString(),
        name: nutrientData.name,
        goal: nutrientData.goal,
        unit: nutrientData.unit,
        visible: nutrientData.visible
      };

      setConfig({
        ...config,
        trackedNutrients: [...config.trackedNutrients, newNutrient]
      });
    } catch (error) {
      console.error('Error creating nutrient:', error);
    }
  };

  const removeNutrient = async (id: string) => {
    try {
      // Only delete from DB if it's not a new unsaved nutrient
      if (!id.startsWith('new-')) {
        await deleteMacro(id);
      }
      setConfig({
        ...config,
        trackedNutrients: config.trackedNutrients.filter(n => n.id !== id)
      });
    } catch (error) {
      console.error('Error removing nutrient:', error);
    }
  };

  const updateNutrient = (id: string, updates: Partial<UserConfig['trackedNutrients'][0]>) => {
    // Only update local state, don't persist to database yet
    setConfig({
      ...config,
      trackedNutrients: config.trackedNutrients.map(n => n.id === id ? { ...n, ...updates } : n)
    });
  };

  const saveNutrient = async (id: string) => {
    try {
      const nutrient = config.trackedNutrients.find(n => n.id === id);
      if (!nutrient || !nutrient.name) return;

      // Validate goal is a positive number
      const goalValue = Number(nutrient.goal);
      if (isNaN(goalValue) || goalValue < 0) {
        alert('Please enter a positive number for the nutrient goal');
        return;
      }

      console.log('[Settings] Saving nutrient:', { id, nutrient });

      // If it's a new nutrient (ID starts with 'new-'), create it in the database
      if (id.startsWith('new-')) {
        console.log('[Settings] Creating new macro with params:', {
          name: nutrient.name,
          target: goalValue,
          measurementUnit: nutrient.unit,
          homeDisplay: nutrient.visible
        });
        const response = await createMacro(nutrient.name, goalValue, nutrient.unit, nutrient.visible);
        const createdMacro = response.data[0] || response.data;
        const dbId = createdMacro.id.toString();
        // Update the nutrient with the real DB ID
        setConfig({
          ...config,
          trackedNutrients: config.trackedNutrients.map(n => n.id === id ? { ...n, id: dbId, goal: goalValue } : n)
        });
      } else {
        // Update existing nutrient
        console.log('[Settings] Updating existing macro with params:', {
          name: nutrient.name,
          target: goalValue,
          measurementUnit: nutrient.unit,
          homeDisplay: nutrient.visible
        });
        await updateMacro(id, nutrient.name, goalValue, nutrient.unit, nutrient.visible);
      }
      setEditingNutrient(null);
    } catch (error) {
      console.error('Error saving nutrient:', error);
    }
  };

  const toggleNutrientVisibility = async (id: string, currentVisibility: boolean) => {
    // Update local state
    updateNutrient(id, { visible: !currentVisibility });
    
    // If it's an existing nutrient (not new), save to database immediately
    if (!id.startsWith('new-')) {
      try {
        const nutrient = config.trackedNutrients.find(n => n.id === id);
        if (nutrient) {
          console.log('[Settings] Toggling visibility for existing nutrient:', { id, newVisibility: !currentVisibility });
          await updateMacro(id, nutrient.name, nutrient.goal, nutrient.unit, !currentVisibility);
        }
      } catch (error) {
        console.error('Error toggling nutrient visibility:', error);
      }
    }
  };

  const addFood = () => {
    setEditingFood(null);
    setIsFoodModalOpen(true);
  };

  const removeFood = async (id: string) => {
    try {
      await deleteFood(id);
      setFoodDatabase(foodDatabase.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting food:', error);
      alert('Failed to delete food');
    }
  };

  const saveFoodNutrients = async (food: FoodItem) => {
    console.log("SAVE FOOD TRIGGERED");
    // Validate all nutrients are positive numbers
    for (const [nutrientId, value] of Object.entries(food.nutrients)) {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        alert('Please enter only positive numbers for nutrient values');
        return false;
      }
    }
    try {
      // Just sending nutrients updates for now along with base details essentially
      await updateFood(food.id, {
        nutrients: food.nutrients
      });
      setEditingFood(null);
      return true;
    } catch (error) {
      console.error('Error updating food:', error);
      alert('Failed to update food');
      return false;
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Tracked Nutrients Section */}
      <section className="bg-surface-container border border-outline p-8">
        <div className="flex justify-between items-center mb-8 border-b border-outline pb-4">
          <h2 className="font-headline text-2xl uppercase tracking-[2px]">Tracked Nutrients</h2>
          <button 
            onClick={addNutrient}
            className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-[2px] hover:bg-primary/10 px-4 py-2 border border-primary/30 transition-all"
          >
            <Plus size={16} /> Add Nutrient
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.trackedNutrients.map(n => (
            <div key={n.id} className="bg-surface-container-low border border-outline p-4 flex justify-between items-center group">
              {editingNutrient === n.id ? (
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input 
                    className="bg-surface border border-outline text-on-surface p-2 text-xs" 
                    placeholder="Nutrient name"
                    value={n.name} 
                    onChange={e => updateNutrient(n.id, { name: e.target.value })}
                  />
                  <input 
                    className="bg-surface border border-outline text-on-surface p-2 text-xs" 
                    type="text" 
                    placeholder="Enter value"
                    value={n.goal} 
                    onChange={e => updateNutrient(n.id, { goal: e.target.value as any })}
                  />
                  <div className="flex gap-1">
                    <select 
                      className="bg-surface border border-outline text-on-surface p-2 text-xs w-16"
                      value={n.unit}
                      onChange={e => updateNutrient(n.id, { unit: e.target.value })}
                      disabled={loadingUnits}
                    >
                      {measurementUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <button onClick={() => saveNutrient(n.id)} className="p-2 text-primary hover:bg-primary/10"><Save size={14}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="font-body text-sm font-bold uppercase tracking-[1px] text-on-surface">{n.name}</span>
                    <span className="text-[10px] text-on-surface-variant block uppercase opacity-60">Target: {n.goal}{n.unit}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleNutrientVisibility(n.id, n.visible ?? true)}
                      className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                      title={n.visible ? 'Hide from home page' : 'Show on home page'}
                    >
                      {n.visible ? <Eye size={16}/> : <EyeOff size={16}/>}
                    </button>
                    <button onClick={() => setEditingNutrient(n.id)} className="p-2 text-on-surface-variant hover:text-primary"><Edit2 size={16}/></button>
                    <button onClick={() => removeNutrient(n.id)} className="p-2 text-on-surface-variant hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Food Database Section */}
      <section className="bg-surface-container border border-outline p-8">
        <div className="flex justify-between items-center mb-8 border-b border-outline pb-4">
          <h2 className="font-headline text-2xl uppercase tracking-[2px]">Food Catalog</h2>
          <button 
            onClick={addFood}
            className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-[2px] hover:bg-primary/10 px-4 py-2 border border-primary/30 transition-all"
          >
            <Plus size={16} /> Add Food Instrument
          </button>
        </div>

        <div className="space-y-4">
          {foodDatabase.map(food => (
            <div key={food.id} className="bg-surface-container-low border border-outline p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <img src={food.image} className="w-16 h-16 object-cover border border-outline opacity-70" alt={food.name} referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="font-headline text-lg text-on-surface">{food.name}</h3>
                    <p className="text-[11px] text-on-surface-variant uppercase tracking-[1px] opacity-60">{`${food.serving_size || 1} ${food.measurement_unit}`}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                        setEditingFood(food.id);
                        setIsFoodModalOpen(true);
                    }} 
                    className="p-2 transition-all text-on-surface-variant hover:text-primary"
                  >
                    <Edit2 size={18}/>
                  </button>
                  <button onClick={() => removeFood(food.id)} className="p-2 text-on-surface-variant hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FoodProfileModal 
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        trackedNutrients={config.trackedNutrients}
        measurementUnits={measurementUnits}
        initialFood={editingFood ? foodDatabase.find(f => f.id === editingFood) : null}
        onSaveFood={async (food, isEditing) => {
          try {
            const servingAmount = Number(food.serving_size) || 1;
            const measurementUnitStr = food.measurement_unit || 'g';
            
            if (isEditing && editingFood) {
                const response = await updateFood(editingFood, {
                    name: food.name,
                    measurementUnit: measurementUnitStr,
                    servingSize: servingAmount,
                    nutrients: food.nutrients
                });
                const updatedFood = { ...food, id: editingFood };
                setFoodDatabase(foodDatabase.map(f => f.id === editingFood ? updatedFood : f));
            } else {
                const response = await createFood({
                    name: food.name,
                    measurementUnit: measurementUnitStr,
                    servingSize: servingAmount,
                    nutrients: food.nutrients
                });
                const createdFood = { ...food, id: response.data.id.toString() };
                setFoodDatabase([...foodDatabase, createdFood]);
            }
          } catch (error) {
            console.error('Error saving food:', error);
            alert('Failed to save food to database.');
          }
        }}
      />

      <AddNutrientModal
        isOpen={isNutrientModalOpen}
        onClose={() => setIsNutrientModalOpen(false)}
        onSave={handleCreateNutrientFromModal}
        measurementUnits={measurementUnits}
      />
    </div>
  );
}
