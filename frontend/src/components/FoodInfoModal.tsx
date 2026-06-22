import { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodItem, TrackedNutrient } from '../types';

interface FoodInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  food: FoodItem | null;
  trackedNutrients: TrackedNutrient[];
}

export default function FoodInfoModal({ isOpen, onClose, onBack, food, trackedNutrients }: FoodInfoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onBack) onBack();
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onBack]);

  if (!isOpen || !food) return null;

  const imgUrl = food.image || `https://picsum.photos/seed/${food.name.toLowerCase().replace(/\s+/g, '-')}/200/200`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
              <div className="flex items-center gap-4">
                {onBack && (
                  <button onClick={onBack} className="text-on-surface-variant hover:text-primary transition-all p-2">
                    <ArrowLeft size={24} />
                  </button>
                )}
                <h2 className="font-headline text-2xl font-normal text-on-surface uppercase tracking-[2px]">
                  Food Information
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-all p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-8 flex-1 overflow-y-auto pb-10 no-scrollbar mt-6 space-y-8">
              {/* Info Header */}
              <div className="flex items-start gap-6 border border-outline p-6 bg-surface-container-low">
                <img src={imgUrl} alt={food.name} className="w-24 h-24 object-cover border border-outline opacity-80" />
                <div>
                  <h3 className="font-headline text-xl text-on-surface mb-2">{food.name}</h3>
                  <p className="text-xs text-on-surface-variant uppercase tracking-[1px]">
                    Serving Size: {food.serving_size || 1} {food.measurement_unit || 'g'}
                  </p>
                </div>
              </div>

              {/* Nutrients */}
              <div>
                <h4 className="font-headline text-sm text-on-surface uppercase tracking-[2px] mb-4">Nutrients Per Serving</h4>
                <div className="space-y-4">
                  {trackedNutrients.map((nutrient) => {
                    const val = food.nutrients[nutrient.id];
                    const displayVal = val != null ? val : 0;
                    return (
                      <div key={nutrient.id} className="bg-surface-container rounded-none border border-outline p-4 flex justify-between items-center">
                        <span className="text-[11px] font-black uppercase tracking-[1px] text-on-surface-variant">
                          {nutrient.name}
                        </span>
                        <div className="flex items-end gap-2">
                          <span className="font-headline text-lg text-on-surface">{displayVal}</span>
                          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[1px] mb-1">
                            {nutrient.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
