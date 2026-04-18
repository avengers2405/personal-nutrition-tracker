import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Plus, Check } from 'lucide-react';
import { useState, useMemo } from 'react';
import { FoodItem } from '../types';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodDatabase: FoodItem[];
  onCreateProfile: () => void;
  onAddFood: (foodId: string, amount: number, units: string) => void;
}

interface SelectedFood {
  foodId: string;
  foodName: string;
  amount: string;
  units: string;
}

export default function AddFoodModal({
  isOpen,
  onClose,
  foodDatabase,
  onCreateProfile,
  onAddFood,
}: AddFoodModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);

  const matchingFoods = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return foodDatabase.filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, foodDatabase]);

  const handleSelectFood = (food: FoodItem) => {
    const newFood: SelectedFood = {
      foodId: food.id,
      foodName: food.name,
      amount: '1',
      units: food.serving.split('(')[0].trim(),
    };
    setSelectedFoods([...selectedFoods, newFood]);
    setSearchQuery('');
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const handleAmountChange = (index: number, amount: string) => {
    const updated = [...selectedFoods];
    updated[index].amount = amount;
    setSelectedFoods(updated);
  };

  const handleCommit = () => {
    selectedFoods.forEach(food => {
      const amount = parseFloat(food.amount) || 0;
      if (amount > 0) {
        onAddFood(food.foodId, amount, food.units);
      }
    });
    setSelectedFoods([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative bg-surface w-full max-w-2xl mx-auto rounded-none border-t border-primary shadow-none flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-outline">
              <h2 className="font-headline text-2xl font-normal text-on-surface uppercase tracking-[2px]">
                Add Food
              </h2>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-all p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-8 flex-1 overflow-y-auto pb-10 no-scrollbar mt-6">
              {/* Search Section */}
              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Search Food
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 pl-12 pr-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                    placeholder="Search for a food..."
                    type="text"
                  />

                  {/* Dropdown */}
                  {matchingFoods.length > 0 && searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-surface-container border border-outline shadow-lg z-10 max-h-64 overflow-y-auto"
                    >
                      {matchingFoods.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => handleSelectFood(food)}
                          className="w-full text-left px-4 py-3 hover:bg-surface-container-high transition-colors border-b border-outline last:border-b-0 flex items-center gap-3 group"
                        >
                          <img
                            src={food.image}
                            alt={food.name}
                            className="w-10 h-10 object-cover border border-outline"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-on-surface text-sm font-bold uppercase tracking-[0.5px] truncate">
                              {food.name}
                            </p>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.5px]">
                              {food.serving}
                            </p>
                          </div>
                          <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Selected Foods */}
              {selectedFoods.length > 0 && (
                <div className="mb-8">
                  <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                    Foods to Add
                  </label>
                  <div className="space-y-4">
                    {selectedFoods.map((food, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface-container rounded-none border border-outline p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-body text-on-surface text-sm font-bold uppercase tracking-[0.5px]">
                            {food.foodName}
                          </h3>
                          <button
                            onClick={() => handleRemoveFood(index)}
                            className="text-on-surface-variant hover:text-primary transition-all p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="block text-[9px] font-black uppercase tracking-[1px] text-on-surface-variant mb-2">
                              Amount
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={food.amount}
                              onChange={(e) => handleAmountChange(index, e.target.value)}
                              className="w-full bg-surface-container-low text-on-surface font-headline text-lg rounded-none py-2 px-3 border border-outline focus:border-primary focus:ring-0 transition-all"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[9px] font-black uppercase tracking-[1px] text-on-surface-variant mb-2">
                              Units
                            </label>
                            <input
                              type="text"
                              value={food.units}
                              onChange={(e) => {
                                const updated = [...selectedFoods];
                                updated[index].units = e.target.value;
                                setSelectedFoods(updated);
                              }}
                              className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-none py-2 px-3 border border-outline focus:border-primary focus:ring-0 transition-all"
                              placeholder="units"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFoods.length === 0 && searchQuery === '' && (
                <div className="py-12 text-center">
                  <p className="text-on-surface-variant text-sm uppercase tracking-[1px]">
                    Search for a food to add
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-surface border-t border-outline flex gap-4">
              <button
                onClick={onCreateProfile}
                className="flex-shrink-0 bg-surface-container border border-outline text-on-surface px-6 py-4 font-headline text-sm uppercase tracking-[2px] transition-all hover:bg-surface-container-high active:scale-[0.98] flex items-center gap-2"
              >
                <Plus size={18} />
                Create Food
              </button>
              <button
                onClick={handleCommit}
                disabled={selectedFoods.length === 0}
                className="flex-1 bg-primary text-on-primary px-10 py-4 font-headline text-sm uppercase tracking-[3px] transition-all hover:shadow-[0_0_20px_rgba(185,151,91,0.4)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                <span>Commit Entries</span>
                <Check size={20} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
