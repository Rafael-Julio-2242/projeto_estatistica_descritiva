export function JsonToDataArray(json: any[]) {

    // RETURN FORMAT:
    // [
    //     ["col1", "col2", "col3"],
    //     ["col1", "col2", "col3"],
    //     ["col1", "col2", "col3"],
    // ]

    // RECEIVED FORMAT
    // [
    //     {"col1": "value1", "col2": "value2", "col3": "value3"},
    //     {"col1": "value1", "col2": "value2", "col3": "value3"},
    //     {"col1": "value1", "col2": "value2", "col3": "value3"},
    // ]

    
    const data: any[][] = []

    for (let i = 0; i < json.length; i++) {
        // A primeira linha tem os nomes das colunas
        if (i === 0) {
            const row = json[i]
            const rowData: any[] = []
            for (const key in row) {
                rowData.push(key)
            }
            console.log('[ROW DATA]: ', rowData);
            data.push(rowData)
        }
        const row = json[i]
        const rowData: any[] = []
        for (const key in row) {
            rowData.push(row[key])
        }
        data.push(rowData)
    }

    return data
}
// func que transforma um array de arrays em um array de objetos(JSON)
export function DataArrayToJson(data: any[][]) {
    if (!data || data.length === 0) return []

    const [headers, ...rows] = data
    const out: Record<string, any>[] = []

    for (const row of rows) {
        const obj: Record<string, any> = {}
        for (let i = 0; i < headers.length; i++) {
            const key = headers[i]
            obj[key] = row[i]
        }
        out.push(obj)
    }

    return out
}