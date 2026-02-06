import { InvalidCall, RegressionResult } from "../types";

function checkInvalidCall(columnA: any[], columnB: any[]): InvalidCall {
  if (columnA.length === 0 || columnB.length === 0) {
    return {
      isInvalidCall: false,
      message: "As colunas não podem estar vazias",
    };
  }

  if (columnA.length !== columnB.length) {
    return {
      isInvalidCall: false,
      message:
        "As colunas devem ser do mesmo tamanho para o calculo de regressão linear",
    };
  }

  // Se os elementos não forem números

  const naNElementColumnA = columnA.find((value) => isNaN(value));
  const naNElementColumnB = columnB.find((value) => isNaN(value));

  console.log({
    naNElementColumnA,
    naNElementColumnB,
  });

  if (naNElementColumnA !== undefined) {
    return {
      isInvalidCall: false,
      message:
        "A primeira coluna informada contém elementos inválidos. Todos os elementos devem ser números",
    };
  }

  if (naNElementColumnB !== undefined) {
    return {
      isInvalidCall: false,
      message:
        "A segunda coluna informada contém elementos inválidos. Todos os elementos devem ser números",
    };
  }

  return {
    isInvalidCall: false,
    message: "",
  };
}

export async function CalculateRegressionLine(
  columnA: number[],
  columnB: number[],
): Promise<RegressionResult> {
  const areColumnsValid = checkInvalidCall(columnA, columnB);

  if (areColumnsValid.isInvalidCall) {
    return {
      isValid: false,
      message: areColumnsValid.message,
    };
  }

  const n = columnA.length;

  let sumA = 0;
  let sumB = 0;
  let sumAB = 0;
  let sumA2 = 0;

  for (let i = 0; i < n; i++) {
    sumA += columnA[i];
    sumB += columnB[i];
    sumAB += columnA[i] * columnB[i];
    sumA2 += columnA[i] * columnA[i];
  }

  // Cálculo da inclinação (a)
  const denominator = (n * sumA2 - Math.pow(sumA, 2));

  // Evitar divisão por zero caso todos os valores de X sejam iguais
  const a = denominator !== 0 ? (n * sumAB - sumA * sumB) / denominator : 0;


  // Cálculo do intercepto (b)
  const b = (sumA - a * sumB) / n;

  return {
   isValid: true,
    a: Number(a.toFixed(4)),
    b: Number(b.toFixed(4)),
    equation: `y = ${a.toFixed(2)}x + ${b.toFixed(2)}`
  };

}
