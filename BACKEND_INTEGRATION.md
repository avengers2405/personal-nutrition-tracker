# Backend Integration Summary

## Changes Made

### 1. **Backend (db.js & index.js)**

#### New Database Functions Added:
- `getAllMacros()` - Fetch all macros/nutrients
- `getMacroById(macroId)` - Fetch specific macro
- `getAllFoods()` - Fetch all foods
- `getFoodById(foodId)` - Fetch specific food with macros
- `getAllFoodMacros()` - Fetch all food-macro relationships
- `getFoodMacrosByFoodId(foodId)` - Fetch macros for specific food
- `resolveMacroId(macroIdentifier)` - Resolve macro ID or name

#### New Routes Created:

**GET Macros:**
- `GET /api/macros` - Get all macros
- `GET /api/macros/:macroId` - Get specific macro

**GET Foods:**
- `GET /api/foods` - Get all foods
- `GET /api/foods/:foodId` - Get specific food with macros

**GET Food Macros:**
- `GET /api/food-macros` - Get all food-macro relationships
- `GET /api/food-macros/food/:foodId` - Get macros for specific food

**Consumption (Already existed):**
- `GET /api/consumption/:date/:macroIdentifier` - Get specific macro consumption
- `GET /api/consumption/:date` - Get all macro consumption

### 2. **Frontend Changes**

#### New Service File:
- Created `src/services/api.ts` - API service with fetch functions for all backend routes

#### Updated Environment:
- Changed `BACKEND_URL` to `VITE_BACKEND_URL` in `.env` (Vite compatible)

#### Modified App.tsx:
- Added `useEffect` hook to fetch macros and foods on mount
- Removed static data (`DEFAULT_CONFIG`, `SAMPLE_FOOD_DATABASE`, `DAILY_LOGS`)
- Added loading state with spinner
- Transforms backend data to frontend format:
  - Macros → UserConfig (with default goals and visibility settings)
  - Foods → FoodItem format
- Handles errors gracefully with fallback to empty state

## Data Flow

```
App Mount
  ↓
useEffect triggers
  ↓
fetchAllMacros() → GET /api/macros
fetchAllFoods()  → GET /api/foods
  ↓
Transform data to frontend format
  ↓
Update state (config, foodDatabase)
  ↓
Set isLoading = false
  ↓
Render UI with fetched data
```

## Available API Endpoints

### Macros
- `GET /api/macros` - Returns all macros
- `GET /api/macros/:id` - Returns specific macro
- `POST /api/macros` - Create macro
- `PUT /api/macros/:id` - Update macro
- `DELETE /api/macros/:id` - Delete macro

### Foods
- `GET /api/foods` - Returns all foods
- `GET /api/foods/:id` - Returns specific food with macros
- `POST /api/foods` - Create food
- `PUT /api/foods/:id` - Update food
- `DELETE /api/foods/:id` - Delete food

### Food Macros
- `GET /api/food-macros` - Returns all relationships
- `GET /api/food-macros/food/:foodId` - Returns macros for food
- `POST /api/food-macros` - Create relationship
- `PUT /api/food-macros/:id` - Update relationship
- `DELETE /api/food-macros/:id` - Delete relationship

### Food Entries
- `GET /api/consumption/:date` - Get all macro consumption for date
- `GET /api/consumption/:date/:macroIdentifier` - Get specific macro consumption
- `POST /api/food-entries` - Create entry with servings
- `POST /api/food-entries/by-amount` - Create entry by amount
- `PUT /api/food-entries/:id` - Update entry
- `DELETE /api/food-entries/:id` - Delete entry

## Additional Features Implemented

✅ Macro identifier resolution - Accept macro ID or name
✅ Error handling - Graceful fallbacks if backend unavailable
✅ Loading state - Shows spinner while fetching data
✅ TypeScript type safety - Full type support in API calls
✅ Flexible data transformation - Backend data → Frontend format

## Future Enhancements (Optional)

If you want to persist user settings (goals, visibility) to the backend:

1. Create a `user_settings` table with columns:
   - `id`, `user_id`, `macro_id`, `goal`, `unit`, `visible`, `created_at`

2. Add routes:
   - `GET /api/user-settings` - Get all user settings
   - `POST /api/user-settings` - Create/update setting
   - `PUT /api/user-settings/:id` - Update setting

3. Update frontend `setConfig` to POST changes to backend

This would allow settings to persist across sessions and devices.
