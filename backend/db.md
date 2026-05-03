# Database Documentation

> **Provider**: Supabase (PostgreSQL)
> **Schema**: `public`
> **Last Updated**: 2025-05
> **RLS Status**: ⚠️ Disabled on all tables (testing phase — enable before production)

---

## Table of Contents
- [Enums](#enums)
- [Tables](#tables)
  - [macros](#macros)
  - [foods](#foods)
  - [food-macro](#food-macro)
  - [food-entry](#food-entry)
- [Relationships](#relationships)
- [Database Functions](#database-functions)
- [RLS Policies](#rls-policies)
- [Notes for AI / Copilot](#notes-for-ai--copilot)

---

## Enums

### `Measurement`
> Schema: `public`

Used to express units of measurement across the app.

| Value  | Description              |
|--------|--------------------------|
| `ml`   | Millilitres              |
| `g`    | Grams                    |
| `mg`   | Milligrams               |
| `ug`   | Micrograms               |
| `kcal` | Kilocalories (calories)  |

---

## Tables

### `Macros`

Stores the list of trackable macros/nutrients (e.g. Protein, Carbs, Fat, Calories).

| Column             | Type          | Constraints                  | Description                              |
|--------------------|---------------|------------------------------|------------------------------------------|
| `id`               | `int8`        | PRIMARY KEY, IDENTITY, NOT NULL | Auto-incrementing primary key         |
| `created_at`       | `timestamptz` | NOT NULL                     | Row creation timestamp                   |
| `name`             | `text`        | UNIQUE, NOT NULL             | Name of the macro (e.g. "Protein")       |
| `home_display`     | `bool`        | NOT NULL                     | Whether this macro shows on the home page|
| `measurement_unit` | `Measurement` | NOT NULL                     | Unit used to measure this macro (enum)   |
| `target`           | `float4`      | NOT NULL                     | Daily target amount for this macro       |

---

### `Foods`

Master list of food items that can be logged.

| Column             | Type          | Constraints                  | Description                        |
|--------------------|---------------|------------------------------|------------------------------------|
| `id`               | `int8`        | PRIMARY KEY, IDENTITY, NOT NULL | Auto-incrementing primary key   |
| `created_at`       | `timestamptz` | NOT NULL                     | Row creation timestamp             |
| `name`             | `text`        | UNIQUE, NOT NULL             | Name of the food item              |
| `measurement_unit` | `Measurement` | NOT NULL                     | Unit for measuring this food (ml/g)|
| `serving_size`     | `float8`      | NOT NULL                     | The baseline serving size of the food |

---

### `food-macro`

Junction table linking foods to their macro content. Stores how much of a given macro is present per baseline serving size of a food.

| Column         | Type          | Constraints                  | Description                                      |
|----------------|---------------|------------------------------|--------------------------------------------------|
| `id`           | `int8`        | PRIMARY KEY, IDENTITY, NOT NULL | Auto-incrementing primary key                 |
| `created_at`   | `timestamptz` | NOT NULL                     | Row creation timestamp                           |
| `food_id`      | `int8`        | FOREIGN KEY, NOT NULL        | References `Foods.id`                            |
| `macro_id`     | `int8`        | FOREIGN KEY, NOT NULL        | References `Macros.id`                           |
| `value`        | `float8`      | NOT NULL                     | Amount of the macro per baseline `serving_size` of food |

**Example**: Food "Oats" has baseline `serving_size = 100` (g) in `Foods` table, `macro_id → Protein` with `value = 13.5` (g of protein per 100g).

---

### `food-entry`

Logs of food consumed by a user on a specific date.

| Column         | Type          | Constraints                  | Description                                  |
|----------------|---------------|------------------------------|----------------------------------------------|
| `id`           | `int8`        | PRIMARY KEY, IDENTITY, NOT NULL | Auto-incrementing primary key             |
| `created_at`   | `timestamptz` | NOT NULL                     | Row creation timestamp                       |
| `food_id`      | `int8`        | FOREIGN KEY, **NULLABLE**    | References `foods.id` (nullable — see note)  |
| `servings`     | `float8`      | NOT NULL                     | Number of servings consumed                  |
| `eaten_on_date`| `date`        | NOT NULL                     | The date the food was consumed               |

> ⚠️ **Note**: `food_id` is nullable — this may be intentional to support custom/untracked food entries. Clarify and document intent here when known.

---

## Relationships

```
macros (1) ──────────────── (M) food-macro
Foods  (1) ──────────────── (M) food-macro
Foods  (1) ──────────────── (M) food-entry
```

- `food-macro.food_id` → `Foods.id`
- `food-macro.macro_id` → `Macros.id`
- `food-entry.food_id` → `Foods.id` *(nullable)*

**To calculate total macro intake for a day:**
1. Get all `food-entry` rows for the target date
2. For each entry, get `food-macro` rows matching `food_id`
3. Scale each macro `value` by `(entry.servings * entry_serving_size / food_macro.serving_size)`

---

## Database Functions

### `get_enum_values(enum_type_name text)`
> Schema: `public` | Language: `plpgsql`

Returns all values of a given PostgreSQL enum type. Used to dynamically fetch enum options (e.g. for dropdowns) without hardcoding them in the app.

**Arguments:**
| Argument         | Type   | Description                  |
|------------------|--------|------------------------------|
| `enum_type_name` | `text` | Name of the enum (e.g. `'Measurement'`) |

**Returns:** `TABLE(enumlabel text)` — ordered list of enum values.

**Usage example:**
```sql
SELECT * FROM get_enum_values('Measurement');
-- Returns: ml, g, mg, ug, kcal
```

---

## RLS Policies

> ⚠️ **RLS is currently DISABLED on all tables** during the testing phase.

When enabling RLS for production, apply the following policies:

| Table        | Policy intent                                         | Suggested condition                    |
|--------------|-------------------------------------------------------|----------------------------------------|
| `macros`     | Read-only for all authenticated users (shared config) | `auth.role() = 'authenticated'`        |
| `foods`      | Read-only for all authenticated users (shared config) | `auth.role() = 'authenticated'`        |
| `food-macro` | Read-only for all authenticated users                 | `auth.role() = 'authenticated'`        |
| `food-entry` | Users can only access their own entries               | `auth.uid() = user_id` *(add user_id)* |

> 🔲 **TODO**: `food-entry` does not currently have a `user_id` column. Add `user_id uuid REFERENCES auth.users(id)` before enabling RLS.

---

## Notes for AI / Copilot

- Table names use **kebab-case** (`food-macro`, `food-entry`) — use quotes in raw SQL: `"food-macro"`
- All IDs are `int8` (bigint), not UUID
- `Measurement` is a **custom PostgreSQL enum**, not a text field — do not insert arbitrary strings
- `food-entry.food_id` is nullable — always null-check before joining
- To get measurement unit values, use `get_enum_values('Measurement')` or the hardcoded list: `['ml', 'g', 'mg', 'ug', 'kcal']`
- No `user_id` exists yet on any table — the app is likely single-user or pre-auth at this stage
- `macros.target` is a daily target value, stored in the macro's own `measurement_unit`
- `food-macro.value` represents macro content **relative to** `serving_size` — always scale when calculating actual intake

---

<!-- 
CHANGELOG (add entries here as schema evolves):
- 2025-05: Initial schema documented. RLS disabled. No user_id column yet.
-->