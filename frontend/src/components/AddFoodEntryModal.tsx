import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FoodItem } from '../types';

interface AddFoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEntry: (foodId: string, amount: number, date: string) => void;
  food: FoodItem | null;
}

export default function AddFoodEntryModal({
  isOpen,
  onClose,
  onSaveEntry,
  food
}: AddFoodEntryModalProps) {
  const [amount, setAmount] = useState('');
  const [dateSelection, setDateSelection] = useState<'today' | 'yesterday' | 'calendar'>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen && food) {
      // Setup initial states when modal opens
      setAmount(String(food.serving_size || '1'));
      setDateSelection('today');
      setCustomDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, food]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!food) return;
    
    let submitDate = new Date().toISOString().split('T')[0];
    if (dateSelection === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      submitDate = y.toISOString().split('T')[0];
    } else if (dateSelection === 'calendar') {
      submitDate = customDate;
    }

    onSaveEntry(food.id, parseFloat(amount) || 1, submitDate);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!food) return null;

  // Compute unit for display like "g" or "ml"
  const unit = food.measurement_unit || 'serving';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-70 flex flex-col justify-end">
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
            className="relative bg-surface w-full max-w-2xl mx-auto rounded-none border-t border-primary shadow-none flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-outline">
              <h2 className="font-headline text-2xl font-normal text-on-surface uppercase tracking-[2px]">
                Log {food.name}
              </h2>
              <button
                onClick={handleClose}
                className="text-on-surface-variant hover:text-primary transition-all p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-8 flex-1 overflow-y-auto pt-6 pb-10 no-scrollbar">
              
              {/* Amount Log */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Amount Consumed ({unit})
                </label>
                <div className="flex items-center gap-4">
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 py-4 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                    type="text"
                  />
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-3">
                  Date Consumed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDateSelection('today')}
                    className={`py-3 px-2 border text-sm font-headline tracking-wider uppercase transition-all ${
                      dateSelection === 'today'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-on-surface hover:border-primary/50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateSelection('yesterday')}
                    className={`py-3 px-2 border text-sm font-headline tracking-wider uppercase transition-all ${
                      dateSelection === 'yesterday'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-on-surface hover:border-primary/50'
                    }`}
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => setDateSelection('calendar')}
                    className={`py-3 px-2 border text-sm font-headline tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                      dateSelection === 'calendar'
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline text-on-surface hover:border-primary/50'
                    }`}
                  >
                    <CalendarIcon size={16} />
                    Date
                  </button>
                </div>
                
                {/* Custom Date Picker Dropdown inline */}
                {dateSelection === 'calendar' && (
                  <div className="mt-4">
                    <input 
                      type="date" 
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface py-3 px-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Sticky Action Footer */}
            <div className="p-8 pt-0 bg-surface">
              <button
                onClick={handleSubmit}
                className="w-full h-14 bg-primary text-on-primary font-headline tracking-[2px] uppercase text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Log Entry
              </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}