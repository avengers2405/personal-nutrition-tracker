import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ConsumedFood } from '../types';

interface FoodSourcePaneProps {
  isOpen: boolean;
  onClose: () => void;
  macroName: string;
  macroUnit: string;
  macroValue: number;
  macroGoal: number;
  macroId: string;
  foods: ConsumedFood[];
}

export default function FoodSourcePane({
  isOpen,
  onClose,
  macroName,
  macroUnit,
  macroValue,
  macroGoal,
  macroId,
  foods,
}: FoodSourcePaneProps) {
  const foodsWithContribution = foods
    .map(food => ({
      ...food,
      contribution: food.nutrients[macroId] || 0,
    }))
    .filter(food => food.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution);

  const percentage = Math.min((macroValue / macroGoal) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-96 bg-surface-container border-l border-outline z-40 flex flex-col overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-outline bg-surface-container-high px-6 py-6 flex justify-between items-start">
              <div>
                <h2 className="font-headline text-xl font-normal text-on-surface uppercase tracking-[2px]">
                  {macroName}
                </h2>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-[1px] mt-2 font-body">
                  Sources for today
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-all p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Macro Summary */}
            <div className="flex-shrink-0 px-6 py-6 border-b border-outline bg-surface">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-body text-on-secondary text-[11px] uppercase tracking-[1px]">
                  Total
                </span>
                <span className="font-headline text-on-surface text-lg">
                  {macroValue} <span className="text-[10px] text-on-surface-variant font-body">{macroUnit}</span>
                </span>
              </div>
              <div className="w-full h-[8px] bg-surface-container-highest border border-outline rounded-none overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="h-full bg-primary"
                />
              </div>
              <div className="mt-2 text-right text-[10px] text-on-surface-variant uppercase tracking-[1px]">
                Target: {macroGoal}{macroUnit}
              </div>
            </div>

            {/* Foods List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {foodsWithContribution.length > 0 ? (
                foodsWithContribution.map((food, i) => {
                  const foodPercentage = Math.min((food.contribution / macroValue) * 100, 100);
                  return (
                    <motion.div
                      key={food.foodId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-surface rounded-none border border-outline p-4 hover:border-primary/50 transition-colors"
                    >
                      {/* Food Image and Name */}
                      <div className="flex gap-4 mb-3">
                        <img
                          src={food.image}
                          alt={food.foodName}
                          className="w-16 h-16 object-cover border border-outline"
                        />
                        <div className="flex-1">
                          <h3 className="font-body text-on-surface text-sm font-bold uppercase tracking-[0.5px]">
                            {food.foodName}
                          </h3>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-[1px] mt-1">
                            {food.serving}
                          </p>
                        </div>
                      </div>

                      {/* Contribution */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-body text-on-surface-variant uppercase tracking-[1px]">
                            Contribution
                          </span>
                          <span className="font-headline text-on-surface">
                            {food.contribution}{macroUnit}
                          </span>
                        </div>
                        <div className="w-full h-[6px] bg-surface-container-highest border border-outline rounded-none overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${foodPercentage}%` }}
                            transition={{ duration: 1, ease: 'easeInOut' }}
                            className="h-full bg-primary/70"
                          />
                        </div>
                        <div className="text-right text-[9px] text-on-surface-variant uppercase tracking-[1px]">
                          {Math.round(foodPercentage)}% of total
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-32 text-on-surface-variant text-sm">
                  No foods contributed to this macro
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
