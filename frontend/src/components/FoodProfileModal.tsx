import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FoodItem } from '../types';

interface FoodProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFood: (food: FoodItem) => void;
  trackedNutrients: { id: string; name: string; goal: number; unit: string }[];
}

export default function FoodProfileModal({
  isOpen,
  onClose,
  onCreateFood,
  trackedNutrients,
}: FoodProfileModalProps) {
  const [foodName, setFoodName] = useState('');
  const [serving, setServing] = useState('');
  const [image, setImage] = useState('');
  const [nutrients, setNutrients] = useState<{ [id: string]: number }>({});

  const handleNutrientChange = (nutrientId: string, value: string) => {
    setNutrients({
      ...nutrients,
      [nutrientId]: parseFloat(value) || 0,
    });
  };

  const handleSubmit = () => {
    if (!foodName.trim() || !serving.trim()) {
      alert('Please fill in food name and serving');
      return;
    }

    // Validate all nutrients are positive integers
    for (const [nutrientId, value] of Object.entries(nutrients)) {
      const numValue = parseFloat(value as string);
      if (!isNaN(numValue) && (numValue < 0 || !Number.isInteger(numValue))) {
        alert('Please enter only positive integers for nutrient values');
        return;
      }
    }

    const newFood: FoodItem = {
      id: `f-${Date.now()}`,
      name: foodName,
      serving,
      image: image || 'https://picsum.photos/seed/food/200/200',
      nutrients,
    };

    onCreateFood(newFood);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFoodName('');
    setServing('');
    setImage('');
    setNutrients({});
  };

  const handleClose = () => {
    const hasUnsavedChanges = foodName.trim() !== '' || serving.trim() !== '' || image.trim() !== '' || Object.keys(nutrients).length > 0;
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        resetForm();
        onClose();
      }
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, foodName, serving, image, nutrients]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                Create Food Profile
              </h2>
              <button
                onClick={handleClose}
                className="text-on-surface-variant hover:text-primary transition-all p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-8 flex-1 overflow-y-auto pb-10 no-scrollbar mt-6">
              {/* Food Name */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Food Name
                </label>
                <input
                  autoFocus
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                  placeholder="e.g., Chicken Breast, Brown Rice, etc."
                  type="text"
                />
              </div>

              {/* Serving Size */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Serving Size
                </label>
                <input
                  value={serving}
                  onChange={(e) => setServing(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                  placeholder="e.g., 100g, 1 cup, 1 medium, etc."
                  type="text"
                />
              </div>

              {/* Image URL */}
              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Image URL (optional)
                </label>
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                  placeholder="https://..."
                  type="text"
                />
              </div>

              {/* Nutrients */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-4">
                  Nutrients Per Serving
                </label>
                <div className="space-y-4">
                  {trackedNutrients.map((nutrient) => (
                    <motion.div
                      key={nutrient.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface-container rounded-none border border-outline p-4"
                    >
                      <label className="block text-[10px] font-black uppercase tracking-[1px] text-on-surface-variant mb-2">
                        {nutrient.name}
                      </label>
                      <div className="flex gap-2 items-end">
                        <input
                          type="text"
                          value={nutrients[nutrient.id] || ''}
                          onChange={(e) => handleNutrientChange(nutrient.id, e.target.value)}
                          className="flex-1 bg-surface-container-low text-on-surface font-headline text-lg rounded-none py-2 px-3 border border-outline focus:border-primary focus:ring-0 transition-all"
                          placeholder="0"
                        />
                        <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[1px] min-w-fit">
                          {nutrient.unit}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-surface border-t border-outline">
              <button
                onClick={handleSubmit}
                className="w-full bg-primary text-on-primary px-10 py-4 font-headline text-sm uppercase tracking-[3px] transition-all hover:shadow-[0_0_20px_rgba(185,151,91,0.4)] active:scale-[0.99] flex items-center justify-center space-x-3"
              >
                <span>Create Food Profile</span>
                <Check size={20} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
