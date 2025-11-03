export type Quantile = {
  value: number;
  type: "quartile" | "decile" | "percentile";
  name: string;
};

export default function CalculateQuantiles(inputData: number[]) {
  const quantiles: Quantile[] = [];

  // Calcular primeiro os Quartis, depois os Decis e por fim os percentis

  const totalValues = inputData.length;

  const data = inputData;

  data.sort((a, b) => a - b);

  const median = totalValues % 2 === 0 ? (data[totalValues / 2 - 1] + data[totalValues / 2]) / 2 : data[Math.floor(totalValues / 2)];

  // Calculando os Quartis
  quantiles.push(
    {
      value: data[Math.floor(totalValues * 0.25)],
      type: "quartile",
      name: "Q1",
    },
    {
      value: median,
      type: "quartile",
      name: "Q2",
    },
    {
      value: data[Math.floor(totalValues * 0.75)],
      type: "quartile",
      name: "Q3",
    }
  );

  // Calculando os Decis
  quantiles.push(
   {
    value: data[Math.floor(totalValues * 0.1)],
    type: "decile",
    name: "D1",
   },
   {
    value: data[Math.floor(totalValues * 0.2)],
    type: "decile",
    name: "D2",
   },
   {
    value: data[Math.floor(totalValues * 0.3)],
    type: "decile",
    name: "D3",
   },
   {
    value: data[Math.floor(totalValues * 0.4)],
    type: "decile",
    name: "D4",
   },
   {
    value: median,
    type: "decile",
    name: "D5",
   },
   {
    value: data[Math.floor(totalValues * 0.6)],
    type: "decile",
    name: "D6",
   },
   {
    value: data[Math.floor(totalValues * 0.7)],
    type: "decile",
    name: "D7",
   },
   {
    value: data[Math.floor(totalValues * 0.8)],
    type: "decile",
    name: "D8",
   },
   {
    value: data[Math.floor(totalValues * 0.9)],
    type: "decile",
    name: "D9",
   },
  )

  return quantiles;
}
