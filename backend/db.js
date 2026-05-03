import { createClient } from '@supabase/supabase-js';
import "dotenv/config";

console.log('[DB] Loading environment variables...');
console.log('[DB] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('[DB] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✓ Set' : '✗ Missing');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

console.log('[DB] Supabase client initialized');

// ============================================================================
// FOOD ENTRY TABLE - CRUD OPERATIONS
// ============================================================================

/**
 * Insert a new food entry record
 * @param {number} foodId - The ID of the food
 * @param {number} servings - Number of servings consumed
 * @param {string} eatenOnDate - The date the food was eaten (YYYY-MM-DD format)
 * @returns {Promise<{data: Object|null, error: Object|null}>} The inserted record or error
 */
export async function insertFoodEntry(foodId, servings, eatenOnDate) {
    return supabase
        .from('food-entry')
        .insert({
            food_id: foodId,
            servings,
            eaten_on_date: eatenOnDate,
            created_at: new Date().toISOString()
        });
}

/**
 * Insert a new food entry record by calculating servings from amount
 * @param {number} foodId - The ID of the food
 * @param {number} amount - The amount of food consumed (in the food's measurement unit)
 * @param {string} eatenOnDate - The date the food was eaten (YYYY-MM-DD format)
 * @returns {Promise<{data: Object|null, error: Object|null}>} The inserted record or error
 * @throws {Error} If food-macro data is not found or amount is invalid
 */
export async function insertFoodEntryByAmount(foodId, amount, eatenOnDate) {
    // Fetch the food record to get the baseline serving size
    const { data: foodData, error: foodError } = await supabase
        .from('Foods')
        .select('serving_size')
        .eq('id', foodId)
        .single();

    if (foodError || !foodData) {
        return {
            data: null,
            error: foodError || new Error(`No food data found for food ID: ${foodId}`)
        };
    }

    const servingSize = foodData.serving_size;

    if (servingSize <= 0) {
        return {
            data: null,
            error: new Error('Invalid serving size: must be greater than 0')
        };
    }

    // Calculate servings from amount
    const servings = amount / servingSize;

    // Insert the food entry with calculated servings
    return insertFoodEntry(foodId, servings, eatenOnDate);
}

/**
 * Update an existing food entry record
 * @param {number} entryId - The ID of the food entry to update
 * @param {Object} updates - Object containing fields to update (foodId, servings, eatenOnDate)
 * @returns {Promise<{data: Object|null, error: Object|null}>} The updated record or error
 */
export async function updateFoodEntry(entryId, updates) {
    const updateData = {};
    if (updates.foodId !== undefined) updateData.food_id = updates.foodId;
    if (updates.servings !== undefined) updateData.servings = updates.servings;
    if (updates.eatenOnDate !== undefined) updateData.eaten_on_date = updates.eatenOnDate;

    return supabase
        .from('food-entry')
        .update(updateData)
        .eq('id', entryId);
}

/**
 * Delete a food entry record
 * @param {number} entryId - The ID of the food entry to delete
 * @returns {Promise<{data: Object|null, error: Object|null}>} Deletion result or error
 */
export async function deleteFoodEntry(entryId) {
    return supabase
        .from('food-entry')
        .delete()
        .eq('id', entryId);
}

/**
 * Get all food entries for a specific date with basic food details
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<{data: Array|null, error: Object|null}>} Array of food entries with details or error
 */
export async function getFoodEntriesByDate(date) {
    return supabase
        .from('food-entry')
        .select(`
            id,
            food_id,
            servings,
            eaten_on_date,
            created_at,
            Foods(
                id,
                name,
                measurement_unit,
                serving_size
            )
        `)
        .eq('eaten_on_date', date)
        .order('created_at', { ascending: false });
}

// ============================================================================
// FOOD MACRO TABLE - CRUD OPERATIONS
// ============================================================================

/**
 * Insert a new food macro record (relationship between food and macro)
 * @param {number} foodId - The ID of the food
 * @param {number} macroId - The ID of the macro (nutrient)
 * @param {number} value - The value of the macro per serving amount of the food
 * @returns {Promise<{data: Object|null, error: Object|null}>} The inserted record or error
 */
export async function insertFoodMacro(foodId, macroId, value) {
    return supabase
        .from('food-macro')
        .insert({
            food_id: foodId,
            macro_id: macroId,
            value,
            created_at: new Date().toISOString()
        });
}

/**
 * Update an existing food macro record
 * @param {number} foodMacroId - The ID of the food macro record to update
 * @param {Object} updates - Object containing fields to update (value)
 * @returns {Promise<{data: Object|null, error: Object|null}>} The updated record or error
 */
export async function updateFoodMacro(foodMacroId, updates) {
    const updateData = {};
    if (updates.value !== undefined) updateData.value = updates.value;

    return supabase
        .from('food-macro')
        .update(updateData)
        .eq('id', foodMacroId);
}

/**
 * Delete a food macro record
 * @param {number} foodMacroId - The ID of the food macro record to delete
 * @returns {Promise<{data: Object|null, error: Object|null}>} Deletion result or error
 */
export async function deleteFoodMacro(foodMacroId) {
    return supabase
        .from('food-macro')
        .delete()
        .eq('id', foodMacroId);
}

// ============================================================================
// FOODS TABLE - CRUD OPERATIONS
// ============================================================================

/**
 * Insert a new food record
 * @param {string} name - The name of the food
 * @param {string} measurementUnit - The measurement unit (e.g., grams, ml, pieces)
 * @param {number} servingSize - The default serving size of the food in its measurement unit
 * @returns {Promise<{data: Object|null, error: Object|null}>} The inserted record or error
 */
export async function insertFood(name, measurementUnit, servingSize) {
    return supabase
        .from('Foods')
        .insert({
            name,
            measurement_unit: measurementUnit,
            serving_size: servingSize,
            created_at: new Date().toISOString()
        })
        .select();
}

/**
 * Update an existing food record
 * @param {number} foodId - The ID of the food to update
 * @param {Object} updates - Object containing fields to update (name, measurementUnit, servingSize)
 * @returns {Promise<{data: Object|null, error: Object|null}>} The updated record or error
 */
export async function updateFood(foodId, updates) {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.measurementUnit !== undefined) updateData.measurement_unit = updates.measurementUnit;
    if (updates.servingSize !== undefined) updateData.serving_size = updates.servingSize;

    return supabase
        .from('Foods')
        .update(updateData)
        .eq('id', foodId);
}

