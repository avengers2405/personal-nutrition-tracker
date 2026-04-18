import { motion } from 'motion/react';
import { TrackedNutrient } from '../types';

interface DashboardProps {
  nutrients: TrackedNutrient[];
  onMacroClick?: (macroId: string) => void;
  selectedMacroId?: string | null;
}

export default function Dashboard({ nutrients, onMacroClick, selectedMacroId }: DashboardProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-hidden border border-outline bg-surface-container flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-outline bg-surface-container-high px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-body text-on-secondary text-[11px] uppercase tracking-[1px] font-medium">Nutrient</h3>
          </div>
          <div className="w-24 text-right">
            <h3 className="font-body text-on-secondary text-[11px] uppercase tracking-[1px] font-medium">Current</h3>
          </div>
          <div className="w-24 text-right">
            <h3 className="font-body text-on-secondary text-[11px] uppercase tracking-[1px] font-medium">Target</h3>
          </div>
          <div className="w-32">
            <h3 className="font-body text-on-secondary text-[11px] uppercase tracking-[1px] font-medium">Progress</h3>
          </div>
        </div>

        {/* Body - distributes remaining space */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {nutrients.map((n, i) => {
            const percentage = Math.min((n.value / n.goal) * 100, 100);
            const isSelected = selectedMacroId === n.id;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onMacroClick?.(n.id)}
                className={`flex-1 border-b border-outline transition-colors px-6 py-4 flex items-center gap-4 min-h-0 cursor-pointer ${
                  isSelected 
                    ? 'bg-primary/20 hover:bg-primary/25' 
                    : 'hover:bg-surface-container-high/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-body text-on-surface text-sm uppercase tracking-[1px]">{n.name}</span>
                </div>
                <div className="w-24 text-right flex-shrink-0">
                  <span className="font-headline text-on-surface">
                    {n.value} <span className="text-[10px] text-on-surface-variant font-body">{n.unit}</span>
                  </span>
                </div>
                <div className="w-24 text-right flex-shrink-0">
                  <span className="font-body text-on-surface-variant text-sm">
                    {n.goal}{n.unit}
                  </span>
                </div>
                <div className="w-32 flex-shrink-0">
                  <div className="w-full h-[8px] bg-surface-container-highest border border-outline rounded-none overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <div className="text-right text-[10px] text-on-surface-variant uppercase tracking-[1px] mt-1">
                    {Math.round(percentage)}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
