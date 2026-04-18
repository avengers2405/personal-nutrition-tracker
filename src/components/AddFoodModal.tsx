import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Plus, ChevronRight, Check, Utensils, Leaf } from 'lucide-react';
import { useState } from 'react';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFoodModal({ isOpen, onClose }: AddFoodModalProps) {
  const [amount, setAmount] = useState('0');

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
              <h2 className="font-headline text-2xl font-normal text-on-surface uppercase tracking-[2px]">Portfolio Entry</h2>
              <button 
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-all p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-8 flex-1 overflow-y-auto pb-10 no-scrollbar mt-6">
              {/* Search */}
              <div className="relative mb-6 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" size={18} />
                <input 
                  autoFocus
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-none py-4 pl-12 pr-4 border border-outline focus:border-primary focus:ring-0 transition-all font-body text-sm" 
                  placeholder="Analyze markets, assets, indices..." 
                  type="text"
                />
              </div>

              {/* Create New Action */}
              <button className="w-full bg-primary/5 text-primary border border-primary/30 hover:bg-primary/10 transition-all rounded-none p-4 flex items-center justify-between mb-8 active:scale-[0.98]">
                <div className="flex items-center space-x-3">
                  <Plus size={20} />
                  <span className="font-body font-bold text-xs uppercase tracking-[2px]">Create New Instrument</span>
                </div>
                <ChevronRight size={16} />
              </button>

              {/* Input Section */}
              <div className="bg-surface-container rounded-none p-6 mb-6 border border-outline">
                <h3 className="font-headline text-lg font-normal mb-4 text-on-surface uppercase tracking-[1px]">Quick Entry</h3>
                <div className="mb-4">
                  <label className="block text-[10px] font-black uppercase tracking-[2px] text-on-surface-variant mb-2">Quantity (val/units)</label>
                  <div className="relative">
                    <input 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface font-headline text-3xl font-normal rounded-none py-4 px-4 text-center border border-outline focus:border-primary focus:ring-0 transition-all appearance-none" 
                      placeholder="0" 
                      type="number" 
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <span className="text-on-surface-variant text-[11px] font-bold uppercase tracking-[1px]">Units</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button className="bg-primary/5 text-primary border border-primary/20 py-3 rounded-none text-[11px] uppercase tracking-[1px] font-bold hover:bg-primary/10 transition-all">Fractional</button>
                  <button className="bg-primary/5 text-primary border border-primary/20 py-3 rounded-none text-[11px] uppercase tracking-[1px] font-bold hover:bg-primary/10 transition-all">Full Unit</button>
                </div>
              </div>

              {/* Suggested */}
              <div>
                <h3 className="font-headline text-[10px] font-black text-on-surface-variant mb-4 uppercase tracking-[2px]">Market Suggestions</h3>
                <div className="space-y-2">
                  <SuggestedEntry icon={Utensils} name="ETF / S&P 500" detail="Vanguard Group • Index Fund" />
                  <SuggestedEntry icon={Leaf} name="Spot Gold" detail="Bullion • Direct Allocation" />
                </div>
              </div>
            </div>

            {/* Final Action */}
            <div className="p-8 bg-surface border-t border-outline">
              <button 
                onClick={onClose}
                className="w-full bg-primary text-on-primary rounded-none py-5 font-headline text-sm uppercase tracking-[3px] transition-all hover:shadow-[0_0_20px_rgba(185,151,91,0.4)] active:scale-[0.99] flex items-center justify-center space-x-3"
              >
                <span>Commit Entry</span>
                <Check size={20} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SuggestedEntry({ icon: Icon, name, detail }: { icon: any, name: string, detail: string }) {
  return (
    <div className="p-4 rounded-none border border-outline/50 hover:border-primary/40 hover:bg-primary/5 transition-all flex justify-between items-center cursor-pointer group">
      <div className="flex items-center space-x-4">
        <Icon size={18} className="text-primary opacity-60 group-hover:opacity-100" />
        <div>
          <div className="font-bold text-on-surface text-sm uppercase tracking-[0.5px]">{name}</div>
          <div className="text-[10px] font-semibold text-on-surface-variant uppercase opacity-50">{detail}</div>
        </div>
      </div>
      <Plus size={18} className="text-on-surface-variant group-hover:text-primary transition-all" />
    </div>
  );
}