/**
 * Delete a food record
 * @param {number} foodId - The ID of the food to delete
 * @returns {Promise<{data: Object|null, error: Object|null}>} Deletion result or error
 */
export async function deleteFood(foodId) {
    return supabase
        .from('Foods')
        .delete()
        .eq('id', foodId);
}

// ============================================================================
// MACROS TABLE - CRUD OPERATIONS
// ============================================================================

/**
 * Insert a new macro (nutrient) record
 * @param {string} name - The name of the macro (e.g., Protein, Carbs, Fat)
 * @returns {Promise<{data: Object|null, error: Object|null}>} The inserted record or error
 */
export async function insertMacro(name, target, measurement_unit, home_display) {
    console.log('[DB] insertMacro called with:', { name, target, measurement_unit, home_display });
    try {
        const result = await supabase
            .from('Macros')
            .insert({
                name,
                target: target || 0,
                measurement_unit: measurement_unit || 'g',
                home_display: home_display !== undefined ? home_display : true
            })
            .select();
        console.log('[DB] insertMacro result:', result.data ? `✓ Macro created: ${JSON.stringify(result.data)}` : `✗ Error: ${result.error?.message}`);
        if (result.error) {
            console.error('[DB] insertMacro error details:', result.error);
        }
        return result;
    } catch (err) {
        console.error('[DB] insertMacro exception:', err);
        return { data: null, error: err };
    }
}

