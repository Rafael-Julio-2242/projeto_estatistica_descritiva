// Função para calcular a distribuição binomial genérica
export interface BinomialDistributionResult {
  probabilityOfSuccess: number;       // Probabilidade empírica de sucesso
  probabilityOfFailure: number;        // Probabilidade empírica de fracasso
  probabilityOfExactlyK: number;       // Probabilidade de exatamente K sucessos
  probabilityOfAtLeastK: number;       // Probabilidade de pelo menos K sucessos
  probabilityOfAtMostK: number;        // Probabilidade de no máximo K sucessos
  expectedNumberOfSuccess: number;      // Número esperado de sucessos
  variance: number;                     // Variância
  totalTrials: number;                 // Total de tentativas
  k: number;                           // Número de sucessos desejados
  n: number;                           // Total de tentativas
  p: number;                           // Probabilidade de sucesso teórica
}

export interface GenericData {
  value: boolean | number; // Valor do dado (true/false ou 1/0)
}

/**
 * Calcula a distribuição binomial genérica para qualquer situação
 * Exemplos: sexo (M/F), sucesso/fracasso, sim/não, 1/0, etc.
 */
export function calculateBinomialDistribution(
  data: GenericData[], 
  k: number, 
  n: number,
  p: number = 0.5
): BinomialDistributionResult {
  if (data.length === 0) {
    throw new Error('Nenhum dado fornecido');
  }

  if (k > n) {
    throw new Error('O número de sucessos (k) não pode ser maior que o total de tentativas (n)');
  }

  if (p < 0 || p > 1) {
    throw new Error('A probabilidade de sucesso (p) deve estar entre 0 e 1');
  }

  // Contar sucessos e fracassos nos dados
  const successCount = data.filter(item => {
    if (typeof item.value === 'boolean') {
      return item.value === true;
    } else {
      return item.value === 1;
    }
  }).length;
  
  const failureCount = data.length - successCount;
  
  // Calcular probabilidade empírica de sucesso
  const empiricalSuccessProbability = successCount / data.length;
  
  // Calcular probabilidade usando a fórmula binomial
  // P(X = k) = C(n,k) * p^k * (1-p)^(n-k)
  const binomialCoefficient = calculateBinomialCoefficient(n, k);
  const probabilityOfExactlyK = binomialCoefficient * Math.pow(p, k) * Math.pow(1 - p, n - k);
  
  // Calcular probabilidades acumuladas
  let probabilityOfAtLeastK = 0;
  let probabilityOfAtMostK = 0;
  
  for (let i = k; i <= n; i++) {
    const coefficient = calculateBinomialCoefficient(n, i);
    const prob = coefficient * Math.pow(p, i) * Math.pow(1 - p, n - i);
    probabilityOfAtLeastK += prob;
  }
  
  for (let i = 0; i <= k; i++) {
    const coefficient = calculateBinomialCoefficient(n, i);
    const prob = coefficient * Math.pow(p, i) * Math.pow(1 - p, n - i);
    probabilityOfAtMostK += prob;
  }
  
  // Calcular estatísticas da distribuição binomial
  const expectedNumberOfSuccess = n * p;
  const variance = n * p * (1 - p);
  
  return {
    probabilityOfSuccess: empiricalSuccessProbability,
    probabilityOfFailure: 1 - empiricalSuccessProbability,
    probabilityOfExactlyK: probabilityOfExactlyK,
    probabilityOfAtLeastK: probabilityOfAtLeastK,
    probabilityOfAtMostK: probabilityOfAtMostK,
    expectedNumberOfSuccess: expectedNumberOfSuccess,
    variance: variance,
    totalTrials: data.length,
    k: k,
    n: n,
    p: p
  };
}

/**
 * Calcula o coeficiente binomial C(n,k) = n! / (k! * (n-k)!)
 */
function calculateBinomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  
  // Otimização para evitar cálculos repetidos
  if (k === 0 || k === n) {
    return 1;
  }
  
  // Calcular de forma iterativa para evitar overflow
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = result * (n - k + i) / i;
  }
  
  return result;
}

/**
 * Função para gerar dados de exemplo para teste
 */
export function generateSampleData(totalTrials: number = 100, successProbability: number = 0.5): GenericData[] {
  const sampleData: GenericData[] = [];
  
  for (let i = 0; i < totalTrials; i++) {
    const isSuccess = Math.random() < successProbability;
    sampleData.push({
      value: isSuccess
    });
  }
  
  return sampleData;
}

/**
 * Função para formatar os resultados da análise binomial genérica
 */
export function formatBinomialResults(result: BinomialDistributionResult, situation: string = "sucesso"): string {
  return `
=== ANÁLISE DA DISTRIBUIÇÃO BINOMIAL - ${situation.toUpperCase()} ===

📊 DADOS OBSERVADOS:
• Total de tentativas: ${result.totalTrials}
• Probabilidade empírica (${situation}): ${(result.probabilityOfSuccess * 100).toFixed(2)}%
• Probabilidade empírica (fracasso): ${(result.probabilityOfFailure * 100).toFixed(2)}%

🎯 CENÁRIO ESPECÍFICO: ${result.k} ${situation}(s) em ${result.n} tentativas
• Probabilidade teórica (exatamente ${result.k}): ${(result.probabilityOfExactlyK * 100).toFixed(4)}%
• Probabilidade teórica (pelo menos ${result.k}): ${(result.probabilityOfAtLeastK * 100).toFixed(4)}%
• Probabilidade teórica (no máximo ${result.k}): ${(result.probabilityOfAtMostK * 100).toFixed(4)}%

📈 ESTATÍSTICAS DA DISTRIBUIÇÃO BINOMIAL:
• Probabilidade de sucesso (p): ${(result.p * 100).toFixed(1)}%
• Número esperado de ${situation}(s): ${result.expectedNumberOfSuccess.toFixed(2)}
• Variância: ${result.variance.toFixed(4)}
• Desvio padrão: ${Math.sqrt(result.variance).toFixed(4)}

🔍 COMPARAÇÃO:
• Probabilidade empírica (observada): ${(result.probabilityOfSuccess * 100).toFixed(2)}%
• Probabilidade teórica (binomial): ${(result.p * 100).toFixed(1)}%
• Diferença: ${Math.abs(result.probabilityOfSuccess - result.p).toFixed(4)}%

💡 INTERPRETAÇÃO:
A chance de exatamente ${result.k} ${situation}(s) em ${result.n} tentativas 
é de ${(result.probabilityOfExactlyK * 100).toFixed(4)}%.

Isso significa que, em média, a cada ${Math.round(1/result.probabilityOfExactlyK)} grupos de ${result.n} tentativas,
esperamos encontrar exatamente ${result.k} ${situation}(s).
  `.trim();
}

/**
 * Função específica para análise de sexo (mantém compatibilidade)
 */
export function analyzeSexDistribution(birthData: any[], k: number = 3, n: number = 10): BinomialDistributionResult {
  // Converter dados genéricos para formato específico de sexo
  const sexData: GenericData[] = birthData.map(birth => {
    const sex = typeof birth === 'string' ? birth.toLowerCase() : birth.sex?.toLowerCase();
    return {
      value: sex === 'm' || sex === 'M' || sex === 'masculino'
    };
  });
  
  return calculateBinomialDistribution(sexData, k, n, 0.5);
}

// Exportar função principal como default
export default calculateBinomialDistribution;