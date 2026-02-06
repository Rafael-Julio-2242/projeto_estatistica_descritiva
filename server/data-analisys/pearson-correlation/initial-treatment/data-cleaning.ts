
// DATA FORMAT:

// [
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
// ]

export default function DataCleaning(data: any[][]) {
    
    const cleanedData = data.filter((row) => {
        return row.every((value) => value !== "" && value !== undefined && value !== null)
    })

    return cleanedData
}