/**
 * Update an existing macro record
 * @param {number} macroId - The ID of the macro to update
 * @param {Object} updates - Object containing fields to update (name, target, measurement_unit, home_display)
 * @returns {Promise<{data: Object|null, error: Object|null}>} The updated record or error
 */
export async function updateMacro(macroId, updates) {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.target !== undefined) updateData.target = updates.target;
    if (updates.measurement_unit !== undefined) updateData.measurement_unit = updates.measurement_unit;
    if (updates.home_display !== undefined) updateData.home_display = updates.home_display;

    console.log('[DB] updateMacro called with:', { macroId, updateData });
    const result = await supabase
        .from('Macros')
        .update(updateData)
        .eq('id', macroId)
        .select();
    
    console.log('[DB] updateMacro result:', result.data ? `✓ Macro updated` : `✗ Error: ${result.error?.message}`);
    if (result.error) {
        console.error('[DB] updateMacro error details:', result.error);
    }
    return result;
}

/**
 * Delete a macro record
 * @param {number} macroId - The ID of the macro to delete
 * @returns {Promise<{data: Object|null, error: Object|null}>} Deletion result or error
 */
export async function deleteMacro(macroId) {
    return supabase
        .from('Macros')
        .delete()
        .eq('id', macroId);
}

/**
 * Get all macros
 * @returns {Promise<{data: Array|null, error: Object|null}>} Array of all macros or error
 */
export async function getAllMacros() {
    console.log('[DB] getAllMacros called');
    const result = await supabase
        .from('Macros')
        .select('*');
    console.log('[DB] getAllMacros result:', result.data ? `✓ ${result.data.length} macros found` : `✗ Error: ${result.error?.message}`);
    return result;
}

/**
 * Get a specific macro by ID
 * @param {number} macroId - The ID of the macro to fetch
 * @returns {Promise<{data: Object|null, error: Object|null}>} The macro or error
 */
export async function getMacroById(macroId) {
    return supabase
        .from('Macros')
        .select('*')
        .eq('id', macroId)
        .single();
}

/**
 * Get all foods
 * @returns {Promise<{data: Array|null, error: Object|null}>} Array of all foods or error
 */
export async function getAllFoods() {
    console.log('[DB] getAllFoods called');
    const result = await supabase
        .from('Foods')
        .select(`
            *,
            "food-macro"(
                id,
                macro_id,
                value
            )
        `);
    console.log('[DB] getAllFoods result:', result.data ? `✓ ${result.data.length} foods found` : `✗ Error: ${result.error?.message}`);
    return result;
}

/**
 * Get a specific food by ID with its macros
 * @param {number} foodId - The ID of the food to fetch
 * @returns {Promise<{data: Object|null, error: Object|null}>} The food with macros or error
 */
export async function getFoodById(foodId) {
    return supabase
        .from('Foods')
        .select(`
            *,
            "food-macro"(
                id,
                macro_id,
                value,
                Macros(name)
            )
        `)
        .eq('id', foodId)
        .single();
}

/**
 * Get all food-macro relationships
 * @returns {Promise<{data: Array|null, error: Object|null}>} Array of food-macro relationships or error
 */
export async function getAllFoodMacros() {
    return supabase
        .from('food-macro')
        .select('*');
}

/**
 * Get food macro details for a specific food
 * @param {number} foodId - The ID of the food
 * @returns {Promise<{data: Array|null, error: Object|null}>} Array of macros for the food or error
 */
export async function getFoodMacrosByFoodId(foodId) {
    return supabase
        .from('food-macro')
        .select(`
            *,
            Macros(name)
        `)
        .eq('food_id', foodId);
}

// ============================================================================
// MACRO RESOLUTION HELPER
// ============================================================================

/**
 * Resolve macro ID from either macro ID or macro name
 * @param {number|string} macroIdentifier - The macro ID (number) or macro name (string)
 * @returns {Promise<{id: number|null, error: Object|null}>} Object with resolved macro ID or error
 */
