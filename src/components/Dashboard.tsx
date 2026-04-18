import { motion } from 'motion/react';
import { TrackedNutrient } from '../types';

interface DashboardProps {
  nutrients: TrackedNutrient[];
}

export default function Dashboard({ nutrients }: DashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 flex-shrink-0 mb-8">
      {nutrients.map((n, i) => (
        <motion.div 
          key={n.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-surface-container rounded-none p-6 border border-outline shadow-none flex flex-col justify-center"
        >
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="font-body text-on-secondary text-[11px] uppercase tracking-[1px] font-medium">{n.name}</h3>
            <span className="text-on-surface text-lg font-headline">{n.value} <span className="text-[10px] text-on-surface-variant font-body">{n.unit}</span></span>
          </div>
          
          <div className="w-full h-[6px] bg-surface-container-highest border border-outline rounded-none overflow-hidden mt-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((n.value / n.goal) * 100, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-primary"
            />
          </div>
          <div className="mt-2 text-[10px] text-on-surface-variant uppercase tracking-[1px]">
            Target: {n.goal}{n.unit}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
