
type StatsBlock = {
  count: number;
};

type RangeBlock = {
  minValue: number;
  maxValue: number;
  value: number;      // amplitude = max-min
  countNumber: number;
};

type QuartileBlock = {
  q1: number;
  q3: number;
  iqr: number;        // q3-q1
  countNumber: number;
};

type MeanBlock = {
  mean: number;
  countNumber: number;
};

type VarianceBlock = {
  variance: number;
  countNumber: number;
};

type StandardDeviationBlock = {
  standardDeviation: number;
  countNumber: number;
};

type CoefficientOfVariationBlock = {
  coefficientOfVariation: number | null;
  countNumber: number;
};

type SummaryStats = {
  stats: StatsBlock;
  range: RangeBlock;
  quartiles: QuartileBlock;
  mean: MeanBlock;
  variance: VarianceBlock;
  standardDeviation: StandardDeviationBlock;
  coefficientOfVariation: CoefficientOfVariationBlock;
};


export default function CalculateDispersion(inputData: number[]): SummaryStats {

    const data = inputData;

    const totalValues = data.length;

    data.sort((a, b) => a - b);

    // Range
    const minValue = data[0];
    const maxValue = data[data.length - 1];
    const rangeValue = maxValue - minValue;

    const rangeBlock: RangeBlock = {
        minValue,
        maxValue,
        value: rangeValue,
        countNumber: totalValues
    }

    const mean = data.reduce((a, b) => a + b) / totalValues;

    const meanBlock: MeanBlock = {
        mean,
        countNumber: totalValues
    }

    // Quantiles
    const q1 = percentile(data, 0.25);
    const q3 = percentile(data, 0.75);
    const iqr = q3 - q1;

    const quartileBlock: QuartileBlock = {
        q1,
        q3,
        iqr,
        countNumber: totalValues
    }

    // Variance
    const variance =
    data.reduce((sum, x) => sum + (x - mean) ** 2, 0) / totalValues;

    const varianceBlock: VarianceBlock = {
        variance,
        countNumber: totalValues
    }

    // Standard Deviation
    const standardDeviation = Math.sqrt(variance);

    const standardDeviationBlock: StandardDeviationBlock = {
        standardDeviation,
        countNumber: totalValues
    }

    // variation coefficient
    const coefficientOfVariation =
        mean !== 0 ? standardDeviation / Math.abs(mean) : null;

    const coefficientOfVariationBlock: CoefficientOfVariationBlock = {
        coefficientOfVariation,
        countNumber: totalValues
    }

    return {
        stats: {
            count: totalValues
        },
        range: rangeBlock,
        quartiles: quartileBlock,
        mean: meanBlock,
        variance: varianceBlock,
        standardDeviation: standardDeviationBlock,
        coefficientOfVariation: coefficientOfVariationBlock
    }

}


function percentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const rank = (n - 1) * p;
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;
  if (upperIndex >= n) {
    return sorted[lowerIndex];
  }
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}