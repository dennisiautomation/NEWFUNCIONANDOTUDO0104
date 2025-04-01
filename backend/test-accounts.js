const { sequelize, Account, User } = require('./pg-models');

async function testAccounts() {
    try {
        console.log('Iniciando teste de conexão com o banco de dados...');
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida com sucesso.');

        console.log('\nBuscando contas...');
        const accounts = await Account.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }]
        });

        console.log(`\nContas encontradas: ${accounts.length}`);
        console.log(JSON.stringify(accounts, null, 2));

        if (accounts.length === 0) {
            console.log('\nNenhuma conta encontrada. Verificando se o modelo Account existe.');
            
            // Verificar se a tabela Accounts existe
            const [tables] = await sequelize.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'Accounts';
            `);
            
            console.log(`Tabela Accounts existe: ${tables.length > 0}`);
            
            if (tables.length > 0) {
                // Verificar se há registros na tabela
                const [count] = await sequelize.query(`
                    SELECT COUNT(*) as count FROM "Accounts";
                `);
                
                console.log(`Registros na tabela Accounts: ${count[0].count}`);
                
                if (count[0].count > 0) {
                    // Buscar registros diretamente com SQL
                    const [rawAccounts] = await sequelize.query(`
                        SELECT a.*, u.name, u.email
                        FROM "Accounts" a
                        LEFT JOIN "Users" u ON a."userId" = u.id;
                    `);
                    
                    console.log('\nContas via SQL direto:');
                    console.log(JSON.stringify(rawAccounts, null, 2));
                }
            }
        }
    } catch (error) {
        console.error('Erro durante o teste:', error);
    } finally {
        process.exit(0);
    }
}

testAccounts();
