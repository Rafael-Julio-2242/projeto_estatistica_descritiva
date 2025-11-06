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


  async function onSubmit(formData: FormData) {
    setIsLoading(true)
    setResults(null)

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
    } else {
      setTableColumns(null)
      setTableRows([])
    }


    console.log('[---------------------------------]');
    console.log('[CALCULATING FREQUENCIES]: ');

    const chosenTestHeader = "IMDb Rating"
    const columnData = ExtractColumnFromData(cleanedData, chosenTestHeader)
    const frequencies = CalculateColumnFrequencies(columnData)
    console.log(`Frequencies - ${chosenTestHeader}: ${JSON.stringify(frequencies, null, 2)}`)


    console.log('[---------------------------------]');
    console.log('[CALCULATING CENTRAL TRENDS]');
    const centralTrends = CalculateCentralTrends(columnData)
    console.log(`Central Trends - ${chosenTestHeader}: ${JSON.stringify(centralTrends, null, 2)}`)

    console.log('[---------------------------------]');
    console.log('[CALCULATING QUANTILES]');
    const quantiles = CalculateQuantiles(columnData)
    console.log(`Quantiles - ${chosenTestHeader}: ${JSON.stringify(quantiles, null, 2)}`)


    console.log('[---------------------------------]');
    console.log('[CALCULATING DISPERSION]');
    const dispersion = CalculateDispersion(columnData)
    console.log(`Dispersion - ${chosenTestHeader}: ${JSON.stringify(dispersion, null, 2)}`)


    console.log('[---------------------------------]');

    console.log('cleanedData: ', cleanedData); 
    
    // Salva 'columnTypes' no estado
    // Garantimos que 'columnTypes' seja um array de ColumnType, se não for, usamos um array vazio
    setResults(columnTypes as ColumnType[] || [])

    setIsLoading(false)
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="types">Tipos de Variáveis</TabsTrigger>
                <TabsTrigger value="data" disabled={!tableColumns}>Tabela de Dados</TabsTrigger>
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
                      {tableRows.map((row, rIdx) => (
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
              </TabsContent>

            </Tabs>

          </CardContent>
        </Card>
      )}

    </main>
  );
}