export async function resolveMacroId(macroIdentifier) {
    // Check if it's a number (macro ID)
    const isNumeric = !isNaN(macroIdentifier) && macroIdentifier !== '';
    
    if (isNumeric) {
        const macroId = parseInt(macroIdentifier);
        // Verify the macro exists
        const { data, error } = await supabase
            .from('Macros')
            .select('id')
            .eq('id', macroId)
            .single();
        
        if (error || !data) {
            return { id: null, error: new Error(`Macro with ID ${macroId} not found`) };
        }
        return { id: macroId, error: null };
    } else {
        // Treat as macro name
        const { data, error } = await supabase
            .from('Macros')
            .select('id')
            .eq('name', macroIdentifier)
            .single();
        
        if (error || !data) {
            return { id: null, error: new Error(`Macro with name "${macroIdentifier}" not found`) };
        }
        return { id: data.id, error: null };
    }
}

// ============================================================================
// MACRO CONSUMPTION QUERIES
// ============================================================================

/**
 * Get total consumption of a specific macro for a given date
 * @param {string} date - The date in YYYY-MM-DD format
 * @param {number} macroId - The ID of the macro (nutrient)
 * @returns {Promise<{data: Object|null, error: Object|null}>} Object with macro consumption data or error
 */
export async function getMacroConsumptionForDate(date, macroId) {
    try {
        const { data: consumptionData, error } = await supabase
            .from('food-entry')
            .select(`
                id,
                servings,
                food_id,
                food_macro!inner(
                    value,
                    macro_id
                )
            `)
            .eq('eaten_on_date', date)
            .eq('food_macro.macro_id', macroId);

        if (error) {
            return { data: null, error };
        }

        // Calculate total consumption
        let totalConsumption = 0;
        consumptionData.forEach(entry => {
            if (entry.food_macro && Array.isArray(entry.food_macro)) {
                entry.food_macro.forEach(macro => {
                    if (macro.macro_id === macroId) {
                        totalConsumption += entry.servings * macro.value;
                    }
                });
            }
        });

        return {
            data: {
                date,
                macroId,
                totalConsumption,
                entries: consumptionData.length
            },
            error: null
        };
    } catch (err) {
        return { data: null, error: err };
    }
}

/**
 * Get total consumption of all macros for a given date
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<{data: Object|null, error: Object|null}>} Object with all macro consumption data or error
 */
export async function getAllMacroConsumptionForDate(date) {
    try {
        const { data: consumptionData, error } = await supabase
            .from('food-entry')
            .select(`
                id,
                servings,
                food_id,
                food_macro(
                    value,
                    macro_id
                )
            `)
            .eq('eaten_on_date', date);

        if (error) {
            return { data: null, error };
        }

        // Group and sum consumption by macro
        const macroConsumption = {};
        consumptionData.forEach(entry => {
            if (entry.food_macro && Array.isArray(entry.food_macro)) {
                entry.food_macro.forEach(macro => {
                    const macroId = macro.macro_id;
                    if (!macroConsumption[macroId]) {
                        macroConsumption[macroId] = 0;
                    }
                    macroConsumption[macroId] += entry.servings * macro.value;
                });
            }
        });

        return {
            data: {
                date,
                macroConsumption,
                totalEntries: consumptionData.length
            },
            error: null
        };
    } catch (err) {
        return { data: null, error: err };
    }
}

// ============================================================================
// ENUM VALUES
// ============================================================================

/**
 * Get all measurement unit enum values from the database
 * @returns {Promise<{data: Array|null, error: Object|null}>} Array of measurement unit values or error
 */
export async function getMeasurementUnits() {
    try {
        // Query PostgreSQL to get enum values from the Measurement type
        const { data, error } = await supabase
            .rpc('get_enum_values', { enum_type_name: 'Measurement' });
        
        if (error) {
            console.error('[DB] Error fetching enum values:', error);
            return { data: null, error };
        }
        
        // Extract the enumlabel values from the response
        const units = data.map((row) => row.enumlabel);
        return { data: units, error: null };
    } catch (err) {
        console.error('[DB] Exception fetching enum values:', err);
        return { data: null, error: err };
    }
}

