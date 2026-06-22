import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchFoodEntriesByDate } from '../services/api';
import { FoodItem, TrackedNutrient } from '../types';
import FoodInfoModal from './FoodInfoModal';

interface DayEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // yyyy-mm-dd
  foodDatabase: FoodItem[];
  trackedNutrients: TrackedNutrient[];
}

const toDateTimestamp = (dateStr: string) => {
  return new Date(`${dateStr}T00:00:00`).getTime();
};

export default function DayEntriesModal({ isOpen, onClose, date, foodDatabase, trackedNutrients }: DayEntriesModalProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoFood, setInfoFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetchFoodEntriesByDate(toDateTimestamp(date));
        const data = resp.data || [];
        setEntries(data);
      } catch (err: any) {
        console.error('DayEntriesModal failed to load entries', err);
        setError(err?.message || 'Failed to load entries');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, date]);

  // Close modal on Escape when DayEntries view is open (not when viewing FoodInfoModal)
  useEffect(() => {
    if (!isOpen || infoFood) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, infoFood, onClose]);

  if (!isOpen) return null;

  if (infoFood) {
    return (
      <FoodInfoModal
        isOpen={true}
        onClose={() => {
          setInfoFood(null);
          onClose();
        }}
        onBack={() => setInfoFood(null)}
        food={infoFood}
        trackedNutrients={trackedNutrients}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl mx-4 bg-surface-container border border-outline p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg text-on-surface">Entries for {date}</h3>
          <button onClick={onClose} className="text-on-surface-variant p-1 hover:text-primary">
            <X />
          </button>
        </div>

        {loading && <p className="text-on-surface-variant">Loading...</p>}
        {error && <p className="text-danger">{error}</p>}

        {!loading && entries.length === 0 && (
          <p className="text-on-surface-variant">No entries for this date.</p>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {entries.map((entry, idx) => {
            const foodRecord = entry.Foods || foodDatabase.find(f => f.id === String(entry.food_id));
            const foodName = foodRecord?.name || 'Unknown';
            const servings = entry.servings ?? '-';
            const foodServingSize = foodRecord?.serving_size ?? null;
            const measurementUnit = foodRecord?.measurement_unit ?? '';

            // Determine displayed amount: prefer explicit entry.amount; otherwise calculate from servings * serving_size
            let displayedAmount: string | number = '-';
            if (entry.amount != null && entry.amount !== '') {
              displayedAmount = entry.amount;
            } else if (servings !== '-' && foodServingSize != null) {
              const computed = Number(servings) * Number(foodServingSize);
              displayedAmount = isNaN(computed) ? '-' : Math.round((computed + Number.EPSILON) * 100) / 100;
            }

            const amountLabel = displayedAmount === '-' ? '-' : `${displayedAmount} ${measurementUnit}`.trim();
            const imgUrl = foodRecord?.image || `https://picsum.photos/seed/${foodName.toLowerCase().replace(/\s+/g, '-')}/200/200`;

            return (
              <div 
                key={idx} 
                className="bg-surface rounded-none border border-outline p-3 flex justify-between items-center cursor-pointer hover:bg-surface-container-high transition-colors"
                onClick={() => {
                  let f: FoodItem | undefined;
                  if (foodRecord) {
                    if ('id' in foodRecord && 'nutrients' in foodRecord) {
                      f = foodRecord as FoodItem;
                    } else if (entry.food_id) {
                      f = foodDatabase.find(x => x.id === String(entry.food_id));
                    }
                  }
                  if (!f) {
                    // Fallback create fake foodItem
                    const fetchedNutrients: Record<string, number> = {};
                    if (foodRecord?.['food-macro'] && Array.isArray(foodRecord['food-macro'])) {
                      foodRecord['food-macro'].forEach((fm: any) => {
                        fetchedNutrients[fm.macro_id.toString()] = fm.value;
                      });
                    }
                    f = {
                      id: String(entry.food_id || Date.now()),
                      name: foodName,
                      image: imgUrl,
                      nutrients: fetchedNutrients,
                      serving_size: foodServingSize || 1,
                      measurement_unit: measurementUnit || 'g',
                    };
                  }
                  setInfoFood(f);
                }}
              >
                <div className="flex-1 pr-4 pointer-events-none">
                  <div className="font-body text-sm text-on-surface font-bold uppercase tracking-[0.5px]">{foodName}</div>
                  <div className="text-[11px] text-on-surface-variant">Amount: {amountLabel} • Servings: {servings}</div>
                </div>

                <div className="flex flex-col items-end gap-2 pointer-events-none">
                  <div className="text-[11px] text-on-surface-variant">{entry.eaten_on_time || ''}</div>
                  <img src={imgUrl} alt={foodName} className="w-14 h-14 object-cover border border-outline" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
