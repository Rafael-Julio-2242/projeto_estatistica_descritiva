import { ColumnType } from "../initial-treatment/define-columns-types";

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

export default function CalculateColumnFrequencies(inputData: any[]) {

    // Vou calcular todas as frequências para apenas uma Coluna aqui
    // Aqui eu assumo que as informações que eu estou recebendo é de uma coluna apenas

    const frequenciesMap = new Map<string, ColumnFrequencyValue>();
    let absoluteCumulativeFrequency = 0; 
    const data = inputData;
    
    let calculateAbsoluteAccumulativeFrequency = true;

    if (isNaN(Number(data[1]))) {
        calculateAbsoluteAccumulativeFrequency = false;
    }
    data.shift();

    if (calculateAbsoluteAccumulativeFrequency) {
        // preciso ordenar os valores para que eu possa calcular as frequências acumulativas
        data.sort((a, b) => a - b);
    }

    const totalValues = data.length;
    
    for (let i = 0; i < data.length; i++) {
        const value = data[i];


        if (!frequenciesMap.has(`${value}`)) {
            // No caso, é a primeira vez que o valor aparece
            // Então, a frequência absoluta é 1
            // A frequência relativa é a porcentagem que esse cara que apareceu uma vez tem sobre o total de valores
            // A frequência acumulativa é a soma de todas as frequências absolutas anteriores até agora

            const relativeFrequency = 1 / totalValues;            
            absoluteCumulativeFrequency++;
            frequenciesMap.set(`${value}`, {
                value: `${value}`,
                relativeFrequency,
                absoluteCumulativeFrequency: calculateAbsoluteAccumulativeFrequency ? absoluteCumulativeFrequency : undefined,
                absoluteFrequency: 1
            })
            continue;
        }

        const frequencyValue = frequenciesMap.get(`${value}`);

        if (!frequencyValue) {
            continue;
        }

        absoluteCumulativeFrequency++;

        let currentAbsoluteFrequency = frequencyValue.absoluteFrequency;
        let currentAbsoluteCumulativeFrequency = frequencyValue.absoluteCumulativeFrequency;
        let currentRelativeFrequency = frequencyValue.relativeFrequency;

        currentAbsoluteFrequency++;
        currentAbsoluteCumulativeFrequency = calculateAbsoluteAccumulativeFrequency ? absoluteCumulativeFrequency : undefined;
        currentRelativeFrequency = currentAbsoluteFrequency / totalValues;

        frequencyValue.absoluteFrequency = currentAbsoluteFrequency;
        frequencyValue.absoluteCumulativeFrequency = currentAbsoluteCumulativeFrequency;
        frequencyValue.relativeFrequency = currentRelativeFrequency;

        frequenciesMap.set(`${value}`, frequencyValue);

    }

    return Array.from(frequenciesMap.values());
}
