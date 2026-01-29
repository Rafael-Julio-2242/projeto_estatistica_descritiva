"use server";

import { ColumnFrequencyValue } from "../types";

export async function CalculateColumnFrequencies(inputData: any[], rangesCalculation?: boolean) {

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

    if (rangesCalculation && calculateAbsoluteAccumulativeFrequency) {
        // TODO Aqui começa o tratamento para o cálculo de "ranges" da parada

        const sqrt = Math.sqrt(data.length);
        const minValue = data.reduce((a, b) => Math.min(a, b));
        const maxValue = data.reduce((a, b) => Math.max(a, b));

        console.log({
            minValue,
            maxValue,
            sqrt
        })
        
        const valuesDiff = maxValue - minValue;

        console.log({
            valuesDiff
        });

        const range = Number((valuesDiff / sqrt).toFixed(3))
        data.sort((a, b) => a - b);

        console.log({
            range
        });

        // Preciso agrupar os valores por "range", e dai definir a frequência de cada range

        let helperData = data;

        let currentMinValue = minValue;
        let currentMaxValue = currentMinValue + range;

        const finalIndex = data.length - 1;

        let index = 0;
        
        console.log('[CALCULATING RANGES.....]');
        while (true) {
            const groupValues = helperData.filter((value, index) => {
                if (finalIndex === index) return true;

                if (value >= currentMinValue && value < currentMaxValue) {
                    return true;
                }

                return false
            });

            absoluteCumulativeFrequency += groupValues.length;

            frequenciesMap.set(`${currentMinValue} - ${currentMaxValue}`, {
                value: `${currentMinValue} - ${currentMaxValue}`,
                relativeFrequency: groupValues.length / totalValues,
                absoluteFrequency: groupValues.length,
                absoluteCumulativeFrequency: absoluteCumulativeFrequency
            });

            helperData = helperData.filter((value) => {
                const gp = groupValues.find((groupValue) => groupValue === value)
                if (!gp) return true;
                return false
            });

            console.log('[HELPER DATA LENGTH]: ', helperData.length);
            console.log('[GROUP DATA LENGTH]: ', helperData.length);


            currentMinValue = Number((currentMinValue + range).toFixed(3));
            currentMaxValue = Number((currentMaxValue + range).toFixed(3));

            console.log({
                currentMinValue,
                currentMaxValue,
            })

            console.log('[HELPER DATA]: ', helperData.length);

            if (helperData.length <= 0) {
                break;
            }
        }

        return Array.from(frequenciesMap.values());
    }
    
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
