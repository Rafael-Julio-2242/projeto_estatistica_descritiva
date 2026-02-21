// DATA FORMAT:
// [
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
// ]


export enum DataType {
    QualitativaNominal = "qualitativa nominal",
    QualitativaOrdinal = "qualitativa ordinal",
    QuantitativaDiscreta = "quantitativa discreta",
    QuantitativaContinua = "quantitativa continua",
    Binaria = "binária"
}

export interface ColumnType {
    firstValue: string
    type: DataType
}

export default function DefineColumnsTypes(data: any[][]) {
    // Validar se há dados suficientes para análise
    if (!data || data.length < 2 || !data[0] || !data[1]) {
        return [];
    }

    const columnTypes: ColumnType[] = []

    for (let i = 0; i < data[1].length; i++) {
        let columnType: DataType;
        const colName = data[0][i];
        const val = data[1][i];
        
        switch (typeof val) {
            case "string":
                columnType = DataType.QualitativaNominal;
                break;
            case "number":
                // Aqui eu preciso verificar se o número é decimal ou não
                // Se for decimal, é continuo
                // se nao for é discreto    

                if (Number.isInteger(val)) {

                    // Preciso verificar se é binário ou nao
                    // Pra isso, preciso validar se todos os valores dessa coluna são binários

                    const isBinary = data.every((row) => {
                        return row[i] === 0 || row[i] === 1
                    });

                    if (isBinary) {
                        columnType = DataType.Binaria;
                        break;
                    }

                    columnType = DataType.QuantitativaDiscreta;
                } else {
                    columnType = DataType.QuantitativaContinua;
                }

                break;
            default:
                columnType = DataType.QualitativaNominal;
                break;
        }

        columnTypes.push({
            firstValue: colName,
            type: columnType
        })
    }

    
    return columnTypes
}
