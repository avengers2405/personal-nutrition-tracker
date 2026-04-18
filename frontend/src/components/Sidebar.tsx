import { LayoutGrid, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'main', label: 'Main', icon: LayoutGrid },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-[240px] bg-surface border-r border-outline transition-all duration-300 z-40">
      <div className="px-6 pb-8 pt-10 text-center lg:text-left">
        <h2 className="font-headline text-2xl tracking-[4px] uppercase text-primary mb-12">Aureus</h2>
      </div>

      <nav className="flex-1 flex flex-col gap-4 px-6">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 py-1 transition-all text-left uppercase tracking-[2px] text-[13px] ${
                isActive 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="font-body opacity-80 hover:opacity-100">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="text-[10px] text-on-surface-variant uppercase tracking-[1px] opacity-40 text-center">
          Sophisticated Tracking
        </div>
      </div>
    </aside>
  );
}
