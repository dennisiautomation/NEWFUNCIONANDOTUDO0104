-- Migração para adicionar BRL ao tipo ENUM de moedas
-- Primeiro, criamos um novo tipo com os valores atualizados
CREATE TYPE "enum_Accounts_currency_new" AS ENUM ('USD', 'EUR', 'USDT', 'BRL');

-- Depois, atualizamos a coluna para usar o novo tipo
ALTER TABLE "Accounts" 
  ALTER COLUMN "currency" TYPE "enum_Accounts_currency_new" 
  USING ("currency"::text::"enum_Accounts_currency_new");

-- Por fim, removemos o tipo antigo e renomeamos o novo
DROP TYPE "enum_Accounts_currency";
ALTER TYPE "enum_Accounts_currency_new" RENAME TO "enum_Accounts_currency";

-- Adicionar uma função para resetar os totais de transferência diários
CREATE OR REPLACE FUNCTION reset_daily_transfer_totals()
RETURNS void AS $$
BEGIN
  UPDATE "Accounts" SET "dailyTransferTotal" = 0 WHERE DATE("lastTransferDate") < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Adicionar uma função para resetar os totais de transferência mensais
CREATE OR REPLACE FUNCTION reset_monthly_transfer_totals()
RETURNS void AS $$
BEGIN
  UPDATE "Accounts" 
  SET "monthlyTransferTotal" = 0, "lastMonthReset" = CURRENT_DATE 
  WHERE DATE("lastMonthReset") < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;
