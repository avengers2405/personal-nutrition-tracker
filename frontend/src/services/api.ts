/**
 * API Service - Handles all backend API calls
 * Uses BACKEND_URL from environment variables
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

console.log('[API Service] Using BACKEND_URL:', BACKEND_URL);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth() {
    try {
        console.log('[API Service] Checking backend health at:', BACKEND_URL);
        const response = await fetch(`${BACKEND_URL}/ping`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('[API Service] Health check response status:', response.status);
        if (!response.ok) {
            throw new Error(`Backend health check failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('[API Service] Backend health check successful:', data);
        return data;
    } catch (error) {
        console.error('[API Service] Backend health check failed:', error);
        if (error instanceof TypeError) {
            console.error('[API Service] This is likely a network error - check if backend is running on', BACKEND_URL);
        }
        throw error;
    }
}

// ============================================================================
// MACROS API
// ============================================================================

/**
 * Fetch all macros (nutrients)
 */
export async function fetchAllMacros() {
    try {
        console.log('[API Service] Fetching all macros from:', `${BACKEND_URL}/api/macros`);
        const response = await fetch(`${BACKEND_URL}/api/macros`);
        console.log('[API Service] Fetch macros response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to fetch macros: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('[API Service] Error fetching macros:', error);
        if (error instanceof TypeError) {
            console.error('[API Service] Network error - check if backend is running and CORS is enabled');
        }
        throw error;
    }
}

/**
 * Fetch a specific macro by ID
 */
export async function fetchMacroById(macroId: number) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/macros/${macroId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch macro: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching macro ${macroId}:`, error);
        throw error;
    }
}

/**
 * Create a new macro (nutrient)
 */
export async function createMacro(name: string, target: number = 0, measurementUnit: string = 'g', homeDisplay: boolean = true) {
    try {
        console.log('[API Service] Creating macro:', { name, target, measurementUnit, homeDisplay });
        const response = await fetch(`${BACKEND_URL}/api/macros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, target, measurement_unit: measurementUnit, home_display: homeDisplay })
        });
        if (!response.ok) {
            throw new Error(`Failed to create macro: ${response.statusText}`);
        }
        const result = await response.json();
        console.log('[API Service] Macro created:', result);
        return result;
    } catch (error) {
        console.error('Error creating macro:', error);
        throw error;
    }
}

/**
 * Update a macro (nutrient)
 */
export async function updateMacro(macroId: number | string, name: string, target: number = 0, measurementUnit: string = 'g', homeDisplay: boolean = true) {
    try {
        console.log('[API Service] Updating macro:', { macroId, name, target, measurementUnit, homeDisplay });
        const response = await fetch(`${BACKEND_URL}/api/macros/${macroId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, target, measurement_unit: measurementUnit, home_display: homeDisplay })
        });
        if (!response.ok) {
            throw new Error(`Failed to update macro: ${response.statusText}`);
        }
        const result = await response.json();
        console.log('[API Service] Macro updated:', result);
        return result;
    } catch (error) {
        console.error(`Error updating macro ${macroId}:`, error);
        throw error;
    }
}

/**
 * Delete a macro (nutrient)
 */
export async function deleteMacro(macroId: number | string) {
    try {
        console.log('[API Service] Deleting macro:', macroId);
        const response = await fetch(`${BACKEND_URL}/api/macros/${macroId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Failed to delete macro: ${response.statusText}`);
        }
        console.log('[API Service] Macro deleted:', macroId);
        return await response.json();
    } catch (error) {
        console.error(`Error deleting macro ${macroId}:`, error);
        throw error;
    }
}

// ============================================================================
// FOODS API
// ============================================================================

/**
 * Fetch all foods
 */
export async function fetchAllFoods() {
    try {
        console.log('[API Service] Fetching all foods from:', `${BACKEND_URL}/api/foods`);
        const response = await fetch(`${BACKEND_URL}/api/foods`);
        console.log('[API Service] Fetch foods response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to fetch foods: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('[API Service] Error fetching foods:', error);
        if (error instanceof TypeError) {
            console.error('[API Service] Network error - check if backend is running and CORS is enabled');
        }
        throw error;
    }
}

/**
 * Fetch a specific food by ID with its macros
 */
export async function fetchFoodById(foodId: number) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/foods/${foodId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch food: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching food ${foodId}:`, error);
        throw error;
    }
}

// ============================================================================
// FOOD MACRO API
// ============================================================================

/**
 * Fetch all food-macro relationships
 */
export async function fetchAllFoodMacros() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/food-macros`);
        if (!response.ok) {
            throw new Error(`Failed to fetch food macros: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching food macros:', error);
        throw error;
    }
}

/**
 * Fetch food macro details for a specific food
 */
export async function fetchFoodMacrosByFoodId(foodId: number) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/food-macros/food/${foodId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch food macros: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching food macros for food ${foodId}:`, error);
        throw error;
    }
}

// ============================================================================
// FOOD ENTRY API
// ============================================================================

/**
 * Create a new food entry with servings
 */
export async function createFoodEntry(foodId: number, servings: number, eatenOnDate: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/food-entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foodId, servings, eatenOnDate })
        });
        if (!response.ok) {
            throw new Error(`Failed to create food entry: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating food entry:', error);
        throw error;
    }
}

/**
 * Create a new food entry by amount (auto-calculates servings)
 */
export async function createFoodEntryByAmount(foodId: number, amount: number, eatenOnDate: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/food-entries/by-amount`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foodId, amount, eatenOnDate })
        });
        if (!response.ok) {
            throw new Error(`Failed to create food entry: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating food entry by amount:', error);
        throw error;
    }
}

// ============================================================================
// CONSUMPTION API
// ============================================================================

/**
 * Get total consumption of a specific macro for a given date
 */
export async function fetchMacroConsumption(date: string, macroIdentifier: string | number) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/consumption/${date}/${macroIdentifier}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch consumption data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching consumption for ${macroIdentifier} on ${date}:`, error);
        throw error;
    }
}

/**
 * Get total consumption of all macros for a given date
 */
export async function fetchAllMacroConsumption(date: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/consumption/${date}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch consumption data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching all consumption for ${date}:`, error);
        throw error;
    }
}

// ============================================================================
// MEASUREMENT UNITS API
// ============================================================================

/**
 * Fetch all available measurement units from the database enum
 */
export async function fetchMeasurementUnits(): Promise<string[]> {
    try {
        console.log('[API Service] Fetching measurement units from:', `${BACKEND_URL}/api/units`);
        const response = await fetch(`${BACKEND_URL}/api/units`);
        console.log('[API Service] Fetch units response status:', response.status);
        if (!response.ok) {
            throw new Error(`Failed to fetch measurement units: ${response.statusText}`);
        }
        const result = await response.json();
        console.log('[API Service] Measurement units fetched:', result.data);
        // Handle both array response and { data: [...] } response
        return Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
    } catch (error) {
        console.error('[API Service] Error fetching measurement units:', error);
        if (error instanceof TypeError) {
            console.error('[API Service] Network error - check if backend is running and CORS is enabled');
        }
        throw error;
    }
}
