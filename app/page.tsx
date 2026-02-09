'use client'

import { useState, useRef } from 'react'

// --- Imports da Lógica ---
import * as XLSX from 'xlsx'
import { JsonToDataArray, DataArrayToJson } from '@/helpers/json-convertions'
import { InitialTreatment } from '@/server/data-analisys/pearson-correlation/initial-treatment'
import { ExtractColumnFromData } from '@/helpers/extract-data'
import { CalculateColumnFrequencies } from '@/server/data-analisys/frequencies'
import CalculateCentralTrends from '@/server/data-analisys/central-trends'
import CalculateQuantiles from '@/server/data-analisys/quantiles'
import CalculateDispersion from '@/server/data-analisys/dispersion'
import calculateNormalDistribution, { formatNormalDistributionResults, type FishData, type NormalDistributionResult } from '@/server/data-analisys/standard-dispersion'
import type { ColumnFrequencyValue } from '@/server/data-analisys/types'
import type { Quantile } from '@/server/data-analisys/quantiles'
import { CalculatePearsonCorrelation } from '@/server/data-analisys/pearson-correlation/pearson-correlation'


// --- Imports de UI ---
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart as RBarChart, Bar, CartesianGrid, XAxis, YAxis, ComposedChart, ReferenceArea, ReferenceLine, Scatter } from 'recharts'

// --- NOVOS IMPORTS DA TABELA ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CalculateRegressionLine } from '@/server/data-analisys/calculate-regression-line'

// --- Interface para Tipos de Coluna (para tipagem mais forte) ---
interface ColumnType {
  firstValue: string; // O nome da coluna
  type: string;       // O tipo detectado (qualitativa, quantitativa, etc.)
}

// --- Colunas geradas dinamicamente para a tabela de dados ---
interface GeneratedColumn {
  accessorKey: string
  header: string
}

