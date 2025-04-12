/**
 * Migração para alterar o campo currency de ENUM para STRING
 */
const { sequelize } = require('../pg-models');

async function updateCurrencyField() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Iniciando migração para alterar o campo currency');
    
    // Primeiro, criar uma coluna temporária
    await sequelize.query(
      `ALTER TABLE "Accounts" ADD COLUMN "currency_new" VARCHAR(10);`,
      { transaction }
    );
    console.log('Coluna temporária criada');
    
    // Copiar os valores da coluna antiga para a nova
    await sequelize.query(
      `UPDATE "Accounts" SET "currency_new" = "currency"::text;`,
      { transaction }
    );
    console.log('Dados copiados para a coluna temporária');
    
    // Remover a coluna antiga
    await sequelize.query(
      `ALTER TABLE "Accounts" DROP COLUMN "currency";`,
      { transaction }
    );
    console.log('Coluna antiga removida');
    
    // Renomear a coluna temporária
    await sequelize.query(
      `ALTER TABLE "Accounts" RENAME COLUMN "currency_new" TO "currency";`,
      { transaction }
    );
    console.log('Coluna temporária renomeada');
    
    // Adicionar restrição NOT NULL
    await sequelize.query(
      `ALTER TABLE "Accounts" ALTER COLUMN "currency" SET NOT NULL;`,
      { transaction }
    );
    console.log('Restrição NOT NULL adicionada');
    
    // Adicionar validação para os valores permitidos
    await sequelize.query(
      `ALTER TABLE "Accounts" ADD CONSTRAINT "currency_check" CHECK ("currency" IN ('USD', 'EUR', 'USDT', 'BRL'));`,
      { transaction }
    );
    console.log('Restrição CHECK adicionada');
    
    // Commit da transação
    await transaction.commit();
    console.log('Migração concluída com sucesso');
    
  } catch (error) {
    // Rollback em caso de erro
    await transaction.rollback();
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    // Fechar conexão
    await sequelize.close();
  }
}

// Executar a migração
updateCurrencyField()
  .then(() => {
    console.log('Migração finalizada com sucesso');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  });
