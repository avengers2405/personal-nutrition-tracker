import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AddNutrientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nutrient: { name: string; goal: number; unit: string; visible: boolean }) => void;
  measurementUnits: string[];
}

export default function AddNutrientModal({
  isOpen,
  onClose,
  onSave,
  measurementUnits,
}: AddNutrientModalProps) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [unit, setUnit] = useState('g');

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a nutrient name');
      return;
    }

    const numGoal = Number(goal);
    if (isNaN(numGoal) || numGoal < 0) {
      alert('Please enter a positive number for the nutrient goal');
      return;
    }

    onSave({
      name: name.trim(),
      goal: numGoal,
      unit: unit || (measurementUnits[0] || 'g'),
      visible: true
    });
    
    // Reset form
    setName('');
    setGoal('');
    setUnit(measurementUnits[0] || 'g');
    onClose();
  };

  const handleClose = () => {
    const hasUnsavedChanges = name.trim() !== '' || goal.trim() !== '' || (unit !== 'g' && unit !== measurementUnits[0]);
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setName('');
        setGoal('');
        setUnit(measurementUnits[0] || 'g');
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
  }, [isOpen, name, goal, unit, measurementUnits]);

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
                Add Nutrient
              </h2>
              <button
                onClick={handleClose}
                className="text-on-surface-variant hover:text-primary transition-all p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-8 flex-1 overflow-y-auto pb-10 no-scrollbar mt-6">
              {/* Nutrient Name */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Nutrient Name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                  placeholder="e.g., Protein, Vitamin C, etc."
                  type="text"
                />
              </div>

              {/* Goal */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Daily Goal
                </label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                  placeholder="Enter positive integer"
                  type="text"
                />
              </div>

              {/* Unit */}
              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Measurement Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                >
                  {measurementUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  {measurementUnits.length === 0 && (
                    <option value="g">g</option>
                  )}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-surface border-t border-outline">
              <button
                onClick={handleSubmit}
                className="w-full bg-primary text-on-primary px-10 py-4 font-headline text-sm uppercase tracking-[3px] transition-all hover:shadow-[0_0_20px_rgba(185,151,91,0.4)] active:scale-[0.99] flex items-center justify-center space-x-3"
              >
                <span>Save Nutrient</span>
                <Check size={20} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}