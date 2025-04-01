/**
 * Script para corrigir problemas críticos no código do frontend compilado
 */
const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos JS compilados do frontend
const buildDir = path.join(__dirname, 'build');
const jsDir = path.join(buildDir, 'static', 'js');

console.log('Iniciando correções no frontend compilado...');

// 1. Buscar todos os arquivos JS
try {
    const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    console.log(`Encontrados ${files.length} arquivos JS para verificar`);

    // 2. Aplicar correções a cada arquivo
    let filesFixed = 0;
    for (const file of files) {
        const filePath = path.join(jsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // 3. Correção mais específica para o formatCurrency
        // Procurar pelo padrão específico da função formatCurrency 
        const formatCurrencyPattern = /function\s+([a-zA-Z0-9_$]+)\s*\(\s*([a-zA-Z0-9_$]+)\s*,\s*([a-zA-Z0-9_$]+)\s*\)\s*\{\s*(?:try\s*\{)?\s*(?:return\s+)?new\s+Intl\.NumberFormat\([^}]+\}\s*catch/;
        if (formatCurrencyPattern.test(content)) {
            console.log("Encontrada função formatCurrency para correção");
            
            // Substitua a função formatCurrency inteira
            content = content.replace(
                formatCurrencyPattern,
                `function $1($2, $3) {
                  try {
                    if ($3 === "USDT" || $3 === "USDC" || $3 === "BTC" || $3 === "ETH") {
                      return parseFloat($2).toFixed(2) + " " + $3;
                    }
                    return new Intl.NumberFormat('pt-BR', {
                      style: 'currency', 
                      currency: $3 || 'USD'
                    }).format($2);
                  } catch`
            );
        } else {
            // Se não encontrar o padrão específico, tente uma abordagem mais simples
            console.log("Padrão específico não encontrado, aplicando correção genérica");
            
            // Substituir todas as ocorrências de Intl.NumberFormat diretamente
            // Esta é uma abordagem mais genérica que pode funcionar em mais casos
            content = content.replace(
                /new\s+Intl\.NumberFormat\(['"]pt-BR['"]\s*,\s*\{\s*style:\s*['"]currency['"]\s*,\s*currency:\s*([^\}]+)\}\)/g,
                `(function(curr) { 
                   try { 
                     if (curr === "USDT" || curr === "USDC" || curr === "BTC" || curr === "ETH") {
                       return { format: function(val) { return parseFloat(val).toFixed(2) + " " + curr; } };
                     }
                     return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: curr });
                   } catch(e) { 
                     console.warn("Erro ao criar formatador:", e);
                     return { format: function(val) { return parseFloat(val).toFixed(2); } };
                   } 
                 })($1)`
            );
        }

        // 4. Corrigir problema de conteúdo misto
        // Substituir chamadas diretas à API FT pelo nosso proxy
        content = content.replace(
            /http:\/\/mytest\.ftassetmanagement\.com\/api\/([A-Za-z_]+)\.asp/g,
            'https://global.newcashbank.com.br/api/proxy/ft-asset/$1'
        );

        // 5. Salvar as alterações
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            filesFixed++;
            console.log(`Arquivo corrigido: ${file}`);
        }
    }

    console.log(`Correções concluídas! ${filesFixed} arquivos modificados.`);
} catch (error) {
    console.error('Erro ao aplicar correções:', error);
    process.exit(1);
}
