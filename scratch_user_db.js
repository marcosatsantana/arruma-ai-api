const knex = require('./src/database');

async function main() {
    try {
        const columns = await knex.raw(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuario'
        `);
        console.log("Usuario columns:", columns.rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
main();
