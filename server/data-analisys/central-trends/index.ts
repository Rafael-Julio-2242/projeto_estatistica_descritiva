
export default function CalculateCentralTrends(inputData: any[]) {

    const data = new Array();
    data.push(...inputData);

    const totalValues = data.length;

    console.log('[TOTAL VALUES]: ', totalValues);

    // Aqui eu preciso calcular a média - Quando possível
    // Aqui eu preciso calcular a mediana - Quando possível
    // Aqui eu preciso calcular a moda

    let canCalculateMean = true;
    let canCalculateMedian = true;

    if (isNaN(Number(data[1]))) {
        canCalculateMean = false;
        canCalculateMedian = false;
    }

    if (canCalculateMedian) {
        data.sort((a, b) => a - b);
    }

    let mean = 0;
    let median = 0;
    let modeMap = new Map<string, number>();

    if (canCalculateMean) {
        mean = data.reduce((a, b) => a + b) / totalValues;
    }

    if (canCalculateMedian) {
        median = data[Math.floor(totalValues / 2)];
    }

    for (let i = 0; i < data.length; i++) {
        const value = data[i];
        if (!modeMap.has(`${value}`)) {
            modeMap.set(`${value}`, 1);
        } else {
            modeMap.set(`${value}`, modeMap.get(`${value}`)! + 1);
        }
    }

    let mode = 0;
    let modeCount = 0;

    const modeMapKeys = Array.from(modeMap.entries());


    for (let i = 0; i < modeMapKeys.length; i++) {
        const value = modeMapKeys[i];
        const valueCount = value[1];
        console.log('[VALUE]: ', value[0], " - [COUNT]: ", valueCount, " - [MODE COUNT]: ", modeCount, " - [MODE]: ", mode);
        if (valueCount > modeCount) {
            mode = Number(value[0]);
            modeCount = valueCount;
        }
    }

    return {
        mean,
        median,
        mode,
        modeCount
    }
}
