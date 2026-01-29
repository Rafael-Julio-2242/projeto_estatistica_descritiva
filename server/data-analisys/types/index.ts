
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