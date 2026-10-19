const knex = require('./src/database');

// Consultas somente leitura para inspecionar o banco
async function main() {
    try {
        const cols = await knex.raw(`
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);
        let current = '';
        for (const c of cols.rows) {
            if (c.table_name !== current) {
                current = c.table_name;
                console.log(`\n## ${current}`);
            }
            console.log(`  ${c.column_name} ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        }

        const constraints = await knex.raw(`
            SELECT t.relname, c.conname, pg_get_constraintdef(c.oid) AS def
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = 'public'
            ORDER BY t.relname
        `);
        console.log('\nCONSTRAINTS:');
        constraints.rows.forEach(r => console.log(`  ${r.relname}.${r.conname}: ${r.def}`));

        console.log('\nMIGRATIONS:', (await knex('knex_migrations').select('name')).map(r => r.name));
        console.log('\nCATEGORIAS:', await knex('categoria').select('*'));
        console.log('\nUSUARIOS por tipo/cargo:', (await knex.raw('SELECT tipo, cargo, count(*) FROM usuario GROUP BY 1, 2')).rows);
        console.log('\nOS por status:', (await knex.raw('SELECT status_inicial, count(*) FROM ordemservico GROUP BY 1')).rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
main();
