import { useState } from 'react';
import { FoodItem, UserConfig } from '../types';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface SettingsProps {
  config: UserConfig;
  setConfig: (config: UserConfig) => void;
  foodDatabase: FoodItem[];
  setFoodDatabase: (db: FoodItem[]) => void;
}

export default function Settings({ config, setConfig, foodDatabase, setFoodDatabase }: SettingsProps) {
  const [editingNutrient, setEditingNutrient] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<string | null>(null);

  const addNutrient = () => {
    const id = `nut-${Date.now()}`;
    setConfig({
      ...config,
      trackedNutrients: [...config.trackedNutrients, { id, name: 'New Nutrient', goal: 0, unit: 'g' }]
    });
    setEditingNutrient(id);
  };

  const removeNutrient = (id: string) => {
    setConfig({
      ...config,
      trackedNutrients: config.trackedNutrients.filter(n => n.id !== id)
    });
  };

  const updateNutrient = (id: string, updates: Partial<UserConfig['trackedNutrients'][0]>) => {
    setConfig({
      ...config,
      trackedNutrients: config.trackedNutrients.map(n => n.id === id ? { ...n, ...updates } : n)
    });
  };

  const addFood = () => {
    const id = `food-${Date.now()}`;
    setFoodDatabase([...foodDatabase, { id, name: 'New Food', serving: '100g', image: 'https://picsum.photos/seed/food/200/200', nutrients: {} }]);
    setEditingFood(id);
  };

  const removeFood = (id: string) => {
    setFoodDatabase(foodDatabase.filter(f => f.id !== id));
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
                    value={n.name} 
                    onChange={e => updateNutrient(n.id, { name: e.target.value })}
                  />
                  <input 
                    className="bg-surface border border-outline text-on-surface p-2 text-xs" 
                    type="number" 
                    value={n.goal} 
                    onChange={e => updateNutrient(n.id, { goal: Number(e.target.value) })}
                  />
                  <div className="flex gap-1">
                    <input 
                      className="bg-surface border border-outline text-on-surface p-2 text-xs w-12" 
                      value={n.unit} 
                      onChange={e => updateNutrient(n.id, { unit: e.target.value })}
                    />
                    <button onClick={() => setEditingNutrient(null)} className="p-2 text-primary hover:bg-primary/10"><Save size={14}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="font-body text-sm font-bold uppercase tracking-[1px] text-on-surface">{n.name}</span>
                    <span className="text-[10px] text-on-surface-variant block uppercase opacity-60">Target: {n.goal}{n.unit}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    {editingFood === food.id ? (
                      <input 
                        className="bg-surface border border-outline text-on-surface p-2 text-sm mb-2" 
                        value={food.name} 
                        onChange={e => setFoodDatabase(foodDatabase.map(f => f.id === food.id ? { ...f, name: e.target.value } : f))}
                      />
                    ) : (
                      <h3 className="font-headline text-lg text-on-surface">{food.name}</h3>
                    )}
                    <p className="text-[11px] text-on-surface-variant uppercase tracking-[1px] opacity-60">{food.serving}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingFood(editingFood === food.id ? null : food.id)} 
                    className={`p-2 transition-all ${editingFood === food.id ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    {editingFood === food.id ? <Save size={18}/> : <Edit2 size={18}/>}
                  </button>
                  <button onClick={() => removeFood(food.id)} className="p-2 text-on-surface-variant hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                </div>
              </div>

              {editingFood === food.id && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 border-t border-outline pt-4">
                  {config.trackedNutrients.map(n => (
                    <div key={n.id} className="space-y-1">
                      <label className="text-[9px] text-on-surface-variant uppercase tracking-[1px]">{n.name} ({n.unit})</label>
                      <input 
                        type="number" 
                        className="w-full bg-surface border border-outline text-on-surface p-2 text-xs" 
                        value={food.nutrients[n.id] || 0}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFoodDatabase(foodDatabase.map(f => f.id === food.id ? { 
                            ...f, 
                            nutrients: { ...f.nutrients, [n.id]: val } 
                          } : f));
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
