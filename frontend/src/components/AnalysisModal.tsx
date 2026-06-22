import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { TrackedNutrient, FoodItem } from '../types';
import { fetchFoodEntriesByDate } from '../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    trackedNutrients: TrackedNutrient[];
    foodDatabase: FoodItem[];
}

export default function AnalysisModal({ isOpen, onClose, date, trackedNutrients, foodDatabase }: AnalysisModalProps) {
    const [selectedMacroId, setSelectedMacroId] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && trackedNutrients.length > 0 && !selectedMacroId) {
            setSelectedMacroId(trackedNutrients[0].id);
        }
    }, [isOpen, trackedNutrients]);

    useEffect(() => {
        if (isOpen && selectedMacroId) {
            loadData();
        }
    }, [isOpen, selectedMacroId, date]);

    // Handle escape key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            const startOfDay = new Date(`${date}T00:00:00`).getTime();

            const resp = await fetchFoodEntriesByDate(startOfDay);
            const entries: any[] = resp.data || [];

            const selectedNutrient = trackedNutrients.find(n => n.id === selectedMacroId);
            if (!selectedNutrient) return;

            const target = selectedNutrient.goal;

            // Sort entries by time
            const sortedEntries = [...entries].sort((a, b) => {
                const timeA = new Date(a.eaten_on_time || new Date().toISOString()).getTime();
                const timeB = new Date(b.eaten_on_time || new Date().toISOString()).getTime();
                return timeA - timeB;
            });

            // Generate data points
            let cumulativeValue = 0;
            const data = [{ time: 0, timeLabel: '00:00', percent: 0, value: 0 }]; // Start at 0

            for (const entry of sortedEntries) {
                const entryTime = new Date(entry.eaten_on_time || new Date().toISOString());
                const hours = entryTime.getHours();
                const minutes = entryTime.getMinutes();
                const timeVal = hours + minutes / 60;

                const timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                // Add nutrient amount
                const food = foodDatabase.find(f => f.id === entry.food_id?.toString());
                if (food && food.nutrients && food.nutrients[selectedMacroId]) {
                    cumulativeValue += food.nutrients[selectedMacroId] * (entry.servings || 1);
                }

                const percent = target > 0 ? (cumulativeValue / target) * 100 : 0;

                data.push({
                    time: timeVal,
                    timeLabel,
                    percent: parseFloat(percent.toFixed(1)),
                    value: parseFloat(cumulativeValue.toFixed(1))
                });
            }

            // Add a point for "now" if it's today, otherwise add end of day point
            const now = new Date();
            const todayDateStr = now.toISOString().split('T')[0];

            if (date === todayDateStr) {
                const currentHours = now.getHours();
                const currentMinutes = now.getMinutes();
                const currentTimeVal = currentHours + currentMinutes / 60;

                // Only add if the last point wasn't just added (avoid overlap)
                if (data.length === 0 || data[data.length - 1].time < currentTimeVal - 0.1) {
                    data.push({
                        time: currentTimeVal,
                        timeLabel: 'Now',
                        percent: data[data.length - 1]?.percent || 0,
                        value: data[data.length - 1]?.value || 0
                    });
                }
            } else if (data.length > 0) {
                // End of day pad for past dates
                data.push({
                    time: 24,
                    timeLabel: '23:59',
                    percent: data[data.length - 1].percent,
                    value: data[data.length - 1].value
                });
            }

            setChartData(data);
        } catch (err) {
            console.error("Error loading analysis data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedNutrient = trackedNutrients.find(n => n.id === selectedMacroId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />
            <div className="relative w-full max-w-4xl bg-surface border border-outline shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-outline shrink-0">
                    <h2 className="font-headline text-2xl tracking-[2px] uppercase text-primary">Daily Analysis</h2>
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-outline flex items-center gap-4 relative shrink-0">
                    <span className="font-headline text-sm uppercase tracking-[1px] text-on-surface-variant">
                        Nutrient:
                    </span>
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 bg-surface-container border border-outline px-4 py-2 hover:bg-surface-container-high transition-all"
                        >
                            <span className="font-headline text-sm uppercase tracking-[1px] text-on-surface">
                                {selectedNutrient?.name || "Select Nutrient"}
                            </span>
                            <ChevronDown size={14} className={`text-on-surface transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-surface-container border border-outline shadow-xl z-10 max-h-60 overflow-y-auto">
                                {trackedNutrients.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => {
                                            setSelectedMacroId(n.id);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-primary/10 font-body text-xs uppercase tracking-[1px] border-b border-outline/50 ${selectedMacroId === n.id ? 'text-primary' : 'text-on-surface'}`}
                                    >
                                        {n.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart Content */}
                <div className="p-6 flex-1 min-h-[400px] w-full" style={{ minHeight: '400px' }}>
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : chartData.length > 0 ? (
                        <div style={{ width: '100%', height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#b9975b" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#b9975b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    type="number"
                                    domain={[0, 24]}
                                    ticks={[0, 4, 8, 12, 16, 20, 24]}
                                    tickFormatter={(val) => `${val.toString().padStart(2, '0')}:00`}
                                    stroke="rgba(255,255,255,0.3)"
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}
                                />
                                <YAxis
                                    tickFormatter={(val) => `${val}%`}
                                    stroke="rgba(255,255,255,0.3)"
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '0px' }}
                                    labelStyle={{ color: '#b9975b', fontFamily: 'monospace', textTransform: 'uppercase', fontSize: '12px' }}
                                    itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                                    labelFormatter={(_label, payload) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.timeLabel;
                                        }
                                        return '';
                                    }}
                                    formatter={(value: any, _name: any, props: any) => [`${value}% (${props.payload.value} / ${selectedNutrient?.goal})`, '% of Target']}
                                />
                                <ReferenceLine y={100} stroke="#b9975b" strokeDasharray="3 3" opacity={0.5} label={{ value: '100% Target', position: 'insideTopLeft', fill: '#b9975b', fontSize: 10 }} />
                                <Area
                                    type="stepAfter"
                                    dataKey="percent"
                                    stroke="#b9975b"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorPercent)"
                                    animationDuration={500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-on-surface-variant font-body text-sm uppercase tracking-[1px]">
                            No entries found for this date.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
