// Adapter boundary: this observes public tables, enum labels and PostgreSQL
// constraints. It does not establish query performance, row contents, RLS, or
// the behaviour of external dependencies.
export async function observePostgres(pool) {
    const [columns, enums, constraints] = await Promise.all([
        pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position"),
        pool.query("SELECT t.typname AS type_name, e.enumlabel AS enum_value FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' ORDER BY t.typname, e.enumsortorder"),
        pool.query("SELECT c.relname AS table_name, pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' ORDER BY c.relname, k.conname"),
    ]);
    const observation = { columns: {}, enums: {}, constraints: constraints.rows.map((row) => ({ table: row.table_name, definition: row.definition })) };
    for (const row of columns.rows)
        (observation.columns[row.table_name] ??= []).push(row.column_name);
    for (const row of enums.rows)
        (observation.enums[row.type_name] ??= []).push(row.enum_value);
    return observation;
}
