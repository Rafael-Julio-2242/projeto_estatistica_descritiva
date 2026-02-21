
// DATA FORMAT:

// [
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
// ]

export default function DataCleaning(data: any[][]) {
    // Validar se há dados para limpar
    if (!data || data.length === 0) {
        return [];
    }
    
    const cleanedData = data.filter((row) => {
        return row.every((value) => value !== "" && value !== undefined && value !== null)
    })

    return cleanedData
}
