import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from '@supabase/supabase-js';
import {
    insertFoodEntry,
    insertFoodEntryByAmount,
    updateFoodEntry,
    deleteFoodEntry,
    insertFoodMacro,
    updateFoodMacro,
    deleteFoodMacro,
    insertFood,
    updateFood,
    deleteFood,
    insertMacro,
    updateMacro,
    deleteMacro,
    getAllMacros,
    getMacroById,
    getAllFoods,
    getFoodById,
    getAllFoodMacros,
    getFoodMacrosByFoodId,
    getMacroConsumptionForDate,
    getAllMacroConsumptionForDate,
    resolveMacroId,
    getMeasurementUnits
} from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

app.use(cors());
app.use(express.json());

// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

app.get('/', (req, res) => {
    console.log('[Backend] Root path accessed');
    res.status(200).json({ message: "Backend is running", timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
    console.log('[Backend] Ping received');
    res.status(200).json({ status: "pong", message: "Backend is reachable" });
});

app.get('/test', async (req, res) => {
    const { data, error } = await supabase.from('test').select('*');
    console.log(data, error);
    if (error) {
        return res.status(500).json({ data, error });
    }
    return res.status(200).json({ data, error });
});

// ============================================================================
// FOOD ENTRY ROUTES
// ============================================================================

/**
 * Create a new food entry with servings
 * POST /api/food-entries
 * Body: { foodId, servings, eatenOnDate }
 */
app.post('/api/food-entries', async (req, res) => {
    const { foodId, servings, eatenOnDate } = req.body;

    if (!foodId || servings === undefined || !eatenOnDate) {
        return res.status(400).json({ error: 'Missing required fields: foodId, servings, eatenOnDate' });
    }

    const { data, error } = await insertFoodEntry(foodId, servings, eatenOnDate);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(201).json({ data });
});

/**
 * Create a new food entry by amount (auto-calculates servings)
 * POST /api/food-entries/by-amount
 * Body: { foodId, amount, eatenOnDate }
 */
app.post('/api/food-entries/by-amount', async (req, res) => {
    const { foodId, amount, eatenOnDate } = req.body;

    if (!foodId || amount === undefined || !eatenOnDate) {
        return res.status(400).json({ error: 'Missing required fields: foodId, amount, eatenOnDate' });
    }

    const { data, error } = await insertFoodEntryByAmount(foodId, amount, eatenOnDate);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(201).json({ data });
});

/**
 * Update a food entry
 * PUT /api/food-entries/:entryId
 * Body: { foodId?, servings?, eatenOnDate? }
 */
app.put('/api/food-entries/:entryId', async (req, res) => {
    const { entryId } = req.params;
    const updates = req.body;

    if (!entryId) {
        return res.status(400).json({ error: 'Missing entryId parameter' });
    }

    const { data, error } = await updateFoodEntry(entryId, updates);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

/**
 * Delete a food entry
 * DELETE /api/food-entries/:entryId
 */
app.delete('/api/food-entries/:entryId', async (req, res) => {
    const { entryId } = req.params;

    if (!entryId) {
        return res.status(400).json({ error: 'Missing entryId parameter' });
    }

    const { data, error } = await deleteFoodEntry(entryId);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

// ============================================================================
// FOOD MACRO ROUTES
// ============================================================================

/**
 * Create a new food-macro relationship
 * POST /api/food-macros
 * Body: { foodId, macroId, servingSize, value }
 */
app.post('/api/food-macros', async (req, res) => {
    const { foodId, macroId, servingSize, value } = req.body;

    if (!foodId || !macroId || servingSize === undefined || value === undefined) {
        return res.status(400).json({ error: 'Missing required fields: foodId, macroId, servingSize, value' });
    }

    const { data, error } = await insertFoodMacro(foodId, macroId, servingSize, value);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(201).json({ data });
});

/**
 * Update a food-macro relationship
 * PUT /api/food-macros/:foodMacroId
 * Body: { servingSize?, value? }
 */
app.put('/api/food-macros/:foodMacroId', async (req, res) => {
    const { foodMacroId } = req.params;
    const updates = req.body;

    if (!foodMacroId) {
        return res.status(400).json({ error: 'Missing foodMacroId parameter' });
    }

    const { data, error } = await updateFoodMacro(foodMacroId, updates);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

/**
 * Delete a food-macro relationship
 * DELETE /api/food-macros/:foodMacroId
 */
app.delete('/api/food-macros/:foodMacroId', async (req, res) => {
    const { foodMacroId } = req.params;

    if (!foodMacroId) {
        return res.status(400).json({ error: 'Missing foodMacroId parameter' });
    }

    const { data, error } = await deleteFoodMacro(foodMacroId);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

// ============================================================================
// FOODS ROUTES
// ============================================================================

/**
 * Create a new food
 * POST /api/foods
 * Body: { name, measurementUnit }
 */
app.post('/api/foods', async (req, res) => {
    const { name, measurementUnit } = req.body;

    if (!name || !measurementUnit) {
        return res.status(400).json({ error: 'Missing required fields: name, measurementUnit' });
    }

    const { data, error } = await insertFood(name, measurementUnit);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(201).json({ data });
});

/**
 * Update a food
 * PUT /api/foods/:foodId
 * Body: { name?, measurementUnit? }
 */
app.put('/api/foods/:foodId', async (req, res) => {
    const { foodId } = req.params;
    const updates = req.body;

    if (!foodId) {
        return res.status(400).json({ error: 'Missing foodId parameter' });
    }

    const { data, error } = await updateFood(foodId, updates);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

/**
 * Delete a food
 * DELETE /api/foods/:foodId
 */
app.delete('/api/foods/:foodId', async (req, res) => {
    const { foodId } = req.params;

    if (!foodId) {
        return res.status(400).json({ error: 'Missing foodId parameter' });
    }

    const { data, error } = await deleteFood(foodId);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

// ============================================================================
// MACROS ROUTES
// ============================================================================

/**
 * Create a new macro (nutrient)
 * POST /api/macros
 * Body: { name, target?, measurement_unit?, home_display? }
 */
app.post('/api/macros', async (req, res) => {
    const { name, target = 0, measurement_unit = 'g', home_display = true } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Missing required field: name' });
    }

    console.log('[API] POST /api/macros with body:', { name, target, measurement_unit, home_display });
    const { data, error } = await insertMacro(name, target, measurement_unit, home_display);
    if (error) {
        return res.status(500).json({ error });
    }
    console.log('[API] POST /api/macros success, created:', data);
    res.status(201).json({ data });
});

/**
 * Update a macro
 * PUT /api/macros/:macroId
 * Body: { name?, target?, measurement_unit?, home_display? }
 */
app.put('/api/macros/:macroId', async (req, res) => {
    console.log('[API] PUT /api/macros/:macroId with body:', req.body);
    const { macroId } = req.params;
    const updates = req.body;

    if (!macroId) {
        return res.status(400).json({ error: 'Missing macroId parameter' });
    }

    const { data, error } = await updateMacro(macroId, updates);
    if (error) {
        console.error('[API] PUT /api/macros/:macroId error:', error);
        return res.status(500).json({ error: error.message || error });
    }
    console.log('[API] PUT /api/macros/:macroId success, updated:', data);
    res.status(200).json({ data });
});

/**
 * Delete a macro
 * DELETE /api/macros/:macroId
 */
app.delete('/api/macros/:macroId', async (req, res) => {
    const { macroId } = req.params;

    if (!macroId) {
        return res.status(400).json({ error: 'Missing macroId parameter' });
    }

    const { data, error } = await deleteMacro(macroId);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

/**
 * Get all macros
 * GET /api/macros
 */
app.get('/api/macros', async (req, res) => {
    console.log('[API] GET /api/macros');
    const { data, error } = await getAllMacros();
    if (error) {
        console.error('[API] GET /api/macros error:', error);
        return res.status(500).json({ error });
    }
    console.log('[API] GET /api/macros success:', data ? `${data.length} macros` : 'no data');
    res.status(200).json({ data });
});

/**
 * Get a specific macro by ID
 * GET /api/macros/:macroId
 */
app.get('/api/macros/:macroId', async (req, res) => {
    const { macroId } = req.params;

    if (!macroId) {
        return res.status(400).json({ error: 'Missing macroId parameter' });
    }

    const { data, error } = await getMacroById(parseInt(macroId));
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

// ============================================================================
// FOODS GET ROUTES
// ============================================================================

/**
 * Get all foods
 * GET /api/foods
 */
app.get('/api/foods', async (req, res) => {
    console.log('[API] GET /api/foods');
    const { data, error } = await getAllFoods();
    if (error) {
        console.error('[API] GET /api/foods error:', error);
        return res.status(500).json({ error });
    }
    console.log('[API] GET /api/foods success:', data ? `${data.length} foods` : 'no data');
    res.status(200).json({ data });
});

/**
 * Get a specific food by ID with its macros
 * GET /api/foods/:foodId
 */
app.get('/api/foods/:foodId', async (req, res) => {
    const { foodId } = req.params;

    if (!foodId) {
        return res.status(400).json({ error: 'Missing foodId parameter' });
    }

    const { data, error } = await getFoodById(parseInt(foodId));
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

// ============================================================================
// FOOD MACRO GET ROUTES
// ============================================================================

/**
 * Get all food-macro relationships
 * GET /api/food-macros
 */
app.get('/api/food-macros', async (req, res) => {
    const { data, error } = await getAllFoodMacros();
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

/**
 * Get food macro details for a specific food
 * GET /api/food-macros/food/:foodId
 */
app.get('/api/food-macros/food/:foodId', async (req, res) => {
    const { foodId } = req.params;

    if (!foodId) {
        return res.status(400).json({ error: 'Missing foodId parameter' });
    }

    const { data, error } = await getFoodMacrosByFoodId(parseInt(foodId));
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

// ============================================================================
// MEASUREMENT UNITS ROUTES
// ============================================================================

/**
 * Get all measurement unit enum values
 * GET /api/units
 */
app.get('/api/units', async (req, res) => {
    console.log('[API] GET /api/units');
    const { data, error } = await getMeasurementUnits();
    if (error) {
        console.error('[API] GET /api/units error:', error);
        return res.status(500).json({ error });
    }
    console.log('[API] GET /api/units success:', data ? `${data.length} units` : 'no data');
    res.status(200).json({ data });
});

// ============================================================================
// MACRO CONSUMPTION ROUTES
// ============================================================================

/**
 * Get total consumption of a specific macro for a given date
 * GET /api/consumption/:date/:macroIdentifier
 * Params: date (YYYY-MM-DD), macroIdentifier (macro ID or macro name)
 * Returns: { date, macroId, macroName, totalConsumption, entries }
 */
app.get('/api/consumption/:date/:macroIdentifier', async (req, res) => {
    const { date, macroIdentifier } = req.params;

    if (!date || !macroIdentifier) {
        return res.status(400).json({ error: 'Missing required parameters: date (YYYY-MM-DD), macroIdentifier (ID or name)' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Resolve macro ID from identifier (ID or name)
    const { id: resolvedMacroId, error: resolveError } = await resolveMacroId(macroIdentifier);
    if (resolveError) {
        return res.status(404).json({ error: resolveError.message });
    }

    const { data, error } = await getMacroConsumptionForDate(date, resolvedMacroId);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

/**
 * Get total consumption of all macros for a given date
 * GET /api/consumption/:date
 * Params: date (YYYY-MM-DD)
 * Returns: { date, macroConsumption: { macroId: totalValue, ... }, totalEntries }
 */
app.get('/api/consumption/:date', async (req, res) => {
    const { date } = req.params;

    if (!date) {
        return res.status(400).json({ error: 'Missing required parameter: date (YYYY-MM-DD)' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const { data, error } = await getAllMacroConsumptionForDate(date);
    if (error) {
        return res.status(500).json({ error });
    }
    res.status(200).json({ data });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
    console.log(`\n✓ Backend running on port ${PORT}`);
    console.log(`✓ Backend URL: http://localhost:${PORT}`);
    console.log(`✓ API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`✓ Health check: http://localhost:${PORT}/ping\n`);
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});