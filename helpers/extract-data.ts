
// INTPUT DATA FORMAT:
// [
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
//     ["col1", "col2", "col3"],
// ]


export function ExtractColumnFromData(data: any[][], columnName: string) {
    const columnData: any[] = [];
    const headers = data[0];

    let headerIndex = -1;

    for (let i = 0; i < headers.length; i++) {
        if (headers[i] === columnName) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        throw new Error('Column not found');
    }

    for (let i = 0; i < data.length; i++) {
        columnData.push(data[i][headerIndex]);
    }

    return columnData;
}