import calculateBinomialDistribution, { generateSampleData, formatBinomialResults, analyzeSexDistribution, type GenericData } from './index';

// Exemplo de uso da distribuição binomial genérica
function exampleUsage() {
  console.log('=== EXEMPLO DE USO - DISTRIBUIÇÃO BINOMIAL GENÉRICA ===\n');
  
  // Exemplo 1: Análise de sexo (questão original)
  console.log('\n📊 EXEMPLO 1: Análise de sexo em 10 nascimentos');
  const sexData = [
    { sex: 'M' }, { sex: 'F' }, { sex: 'M' }, { sex: 'F' }, { sex: 'M' },
    { sex: 'F' }, { sex: 'M' }, { sex: 'F' }, { sex: 'M' }, { sex: 'F' }
  ];
  
  const sexResult = analyzeSexDistribution(sexData, 3, 10);
  console.log(formatBinomialResults(sexResult, 'homem'));
  console.log(`Resposta: Chance de 3 homens em 10 nascimentos = ${(sexResult.probabilityOfExactlyK * 100).toFixed(4)}%\n`);
  
  // Exemplo 2: Análise de sucesso/fracasso em testes
  console.log('\n📊 EXEMPLO 2: Análise de sucesso em 20 testes');
  const testData = [
    { value: true }, { value: false }, { value: true }, { value: false }, { value: true },
    { value: false }, { value: true }, { value: false }, { value: true }, { value: false },
    { value: true }, { value: false }, { value: true }, { value: false }, { value: true },
    { value: false }, { value: true }, { value: false }, { value: true }, { value: false },
    { value: true }, { value: false }
  ];
  
  const testResult = calculateBinomialDistribution(testData, 8, 20, 0.6);
  console.log(formatBinomialResults(testResult, 'sucesso'));
  console.log(`Resposta: Chance de 8 sucessos em 20 testes = ${(testResult.probabilityOfExactlyK * 100).toFixed(4)}%\n`);
  
  // Exemplo 3: Análise de produtos defeituosos (p=0.1)
  console.log('\n📊 EXEMPLO 3: Análise de defeitos em 50 produtos');
  const defectData = generateSampleData(50, 0.1); // 10% de defeito
  const defectResult = calculateBinomialDistribution(defectData, 5, 50, 0.1);
  console.log(formatBinomialResults(defectResult, 'defeito'));
  console.log(`Resposta: Chance de 5 defeitos em 50 produtos = ${(defectResult.probabilityOfExactlyK * 100).toFixed(4)}%\n`);
  
  // Exemplo 4: Análise de aprovação em provas (p=0.75)
  console.log('\n📊 EXEMPLO 4: Análise de aprovação em 30 provas');
  const approvalData = generateSampleData(30, 0.75); // 75% de aprovação
  const approvalResult = calculateBinomialDistribution(approvalData, 25, 30, 0.75);
  console.log(formatBinomialResults(approvalResult, 'aprovação'));
  console.log(`Resposta: Chance de 25 aprovações em 30 provas = ${(approvalResult.probabilityOfExactlyK * 100).toFixed(4)}%\n`);
  
  // Exemplo 5: Dados booleanos diretos
  console.log('\n📊 EXEMPLO 5: Dados booleanos diretos');
  const booleanData = [
    { value: true }, { value: false }, { value: true }, { value: false }, { value: true },
    { value: false }, { value: true }, { value: false }, { value: true }, { value: false },
    { value: true }, { value: false }, { value: true }, { value: false }, { value: true }
  ];
  
  const booleanResult = calculateBinomialDistribution(booleanData, 7, 15, 0.5);
  console.log(formatBinomialResults(booleanResult, 'verdadeiro'));
  console.log(`Resposta: Chance de 7 verdadeiros em 15 tentativas = ${(booleanResult.probabilityOfExactlyK * 100).toFixed(4)}%\n`);
  
  // Exemplo 6: Dados numéricos (1/0)
  console.log('\n📊 EXEMPLO 6: Dados numéricos (1/0)');
  const numericData = [
    { value: 1 }, { value: 0 }, { value: 1 }, { value: 0 }, { value: 1 },
    { value: 0 }, { value: 1 }, { value: 0 }, { value: 1 }, { value: 0 },
    { value: 1 }, { value: 0 }, { value: 1 }, { value: 0 }, { value: 1 }, { value: 0 }
  ];
  
  const numericResult = calculateBinomialDistribution(numericData, 6, 12, 0.5);
  console.log(formatBinomialResults(numericResult, 'um'));
  console.log(`Resposta: Chance de 6 uns em 12 tentativas = ${(numericResult.probabilityOfExactlyK * 100).toFixed(4)}%\n`);
}

// Executar exemplo
if (require.main === module) {
  exampleUsage();
}

export { exampleUsage };
