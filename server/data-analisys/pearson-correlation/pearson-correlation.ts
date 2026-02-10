"use server";

import { PearsonCalcResponse, PearsonCorrelationType } from "../types";

function checkInvalidCall(columnA: any[], columnB: any[]): PearsonCalcResponse {
 if (columnA.length === 0 || columnB.length === 0) {
        return {
            success: false,
            message: "As colunas não podem estar vazias"
        }
    }
    
    if (columnA.length !== columnB.length) {
        return {
            success: false,
            message: "As colunas devem ser do mesmo tamanho para a correlação de Pearson"
        }
    }

    // Se os elementos não forem números

    const naNElementColumnA = columnA.find((value) => isNaN(value));
    const naNElementColumnB = columnB.find((value) => isNaN(value));

    console.log({
        naNElementColumnA,
        naNElementColumnB
    })

    if (naNElementColumnA !== undefined) {
         return {
            success: false,
            message: "A primeira coluna informada contém elementos inválidos. Todos os elementos devem ser números"
        }
    }

    if (naNElementColumnB !== undefined) {
        return {
             success: false,
            message: "A segunda coluna informada contém elementos inválidos. Todos os elementos devem ser números"
        }
    }


    return {
        success: true,
        value: 0,
        type: PearsonCorrelationType.WEAK,
        direction: "positive"
    }
}

function calculateNumerator(columnA: number[], columnB: number[]) {
    const totalValues = columnA.length;

    let pairMultiplicationSum = 0;
    let columnASum = 0;
    let columnBSum = 0;

    // Eu posso assumir que ambas as colunas tem o mesmo tamanho

    for (let i = 0; i < totalValues; i++) {
        const valueA = columnA[i];
        const valueB = columnB[i];

        pairMultiplicationSum += valueA * valueB;
        columnASum += valueA;
        columnBSum += valueB;
    }

    return (
        (pairMultiplicationSum * totalValues) - (columnASum * columnBSum)
    )
}

function calculateDenominator(columnA: number[], columnB: number[]) {
    const totalValues = columnA.length;

    let columnASquaredSum = 0;
    let columnBSquaredSum = 0;

    let columASum = 0;
    let columBSum = 0;

    for (let i = 0; i < totalValues; i++) {
        const valueA = columnA[i];
        const valueB = columnB[i];

        columnASquaredSum += valueA ** 2;
        columnBSquaredSum += valueB ** 2;

        columASum += valueA;
        columBSum += valueB;
    }

    const valueA = (totalValues * columnASquaredSum) - (columASum ** 2);
    const valueB = (totalValues * columnBSquaredSum) - (columBSum ** 2);

    return Math.sqrt(valueA * valueB);
}

export async function CalculatePearsonCorrelation(columnA: number[], columnB: number[]): Promise<PearsonCalcResponse> {
    const areColumnsValid = checkInvalidCall(columnA, columnB);

    if (!areColumnsValid.success) {
        return areColumnsValid;
    }

    const numerator = calculateNumerator(columnA, columnB);
    const denominator = calculateDenominator(columnA, columnB);

    console.log('NUMERATOR: ', numerator);
    console.log('DENOMINATOR: ', denominator);

    const value = numerator / denominator;

    let returnResult: PearsonCalcResponse = {
        success: true,
        value,
        type: PearsonCorrelationType.WEAK,
        direction: "positive"
    }

    if (value < 0) {
        returnResult.direction = "negative";
    }

    if (Math.abs(value) >= 0 && Math.abs(value) < 0.25) {
        returnResult.type = PearsonCorrelationType.WEAK;
    } else if (Math.abs(value) >= 0.25 && Math.abs(value) < 0.75) {
        returnResult.type = PearsonCorrelationType.MEDIUM;
    } else if (Math.abs(value) > 0.75) {
        returnResult.type = PearsonCorrelationType.STRONG;
    }

    console.log('[PEARSON RESULT]: ', returnResult);

    return returnResult;
}

