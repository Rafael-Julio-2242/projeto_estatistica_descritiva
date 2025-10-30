'use client'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { JsonToDataArray } from '@/helpers/json-convertions'
import { InitialTreatment } from '@/server/data-analisys/initial-treatment'
import { ExtractColumnFromData } from '@/helpers/extract-data'
import CalculateColumnFrequencies from '@/server/data-analisys/frequencies'
import CalculateCentralTrends from '@/server/data-analisys/central-trends'

export default function Home() {

  async function onSubmit(formData: FormData) {
    
    const formDataFile = formData.get('csvFile')

    if (!formDataFile) {
      alert('Nenhum arquivo selecionado')
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

  }

  return (
    <div className="w-full flex flex-col gap-8 justify-center items-center mt-40">
      <form action={onSubmit} className='flex flex-col gap-8'>
        <div className="flex flex-col gap-2">
          <label htmlFor="csvFile">Selecione o arquivo CSV</label>
          <Input type="file" accept=".csv" id="csvFile" name="csvFile" className="w-full" />
        </div>
        <Button type="submit">Enviar</Button>
      </form>
    </div>
  );
}