export default function Home() {

  const [isLoading, setIsLoading] = useState(false)
  // Agora o `results` é explicitamente um array de ColumnType
  const [results, setResults] = useState<ColumnType[] | null>(null)

  // Estados para a Tabela Dinâmica
  const [tableColumns, setTableColumns] = useState<GeneratedColumn[] | null>(null)
  const [tableRows, setTableRows] = useState<Record<string, any>[]>([])

  const [headersList, setHeadersList] = useState<string[] | null>(null)
  const [cleanedMatrix, setCleanedMatrix] = useState<any[] | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)

  const [frequenciesResult, setFrequenciesResult] = useState<ColumnFrequencyValue[] | null>(null)
  const [centralTrendsResult, setCentralTrendsResult] = useState<{ mean: number; median: number; mode: number; modeCount: number } | null>(null)
  const [quantilesResult, setQuantilesResult] = useState<Quantile[] | null>(null)
  const [dispersionResult, setDispersionResult] = useState<any | null>(null)

  // Estados para correlação entre duas colunas
  const [selectedColumn1, setSelectedColumn1] = useState<string | null>(null)
  const [selectedColumn2, setSelectedColumn2] = useState<string | null>(null)
  const [correlationResult, setCorrelationResult] = useState<any | null>(null)
  const [regressionResult, setRegressionResult] = useState<any | null>(null)
  const [isCalculatingCorrelation, setIsCalculatingCorrelation] = useState(false)

  // Estado para distribuição normal
  const [normalDistributionResult, setNormalDistributionResult] = useState<NormalDistributionResult | null>(null)
  const [selectedWeightColumn, setSelectedWeightColumn] = useState<string | null>(null)
  const [isCalculatingNormal, setIsCalculatingNormal] = useState(false)
  const [minRange, setMinRange] = useState<number>(400)
  const [maxRange, setMaxRange] = useState<number>(500)

  // Refs for exporting charts as images
  const chartsBarRef = useRef<HTMLDivElement | null>(null)
  const chartsHistRef = useRef<HTMLDivElement | null>(null)
  const chartsBoxRef = useRef<HTMLDivElement | null>(null)

  function downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function exportResultsJSON() {
    const payload = {
      column: selectedColumn,
      frequencies: frequenciesResult,
      centralTrends: centralTrendsResult,
      quantiles: quantilesResult,
      dispersion: dispersionResult,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    downloadBlob(`relatorio-${selectedColumn ?? 'coluna'}.json`, blob)
  }

  async function exportChartPNG(container: HTMLDivElement | null, filename: string) {
    if (!container) return
    const svg = container.querySelector('svg') as SVGSVGElement | null
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    const viewBox = svg.getAttribute('viewBox')
    let width = svg.clientWidth || 800
    let height = svg.clientHeight || 450
    if (viewBox) {
      const parts = viewBox.split(' ').map(Number)
      if (parts.length === 4) { width = parts[2]; height = parts[3] }
    }
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(width))
    canvas.height = Math.max(1, Math.floor(height))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--background') || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    canvas.toBlob((blob) => { if (blob) downloadBlob(filename, blob) }, 'image/png')
  }

  async function exportChartsPNG() {
    const tasks: Promise<void>[] = []
    if (chartsBarRef.current) tasks.push(exportChartPNG(chartsBarRef.current, `barras-${selectedColumn ?? 'coluna'}.png`))
    if (chartsHistRef.current) tasks.push(exportChartPNG(chartsHistRef.current, `histograma-${selectedColumn ?? 'coluna'}.png`))
    if (chartsBoxRef.current) tasks.push(exportChartPNG(chartsBoxRef.current, `boxplot-${selectedColumn ?? 'coluna'}.png`))
    await Promise.all(tasks)
  }

  // Paginação
  const rowsPerPage = 10
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(tableRows.length / rowsPerPage))
  const paginatedRows = tableRows.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  )

  // Paginação para gráficos (categóricos)
  const chartsItemsPerPage = 10
  const [chartsPage, setChartsPage] = useState(0)


  async function onSubmit(formData: FormData) {
    setIsLoading(true)
    setResults(null)
    setFrequenciesResult(null)
    setCentralTrendsResult(null)
    setQuantilesResult(null)
    setDispersionResult(null)

    const formDataFile = formData.get('csvFile')

    if (!formDataFile) {
      alert('Nenhum arquivo selecionado')
      setIsLoading(false)
      return
    }

    const file = formDataFile as File
    const fileBuffer = await file.arrayBuffer()

    const data = XLSX.read(fileBuffer, { type: 'buffer' })

    const workbook = data.SheetNames[0]
    const worksheet = data.Sheets[workbook]
    const json = XLSX.utils.sheet_to_json(worksheet, { raw: true,  })

    const dataArray = JsonToDataArray(json)
    
    const { cleanedData, columnTypes } = await InitialTreatment(dataArray);
    
    setResults(() => columnTypes as ColumnType[] || []);

    // --- Monta colunas e linhas da Tabela Dinâmica ---
    if (cleanedData && cleanedData.length > 0) {
      const headers = cleanedData[0] as string[]
      const generatedCols: GeneratedColumn[] = headers.map((h) => ({
        accessorKey: String(h),
        header: String(h),
      }))
      const rows = DataArrayToJson(cleanedData)

      setTableColumns(generatedCols)
      setTableRows(rows)
      setHeadersList(headers)
      setCleanedMatrix(cleanedData)
      const defaultHeader = headers.includes('IMDb Rating') ? 'IMDb Rating' : headers[0]
      setSelectedColumn(defaultHeader);
      computeStatsFor(defaultHeader, columnTypes ,cleanedData);
      setCurrentPage(0)

      // PARA TESTE - Only run if columns exist
      if (headers.includes('IMDb Rating') && headers.includes('Rank')) {
        const imdbRating = ExtractColumnFromData(cleanedData, 'IMDb Rating').map((val) => Number(val));
        const rank = ExtractColumnFromData(cleanedData, 'Rank').map((val) => Number(val));
        
        imdbRating.shift();
        rank.shift();

        const pearsonCorrelation = await CalculatePearsonCorrelation(imdbRating, rank);
        console.log('[PEARSON CORRELATION]: ', pearsonCorrelation);

        const regressionLine = await CalculateRegressionLine(imdbRating, rank);
        console.log('[REGRESSION LINE]: ', regressionLine);
      } else {
        console.log('Required columns (IMDb Rating, Rank) not found in data');
      }

      

    } else {
      setTableColumns(null)
      setTableRows([])
      setHeadersList(null)
      setCleanedMatrix(null)
      setSelectedColumn(null)
      setFrequenciesResult(null)
      setCentralTrendsResult(null)
      setQuantilesResult(null)
      setDispersionResult(null)
      setCurrentPage(0)
    }

    setIsLoading(false)
  }

  async function computeStatsFor(columnName: string, columnTypes: ColumnType[] | null = null ,matrix?: any[]) {
    const dataMatrix = matrix ?? cleanedMatrix
    if (!dataMatrix) return

    const fullColumn = ExtractColumnFromData(dataMatrix, columnName)
    const values = fullColumn.slice(1)
    const isNumeric = values.length > 0 && !isNaN(Number(values[0]))

    let calculateRange = false;
    
    if (columnTypes) {
      const columnType = columnTypes.find((colType) => colType.firstValue === columnName);

      console.log('[COLUMN TYPE]: ', columnType);

      if (columnType && columnType.type === 'quantitativa continua') {
        calculateRange = true;
      }
    }


    const frequencies = await CalculateColumnFrequencies([...fullColumn], calculateRange)

    // Frequências sempre são calculadas
    setFrequenciesResult(frequencies)


    // TODO Aqui tem que calcular a moda pra coisas que não são numéricas também.
    // TODO Ta convertendo coisa que não é numérica em número, fazendo retornar NaN em alguns casos
    if (isNumeric) {
      const numericValues = values.map((v: any) => Number(v))
      const central = CalculateCentralTrends(numericValues)
      setCentralTrendsResult(central)
      const quant = CalculateQuantiles(numericValues)
      setQuantilesResult(quant)
      const disp = CalculateDispersion(numericValues)
      setDispersionResult(disp)
    } else {
      // Para variáveis não numéricas, não calcular quantis/disp.
      setQuantilesResult(null)
      setDispersionResult(null)
      // Para tendências centrais, evitamos NaN; exibiremos apenas moda via frequências na UI (com fallback '-')
      const central = CalculateCentralTrends(values)

      console.log('[NON NUMERIC CENTRAL TRENDS]: ', central);
      setCentralTrendsResult(central)
    }
  }

  function handleChangeColumn(col: string) {
    setSelectedColumn(col)
    computeStatsFor(col, results)
    setChartsPage(0)
  }

  async function calculateCorrelation() {
    if (!selectedColumn1 || !selectedColumn2 || !cleanedMatrix) {
      alert('Por favor, selecione duas colunas numéricas')
      return
    }

    if (selectedColumn1 === selectedColumn2) {
      alert('Selecione duas colunas diferentes')
      return
    }

    setIsCalculatingCorrelation(true)
    setCorrelationResult(null)
    setRegressionResult(null)

    try {
      const col1Data = ExtractColumnFromData(cleanedMatrix, selectedColumn1).map((val) => Number(val))
      const col2Data = ExtractColumnFromData(cleanedMatrix, selectedColumn2).map((val) => Number(val))
      
      col1Data.shift()
      col2Data.shift()

      const pearsonCorrelation = await CalculatePearsonCorrelation(col1Data, col2Data)
      const regressionLine = await CalculateRegressionLine(col1Data, col2Data)
      
      setCorrelationResult(pearsonCorrelation)
      setRegressionResult(regressionLine)
    } catch (error) {
      console.error('Erro ao calcular correlação:', error)
      alert('Erro ao calcular correlação. Verifique se as colunas contêm apenas dados numéricos.')
    } finally {
      setIsCalculatingCorrelation(false)
    }
  }

  function fmt(n?: number) {
    if (n === undefined) return '-'
    else return n
  }

  function isNumericColumn(matrix: any[] | null, columnName: string | null) {
    if (!matrix || !columnName) return false;
    const col = ExtractColumnFromData(matrix, columnName).slice(1);
    if (col.length === 0) return false;
    const sample = col.find((v: any) => v !== null && v !== undefined && v !== '');
    return sample !== undefined && !isNaN(Number(sample));
  }

  function getNumericValues(matrix: any[] | null, columnName: string | null) {
    if (!matrix || !columnName) return [] as number[];
    const col = ExtractColumnFromData(matrix, columnName).slice(1);
    return col.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v));
  }

  function getNumericColumns(matrix: any[] | null, headersList: string[] | null) {
    if (!matrix || !headersList) return [];
    return headersList.filter(header => {
      const columnData = ExtractColumnFromData(matrix, header).slice(1);
      return columnData.length > 0 && !isNaN(Number(columnData[0]));
    });
  }

  function calculateNormalDistributionForColumn() {
    if (!selectedWeightColumn || !cleanedMatrix) {
      alert('Por favor, selecione uma coluna numérica.');
      return;
    }

    if (minRange >= maxRange) {
      alert('O valor mínimo deve ser menor que o valor máximo.');
      return;
    }

    setIsCalculatingNormal(true);
    
    try {
      // Extrair dados da coluna de peso
      const weightData = ExtractColumnFromData(cleanedMatrix, selectedWeightColumn);
      const weights = weightData.slice(1).map(val => Number(val)).filter(val => !isNaN(val));
      
      if (weights.length === 0) {
        alert('A coluna selecionada não contém dados numéricos válidos.');
        setIsCalculatingNormal(false);
        return;
      }

      // Converter para formato FishData
      const fishData: FishData[] = weights.map(weight => ({ weight }));
      
      // Calcular distribuição normal com intervalo personalizado
      const result = calculateNormalDistribution(fishData, minRange, maxRange);
      setNormalDistributionResult(result);
      
      console.log('Resultado da distribuição normal:', result);
      
    } catch (error) {
      console.error('Erro ao calcular distribuição normal:', error);
      alert('Oc orreu um erro ao calcular a distribuição normal.');
    } finally {
      setIsCalculatingNormal(false);
    }
  }

  function binNumeric(values: number[], bins = 10) {
    if (values.length === 0) return [] as { x0: number; x1: number; count: number }[];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const width = (max - min) / (bins || 1) || 1;
    const edges = Array.from({ length: bins + 1 }, (_, i) => min + i * width);
    const out: { x0: number; x1: number; count: number }[] = [];
    for (let i = 0; i < bins; i++) {
      out.push({ x0: edges[i], x1: i === bins - 1 ? max : edges[i + 1], count: 0 });
    }
    for (const v of values) {
      if (v < min || v > max) continue;
      let idx = Math.floor((v - min) / (width || 1));
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      out[idx].count += 1;
    }
    return out;
  }

  function CategoricalBarChart({ data, containerRef }: { data: { label: string; value: number }[]; containerRef?: React.RefObject<HTMLDivElement | null> }) {
    const total = data.reduce((a, b) => a + b.value, 0)
    const chartConfig = { value: { label: 'Frequência', color: 'hsl(var(--primary))' } }
    return (
      <div className="w-full" ref={containerRef}>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <RBarChart data={data} barCategoryGap={8} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} height={40} angle={0} dx={0} dy={0} tickLine={false} axisLine={false} />
            <YAxis allowDecimals tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" />
          </RBarChart>
        </ChartContainer>
        <div className="mt-1 text-[10px] text-muted-foreground">Total: {total}</div>
      </div>
    )
  }

  function NumericHistogram({ values, containerRef }: { values: number[]; containerRef?: React.RefObject<HTMLDivElement | null> }) {
    const bins = binNumeric(values, 10)
    const data = bins.map(b => ({ label: `${b.x0.toFixed(1)}–${b.x1.toFixed(1)}`, count: b.count }))
    const chartConfig = { count: { label: 'Contagem', color: 'hsl(var(--primary))' } }
    return (
      <div className="w-full" ref={containerRef}>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <RBarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} height={40} tickLine={false} axisLine={false} />
          <YAxis allowDecimals tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--color-count)" />
        </RBarChart>
      </ChartContainer>
      </div>
    )
  }

  function BoxPlot({ values, stats, containerRef }: { values: number[]; stats?: { q1: number; q3: number; iqr: number; median?: number }; containerRef?: React.RefObject<HTMLDivElement | null> }) {
    if (values.length === 0) return null
    const sorted = [...values].sort((a, b) => a - b)
    const dataMin = sorted[0]
    const dataMax = sorted[sorted.length - 1]
    const q1 = stats?.q1 ?? sorted[Math.floor(sorted.length * 0.25)]
    const q3 = stats?.q3 ?? sorted[Math.floor(sorted.length * 0.75)]
    const iqr = stats?.iqr ?? (q3 - q1)
    const median = stats?.median ?? sorted[Math.floor(sorted.length * 0.5)]
    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr
    const nonOutliers = sorted.filter((v) => v >= lowerFence && v <= upperFence)
    const lowerWhisker = nonOutliers.length ? nonOutliers[0] : q1
    const upperWhisker = nonOutliers.length ? nonOutliers[nonOutliers.length - 1] : q3
    const outliers = sorted.filter((v) => v < lowerFence || v > upperFence).map((v) => ({ x: v, y: 0 }))

    const data = [{ min: dataMin, max: dataMax, q1, q3, median, lw: lowerWhisker, uw: upperWhisker }]

    const chartConfig = { box: { label: 'Boxplot', color: 'hsl(var(--primary))' } }

    return (
      <div className="w-full" ref={containerRef}>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <XAxis type="number" dataKey="median" domain={[dataMin, dataMax]} tickLine={false} axisLine={false} />
            <YAxis type="number" hide domain={[0, 1]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine x={lowerWhisker} stroke="var(--color-box)" />
            <ReferenceLine x={upperWhisker} stroke="var(--color-box)" />
            <ReferenceArea x1={q1} x2={q3} fill="var(--color-box)" fillOpacity={0.3} />
            <ReferenceLine x={median} stroke="var(--color-box)" strokeWidth={2} />
            <Scatter data={outliers} fill="hsl(var(--destructive))" />
          </ComposedChart>
        </ChartContainer>
      </div>
    )
  }


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start gap-8 bg-gray-100 dark:bg-gray-950 p-4 pt-20">
      
      <Card className="w-full max-w-lg">
        <form action={onSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Analisador de Dados CSV</CardTitle>
            <CardDescription>
              Faça o upload do seu arquivo .csv para uma análise estatística instantânea.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="csvFile">Selecione o arquivo</Label>
              <Input 
                type="file" 
                accept=".csv, .xlsx" 
                id="csvFile" 
                name="csvFile" 
                className="w-full"
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Analisando..." : "Analisar Arquivo"}
            </Button>
          </CardFooter>

        </form>
      </Card>

      {/* Seção de Resultados (agora com tabela) */}
      {(results || tableColumns) && (
        <Card className="w-full max-w-5xl">
          <CardHeader>
            <CardTitle>Resultados da Análise</CardTitle>
            <CardDescription>
              Tipos de variáveis e visualização dos dados limpos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <Tabs defaultValue={tableColumns ? 'data' : 'types'} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="types">Tipos de Variáveis</TabsTrigger>
                <TabsTrigger value="data" disabled={!tableColumns}>Tabela de Dados</TabsTrigger>
                <TabsTrigger value="stats" disabled={!frequenciesResult && !centralTrendsResult && !quantilesResult && !dispersionResult}>Estatísticas</TabsTrigger>
                <TabsTrigger value="charts" disabled={!cleanedMatrix}>Gráficos</TabsTrigger>
                <TabsTrigger value="correlation" disabled={!cleanedMatrix}>Correlação</TabsTrigger>
                <TabsTrigger value="normal" disabled={!cleanedMatrix}>Distribuição Normal</TabsTrigger>
              </TabsList>

              <TabsContent value="types">
                <div className="max-h-[400px] overflow-y-auto mt-4 rounded-md border">
                    <Table>
                        <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                            <TableRow>
                                <TableHead className="w-[50%]">Coluna</TableHead>
                                <TableHead className="w-[50%]">Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(results ?? []).map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.firstValue}</TableCell>
                                    <TableCell>{item.type}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Página {currentPage + 1} de {totalPages}</span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage <= 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data">
                <div className="max-h-[500px] overflow-auto mt-4 rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                      <TableRow>
                        {(tableColumns ?? []).map((col) => (
                          <TableHead key={col.accessorKey}>{col.header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((row, rIdx) => (
                        <TableRow key={rIdx}>
                          {(tableColumns ?? []).map((col) => (
                            <TableCell key={col.accessorKey}>
                              {String(row[col.accessorKey] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Página {currentPage + 1} de {totalPages}</span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage <= 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats">
                <div className="space-y-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="stats-column">Coluna</Label>
                    <select
                      id="stats-column"
                      className="border rounded-md px-2 py-1 bg-background"
                      value={selectedColumn ?? ''}
                      onChange={(e) => handleChangeColumn(e.target.value)}
                      disabled={!headersList || headersList.length === 0}
                    >
                      {(headersList ?? []).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  {/* Frequências */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Frequências</h3>
                    {!frequenciesResult || frequenciesResult.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum resultado calculado.</p>
                    ) : (
                      <div className="max-h-[300px] overflow-auto rounded-md border">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                            <TableRow>
                              <TableHead>Valor</TableHead>
                              <TableHead>Frequência Absoluta</TableHead>
                              <TableHead>Frequência Relativa</TableHead>
                              <TableHead>Frequência Acumulativa</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {frequenciesResult.map((f, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{f.value}</TableCell>
                                <TableCell>{f.absoluteFrequency}</TableCell>
                                <TableCell>{(f.relativeFrequency * 100).toFixed(2)}%</TableCell>
                                <TableCell>{f.absoluteCumulativeFrequency ?? '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Tendências Centrais */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Tendências Centrais</h3>
                    {!centralTrendsResult ? (
                      <p className="text-sm text-muted-foreground">Nenhum resultado calculado.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="rounded-md border p-3"><div className="text-muted-foreground">Média</div><div className="font-medium">{fmt(centralTrendsResult.mean)}</div></div>
                        <div className="rounded-md border p-3"><div className="text-muted-foreground">Mediana</div><div className="font-medium">{fmt(centralTrendsResult.median)}</div></div>
                        <div className="rounded-md border p-3"><div className="text-muted-foreground">Moda</div><div className="font-medium">{centralTrendsResult.mode}</div></div>
                        <div className="rounded-md border p-3"><div className="text-muted-foreground">Frequência da Moda</div><div className="font-medium">{centralTrendsResult.modeCount}</div></div>
                      </div>
                    )}
                  </div>

                  {/* Separatrizes */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Separatrizes</h3>
                    {!quantilesResult || quantilesResult.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum resultado calculado.</p>
                    ) : (
                      <div className="max-h-[300px] overflow-auto rounded-md border">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10">
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quantilesResult.map((q, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{q.name}</TableCell>
                                <TableCell>{q.type}</TableCell>
                                <TableCell>{q.value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Dispersão */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Dispersão</h3>
                    {!dispersionResult ? (
                      <p className="text-sm text-muted-foreground">Nenhum resultado calculado.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Contagem</div>
                          <div className="font-medium">{dispersionResult.stats?.count}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Amplitude (mín - máx)</div>
                          <div className="font-medium">{dispersionResult.range?.value} ({dispersionResult.range?.minValue} - {dispersionResult.range?.maxValue})</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Q1 / Q3 / IQR</div>
                          <div className="font-medium">{dispersionResult.quartiles?.q1} / {dispersionResult.quartiles?.q3} / {dispersionResult.quartiles?.iqr}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Média</div>
                          <div className="font-medium">{dispersionResult.mean?.mean}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Variância</div>
                          <div className="font-medium">{dispersionResult.variance?.variance}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Desvio Padrão</div>
                          <div className="font-medium">{dispersionResult.standardDeviation?.standardDeviation}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Coeficiente de Variação</div>
                          <div className="font-medium">{dispersionResult.coefficientOfVariation?.coefficientOfVariation ?? '-'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="charts">
                <div className="space-y-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="charts-column">Coluna</Label>
                    <select
                      id="charts-column"
                      className="border rounded-md px-2 py-1 bg-background"
                      value={selectedColumn ?? ''}
                      onChange={(e) => handleChangeColumn(e.target.value)}
                      disabled={!headersList || headersList.length === 0}
                    >
                      {(headersList ?? []).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {!selectedColumn || !cleanedMatrix ? (
                    <p className="text-sm text-muted-foreground">Selecione uma coluna para visualizar.</p>
                  ) : (
                    (() => {
                      const numeric = isNumericColumn(cleanedMatrix, selectedColumn);
                      if (numeric) {
                        const vals = getNumericValues(cleanedMatrix, selectedColumn);
                        return (
                          <div className="space-y-8">
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Histograma</h3>
                              <NumericHistogram values={vals} containerRef={chartsHistRef} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Boxplot</h3>
                              <BoxPlot
                                values={vals}
                                stats={dispersionResult?.quartiles ? {
                                  q1: Number(dispersionResult.quartiles.q1),
                                  q3: Number(dispersionResult.quartiles.q3),
                                  iqr: Number(dispersionResult.quartiles.iqr),
                                  median: typeof centralTrendsResult?.median === 'number' ? centralTrendsResult?.median : undefined,
                                } : undefined}
                                containerRef={chartsBoxRef}
                              />
                            </div>

                            <div className="rounded-md border p-3">
                              <div className="font-medium mb-2">Mini relatório</div>
                              <div className="grid gap-2 text-sm md:grid-cols-2">
                                <div>
                                  <div><span className="text-muted-foreground">Coluna:</span> {selectedColumn}</div>
                                  <div><span className="text-muted-foreground">Tipo:</span> Numérica</div>
                                  <div><span className="text-muted-foreground">Média:</span> {fmt(centralTrendsResult?.mean)}</div>
                                  <div><span className="text-muted-foreground">Mediana:</span> {fmt(centralTrendsResult?.median)}</div>
                                  <div><span className="text-muted-foreground">Moda:</span> {fmt(centralTrendsResult?.mode)}</div>
                                  <div><span className="text-muted-foreground">IQR:</span> {dispersionResult?.quartiles?.iqr}</div>
                                </div>
                                <div>
                                  <div className="font-medium mb-1">Fórmulas (curtas)</div>
                                  <div>Frequência relativa: f_i / n</div>
                                  <div>Média: Σx / n</div>
                                  <div>Mediana: valor central</div>
                                  <div>Moda: valor mais frequente</div>
                                  <div>IQR: Q3 − Q1</div>
                                  <div>DP: √Variância</div>
                                </div>
                              </div>
                              <div className="mt-2 flex gap-2">
                                <Button type="button" variant="outline" onClick={exportResultsJSON}>Exportar Resultados (JSON)</Button>
                                <Button type="button" onClick={exportChartsPNG}>Exportar Imagens (PNG)</Button>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const data = (frequenciesResult ?? []).map(f => ({ label: String(f.value), value: f.absoluteFrequency }));
                        const totalPagesCat = Math.max(1, Math.ceil(data.length / chartsItemsPerPage));
                        const start = chartsPage * chartsItemsPerPage;
                        const end = start + chartsItemsPerPage;
                        const pageData = data.slice(start, end);
                        return (
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold">Barras</h3>
                            {data.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Nenhum dado para exibir.</p>
                            ) : (
                              <>
                                <CategoricalBarChart data={pageData} containerRef={chartsBarRef} />
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-sm text-muted-foreground">Página {chartsPage + 1} de {totalPagesCat}</span>
                                  <div className="space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setChartsPage((p) => Math.max(0, p - 1))}
                                      disabled={chartsPage <= 0}
                                    >
                                      Anterior
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setChartsPage((p) => Math.min(totalPagesCat - 1, p + 1))}
                                      disabled={chartsPage >= totalPagesCat - 1}
                                    >
                                      Próxima
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                    })()
                  )}
                </div>
              </TabsContent>

              <TabsContent value="correlation">
                <div className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="correlation-col1">Primeira Coluna (Numérica)</Label>
                      <select
                        id="correlation-col1"
                        className="border rounded-md px-2 py-1 bg-background w-full"
                        value={selectedColumn1 ?? ''}
                        onChange={(e) => setSelectedColumn1(e.target.value)}
                        disabled={!headersList || headersList.length === 0}
                      >
                        <option value="">Selecione uma coluna</option>
                        {getNumericColumns(cleanedMatrix, headersList).map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="correlation-col2">Segunda Coluna (Numérica)</Label>
                      <select
                        id="correlation-col2"
                        className="border rounded-md px-2 py-1 bg-background w-full"
                        value={selectedColumn2 ?? ''}
                        onChange={(e) => setSelectedColumn2(e.target.value)}
                        disabled={!headersList || headersList.length === 0}
                      >
                        <option value="">Selecione uma coluna</option>
                        {getNumericColumns(cleanedMatrix, headersList).map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={calculateCorrelation}
                    disabled={!selectedColumn1 || !selectedColumn2 || selectedColumn1 === selectedColumn2 || isCalculatingCorrelation}
                    className="w-full"
                  >
                    {isCalculatingCorrelation ? "Calculando..." : "Calcular Correlação e Regressão"}
                  </Button>

                  {/* Resultados da Correlação */}
                  {correlationResult && correlationResult.success && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Resultado da Correlação</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Coeficiente de Pearson (r)</div>
                          <div className="font-medium text-lg">{correlationResult.value?.toFixed(4) ?? '-'}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Força da Correlação</div>
                          <div className="font-medium">
                            {correlationResult.type === 'WEAK' ? 'Fraca' :
                             correlationResult.type === 'MEDIUM' ? 'Moderada' : 'Forte'}
                          </div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Direção</div>
                          <div className="font-medium">
                            {correlationResult.direction === 'positive' ? 'Positiva' : 'Negativa'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Erro na Correlação */}
                  {correlationResult && !correlationResult.success && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                      <div className="text-red-800">
                        <div className="font-medium">Erro na Correlação</div>
                        <div className="text-sm mt-1">{correlationResult.message}</div>
                      </div>
                    </div>
                  )}

                  {/* Resultados da Regressão */}
                  {regressionResult && regressionResult.isValid && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Linha de Regressão</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Coeficiente Angular (a)</div>
                          <div className="font-medium">{regressionResult.a?.toFixed(4) ?? '-'}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Intercepto (b)</div>
                          <div className="font-medium">{regressionResult.b?.toFixed(4) ?? '-'}</div>
                        </div>
                        <div className="rounded-md border p-3 md:col-span-2">
                          <div className="text-muted-foreground">Equação da Reta</div>
                          <div className="font-medium">{regressionResult.equation ?? '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Erro na Regressão */}
                  {regressionResult && !regressionResult.isValid && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                      <div className="text-red-800">
                        <div className="font-medium">Erro na Regressão</div>
                        <div className="text-sm mt-1">{regressionResult.message}</div>
                      </div>
                    </div>
                  )}

                  {/* Mensagem informativa */}
                  {!correlationResult && !regressionResult && (
                    <div className="text-center text-muted-foreground p-8 border rounded-md">
                      <p>Selecione duas colunas numéricas diferentes para calcular a correlação de Pearson e a linha de regressão.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="normal">
                <div className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="weight-column">Coluna Numérica</Label>
                        <select
                          id="weight-column"
                          value={selectedWeightColumn || ""}
                          onChange={(e) => setSelectedWeightColumn(e.target.value)}
                          disabled={!cleanedMatrix}
                          className="w-[200px] px-3 py-2 border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                        >
                          <option value="">Selecione a coluna</option>
                          {getNumericColumns(cleanedMatrix, headersList).map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor="min-range">Mínimo</Label>
                        <Input
                          id="min-range"
                          type="number"
                          value={minRange}
                          onChange={(e) => setMinRange(Number(e.target.value))}
                          className="w-[100px]"
                          placeholder="400"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor="max-range">Máximo</Label>
                        <Input
                          id="max-range"
                          type="number"
                          value={maxRange}
                          onChange={(e) => setMaxRange(Number(e.target.value))}
                          className="w-[100px]"
                          placeholder="500"
                        />
                      </div>
                      
                      <Button 
                        onClick={calculateNormalDistributionForColumn}
                        disabled={!selectedWeightColumn || isCalculatingNormal}
                        className="ml-2"
                      >
                        {isCalculatingNormal ? "Calculando..." : "Calcular Distribuição Normal"}
                      </Button>
                    </div>
                  </div>

                  {/* Resultados da Distribuição Normal */}
                  {normalDistributionResult && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Análise da Distribuição Normal</h3>
                      
                      {/* Estatísticas Básicas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-md border p-4">
                          <div className="text-sm text-muted-foreground">Média</div>
                          <div className="text-2xl font-bold">{normalDistributionResult.mean.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md border p-4">
                          <div className="text-sm text-muted-foreground">Desvio Padrão</div>
                          <div className="text-2xl font-bold">{normalDistributionResult.standardDeviation.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md border p-4">
                          <div className="text-sm text-muted-foreground">Total de Dados</div>
                          <div className="text-2xl font-bold">{normalDistributionResult.totalFish}</div>
                        </div>
                      </div>

                      {/* Análise no intervalo especificado */}
                      <div className="rounded-lg border p-6 bg-blue-50 dark:bg-blue-950">
                        <h4 className="text-lg font-semibold mb-4">🎯 Análise entre {normalDistributionResult.minRange}-{normalDistributionResult.maxRange}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Dados no intervalo</div>
                            <div className="text-xl font-bold text-blue-600">
                              {normalDistributionResult.fishInRange} valores
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Percentual Real</div>
                            <div className="text-xl font-bold text-blue-600">
                              {normalDistributionResult.percentageInRange.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Análise Teórica */}
                      <div className="rounded-lg border p-6 bg-green-50 dark:bg-green-950">
                        <h4 className="text-lg font-semibold mb-4">📈 Análise Teórica (Distribuição Normal)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="text-muted-foreground">Z-score para {normalDistributionResult.minRange}</div>
                            <div className="font-medium">{normalDistributionResult.zScoreMin.toFixed(3)}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-muted-foreground">Z-score para {normalDistributionResult.maxRange}</div>
                            <div className="font-medium">{normalDistributionResult.zScoreMax.toFixed(3)}</div>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <div className="text-muted-foreground">Probabilidade Teórica</div>
                            <div className="font-medium text-lg text-green-600">
                              {normalDistributionResult.probabilityInRange.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comparação */}
                      <div className="rounded-lg border p-6 bg-orange-50 dark:bg-orange-950">
                        <h4 className="text-lg font-semibold mb-4">📋 Comparação</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Percentual observado:</span>
                            <span className="font-medium">{normalDistributionResult.percentageInRange.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Percentual esperado (normal):</span>
                            <span className="font-medium">{normalDistributionResult.probabilityInRange.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Diferença:</span>
                            <span className="font-medium text-orange-600">
                              {Math.abs(normalDistributionResult.percentageInRange - normalDistributionResult.probabilityInRange).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensagem informativa */}
                  {!normalDistributionResult && (
                    <div className="text-center text-muted-foreground p-8 border rounded-md">
                      <p>Selecione uma coluna numérica e defina o intervalo desejado para calcular a distribuição normal.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

            </Tabs>

          </CardContent>
        </Card>
      )}

    </main>
  );
}