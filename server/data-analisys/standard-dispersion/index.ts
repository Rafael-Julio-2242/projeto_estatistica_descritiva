// Função para calcular a distribuição normal e percentual entre valores
export interface NormalDistributionResult {
  mean: number;
  standardDeviation: number;
  percentageInRange: number;
  totalFish: number;
  fishInRange: number;
  zScoreMin: number;
  zScoreMax: number;
  probabilityInRange: number;
  minRange: number;
  maxRange: number;
}

export interface FishData {
  weight: number; // peso em gramas
}

/**
 * Calcula estatísticas da distribuição normal do peso dos peixes
 * e determina o percentual entre o intervalo especificado
 */
export function calculateNormalDistribution(fishData: FishData[], minRange: number = 400, maxRange: number = 500): NormalDistributionResult {
  if (fishData.length === 0) {
    throw new Error('Nenhum dado de peixe fornecido');
  }

  // Extrair pesos
  const weights = fishData.map(fish => fish.weight);
  
  // Calcular média
  const mean = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
  
  // Calcular desvio padrão
  const variance = weights.reduce((sum, weight) => sum + Math.pow(weight - mean, 2), 0) / weights.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Contar peixes no intervalo especificado
  const fishInRange = weights.filter(weight => weight >= minRange && weight <= maxRange).length;
  const percentageInRange = (fishInRange / weights.length) * 100;
  
  // Calcular Z-scores para o intervalo
  const zScoreMin = (minRange - mean) / standardDeviation;
  const zScoreMax = (maxRange - mean) / standardDeviation;
  
  // Calcular probabilidade teórica usando distribuição normal
  const probabilityInRange = calculateNormalProbability(zScoreMin, zScoreMax);
  
  return {
    mean,
    standardDeviation,
    percentageInRange,
    totalFish: weights.length,
    fishInRange,
    zScoreMin,
    zScoreMax,
    probabilityInRange,
    minRange,
    maxRange
  };
}

/**
 * Função auxiliar para calcular probabilidade entre dois Z-scores
 * usando a tabela de distribuição normal padrão
 */
function calculateNormalProbability(z1: number, z2: number): number {
  // Função de densidade acumulada da distribuição normal (aproximação)
  const normalCDF = (z: number): number => {
    // Sinal
    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z);
    
    // Aproximação da função erro
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    
    return 0.5 * (1.0 + sign * y);
  };
  
  // Probabilidade entre z1 e z2
  const prob1 = normalCDF(z1);
  const prob2 = normalCDF(z2);
  
  return Math.abs(prob2 - prob1) * 100; // retornar como percentual
}

/**
 * Função para gerar dados de exemplo para teste
 */
export function generateSampleFishData(): FishData[] {
  // Gerar dados simulados com média ~450g e desvio padrão ~50g
  const sampleData: FishData[] = [];
  const mean = 450;
  const stdDev = 50;
  
  for (let i = 0; i < 1000; i++) {
    // Box-Muller transform para gerar números normais
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const weight = mean + z * stdDev;
    
    sampleData.push({ weight: Math.max(0, weight) }); // garantir peso não negativo
  }
  
  return sampleData;
}

/**
 * Função para formatar os resultados
 */
export function formatNormalDistributionResults(result: NormalDistributionResult): string {
  return `
=== ANÁLISE DA DISTRIBUIÇÃO NORMAL ===

📊 ESTATÍSTICAS BÁSICAS:
• Média: ${result.mean.toFixed(2)}
• Desvio padrão: ${result.standardDeviation.toFixed(2)}
• Total de dados analisados: ${result.totalFish}

🎯 ANÁLISE ENTRE ${result.minRange}-${result.maxRange}:
• Dados no intervalo: ${result.fishInRange}
• Percentual real: ${result.percentageInRange.toFixed(2)}%

📈 ANÁLISE TEÓRICA (Distribuição Normal):
• Z-score para ${result.minRange}: ${result.zScoreMin.toFixed(3)}
• Z-score para ${result.maxRange}: ${result.zScoreMax.toFixed(3)}
• Probabilidade teórica: ${result.probabilityInRange.toFixed(2)}%

📋 COMPARAÇÃO:
• Percentual observado: ${result.percentageInRange.toFixed(2)}%
• Percentual esperado (normal): ${result.probabilityInRange.toFixed(2)}%
• Diferença: ${Math.abs(result.percentageInRange - result.probabilityInRange).toFixed(2)}%
  `.trim();
}

// Exportar função principal como default
export default calculateNormalDistribution;