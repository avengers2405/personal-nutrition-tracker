import { LayoutGrid, Settings, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddClick: () => void;
}

export default function BottomNav({ activeTab, setActiveTab, onAddClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 lg:hidden bg-surface border-t border-primary/20 px-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <button 
        onClick={() => setActiveTab('main')}
        className={`flex flex-col items-center justify-center p-2 transition-all ${activeTab === 'main' ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}
      >
        <LayoutGrid size={22} />
        <span className="font-body text-[9px] uppercase tracking-[1px] mt-1">Main</span>
      </button>

      <button 
        onClick={onAddClick}
        className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-none w-12 h-12 shadow-[0_0_15px_rgba(185,151,91,0.5)] border border-primary hover:scale-110 active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>

      <button 
        onClick={() => setActiveTab('settings')}
        className={`flex flex-col items-center justify-center p-2 transition-all ${activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}
      >
        <Settings size={22} />
        <span className="font-body text-[9px] uppercase tracking-[1px] mt-1">Settings</span>
      </button>
    </nav>
  );
}
