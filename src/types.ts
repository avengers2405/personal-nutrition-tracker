export interface TrackedNutrient {
  id: string;
  name: string;
  value: number;
  goal: number;
  unit: string;
}

export interface FoodItem {
  id: string;
  name: string;
  serving: string;
  image: string;
  nutrients: { [nutrientId: string]: number };
}

export interface DailyStats {
  date: string;
  nutrients: { [nutrientId: string]: number };
}

export interface UserConfig {
  trackedNutrients: { id: string; name: string; goal: number; unit: string }[];
}
