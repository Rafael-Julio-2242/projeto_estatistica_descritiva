'use client'

import { useState } from 'react'

// --- Imports da Lógica ---
import * as XLSX from 'xlsx'
import { JsonToDataArray, DataArrayToJson } from '@/helpers/json-convertions'
import { InitialTreatment } from '@/server/data-analisys/initial-treatment'
import { ExtractColumnFromData } from '@/helpers/extract-data'
import CalculateColumnFrequencies from '@/server/data-analisys/frequencies'
import CalculateCentralTrends from '@/server/data-analisys/central-trends'
import CalculateQuantiles from '@/server/data-analisys/quantiles'
import CalculateDispersion from '@/server/data-analisys/dispersion'
import type { ColumnFrequencyValue } from '@/server/data-analisys/frequencies'
import type { Quantile } from '@/server/data-analisys/quantiles'

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

// --- NOVOS IMPORTS DA TABELA ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

  // Paginação
  const rowsPerPage = 10
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(tableRows.length / rowsPerPage))
  const paginatedRows = tableRows.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  )


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
    
    const { cleanedData, columnTypes } = await InitialTreatment(dataArray)

    console.log('CLEANED DATA: ', cleanedData)
    console.log('COLUMN TYPES: ', columnTypes)

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
      setSelectedColumn(defaultHeader)
      computeStatsFor(defaultHeader, cleanedData)
      setCurrentPage(0)
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

    console.log('cleanedData: ', cleanedData); 
    setResults(columnTypes as ColumnType[] || [])

    setIsLoading(false)
  }

  function computeStatsFor(columnName: string, matrix?: any[]) {
    const dataMatrix = matrix ?? cleanedMatrix
    if (!dataMatrix) return

    const fullColumn = ExtractColumnFromData(dataMatrix, columnName)
    const values = fullColumn.slice(1)
    const isNumeric = values.length > 0 && !isNaN(Number(values[0]))

    // Frequências sempre são calculadas
    const frequencies = CalculateColumnFrequencies([...fullColumn])
    setFrequenciesResult(frequencies)

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
      setCentralTrendsResult({ mean: Number.NaN, median: Number.NaN, mode: Number.NaN, modeCount: (frequencies.sort((a,b)=>b.absoluteFrequency-a.absoluteFrequency)[0]?.absoluteFrequency) ?? 0 })
    }
  }

  function handleChangeColumn(col: string) {
    setSelectedColumn(col)
    computeStatsFor(col)
  }

  function fmt(n?: number) {
    return typeof n === 'number' && Number.isFinite(n) ? n : '-'
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
                accept=".csv" 
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="types">Tipos de Variáveis</TabsTrigger>
                <TabsTrigger value="data" disabled={!tableColumns}>Tabela de Dados</TabsTrigger>
                <TabsTrigger value="stats" disabled={!frequenciesResult && !centralTrendsResult && !quantilesResult && !dispersionResult}>Estatísticas</TabsTrigger>
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
                        <div className="rounded-md border p-3"><div className="text-muted-foreground">Moda</div><div className="font-medium">{fmt(centralTrendsResult.mode)}</div></div>
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

            </Tabs>

          </CardContent>
        </Card>
      )}

    </main>
  );
}