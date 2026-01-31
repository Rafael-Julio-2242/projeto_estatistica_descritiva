
export enum Frequency {
    ABSOLUTE = "Frequência Absoluta",
    RELATIVE = "Frequência Relativa",
    ACUMULATIVE = "Frequência Acumulativa"    
}

export type ColumnFrequencyValue = {
    value: string,
    relativeFrequency: number,
    absoluteCumulativeFrequency?: number,
    absoluteFrequency: number,
}

export enum PearsonCorrelationType {
    WEAK,
    MEDIUM,
    STRONG
}

export type PearsonCalcResponse = {
    success: true;
    value: number;
    type: PearsonCorrelationType;
    direction: "positive" | "negative"
} | {
    success: false;
    message: string;
}