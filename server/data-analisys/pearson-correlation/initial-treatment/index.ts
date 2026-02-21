"use server"

import DataCleaning from "./data-cleaning"
import DefineColumnsTypes from "./define-columns-types"

export async function InitialTreatment(data: any[][]) {
    // Validar se há dados para processar
    if (!data || data.length === 0) {
        return {
            cleanedData: [],
            columnTypes: []
        }
    }

    // Aqui eu vou juntar:
        // Limpeza de dados (é a primeira a acontecer)
        // Classificação dos tipos de variáveis / colunas
    //

    // Aqui vem a limpeza de dados
    const cleanedData = DataCleaning(data)

    // Certo, agora, eu preciso definir os tipos de variáveis / colunas
 
    const columnTypes = DefineColumnsTypes(cleanedData)

    return {
        cleanedData,
        columnTypes
    }
}
