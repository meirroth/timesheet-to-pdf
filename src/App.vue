<template>
  <form class="max-w-4xl mx-auto my-8 p-8 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-4">Generate PDF Report from Timesheet</h1>
    <div class="mb-4">
      <label for="title" class="block font-medium mb-1">Title</label>
      <input id="title" v-model="title" type="text" class="w-full p-2 rounded border-gray-300" />
    </div>
    <div class="mb-4">
      <label for="subtitle" class="block font-medium mb-1">Subtitle</label>
      <input
        id="subtitle"
        v-model="subtitle"
        type="text"
        class="w-full p-2 rounded border-gray-300"
      />
    </div>
    <div class="mb-4">
      <label for="upload" class="block font-medium mb-1"
        >Upload XLSX export from Hours Tracker app</label
      >
      <input id="upload" ref="fileInput" type="file" @change="handleFileUpload" class="hidden" />
      <div class="flex items-center">
        <button
          type="button"
          class="px-4 py-2 bg-gray-800 text-white rounded-md"
          @click="$refs.fileInput.click()"
        >
          Select File
        </button>
        <span class="ml-2" v-if="fileName">{{ fileName }}</span>
      </div>
    </div>
    <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded-md" @click="handleSubmit">
      Generate PDF
    </button>
  </form>
</template>

<script>
import * as XLSX from 'xlsx'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.pdfMake.vfs
import {
  parseTime,
  formatTime,
  sumTimes,
  parseDate,
  formatDate,
  formatCurrency,
  sumNumbers,
} from './utils'

export default {
  data() {
    return {
      title: 'Title',
      subtitle: 'Subtitle',
      fileName: '',
      fileData: null,
      data: null,
    }
  },
  methods: {
    handleFileUpload(event) {
      this.fileData = event.target.files[0]
      this.fileName = this.fileData ? this.fileData.name : ''
    },
    async handleSubmit() {
      if (!this.fileData) {
        return
      }

      const workbook = await this.parseWorkbook()
      const data = await this.extractDataFromWorkbook(workbook)

      this.data = data
      await this.generatePdf()
    },
    async parseWorkbook() {
      const fileReader = new FileReader()
      return new Promise((resolve, reject) => {
        fileReader.onload = (event) => {
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          resolve(workbook)
        }
        fileReader.onerror = reject
        fileReader.readAsArrayBuffer(this.fileData)
      })
    },
    async extractDataFromWorkbook(workbook) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false,
      })
      return data
    },
    async generatePdf() {
      const { title, subtitle, data } = this

      const totalHours = sumTimes(data.map((row) => row['Work time']))
      const totalEarnings = sumNumbers(data.map((row) => parseFloat(row.Earnings)))
      const hourlyRate = totalEarnings / (parseTime(totalHours) / (1000 * 60 * 60))

      const formattedData = data.map((row) => ({
        date: formatDate(parseDate(row.Date)),
        clockedIn: formatTime(row['Clocked in']),
        clockedOut: formatTime(row['Clocked out']),
        workTime: row['Work time'],
        earnings: formatCurrency(parseFloat(row.Earnings)),
        notes: row.Notes,
      }))

      const docDefinition = {
        pageSize: 'A4',
        content: [
          { text: title, style: 'title' },
          { text: subtitle, style: 'subtitle' },
          {
            style: 'table',
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: 'Date', style: 'tableHeader' },
                  { text: 'Clocked in', style: 'tableHeader' },
                  { text: 'Clocked out', style: 'tableHeader' },
                  { text: 'Work time', style: 'tableHeader' },
                  { text: 'Earnings', style: 'tableHeader' },
                  { text: 'Notes', style: 'tableHeader' },
                ],
                ...formattedData.map((row) => [
                  row.date,
                  row.clockedIn,
                  row.clockedOut,
                  row.workTime,
                  row.earnings,
                  row.notes,
                ]),
                [
                  {
                    text: `HOURLY RATE: ${formatCurrency(hourlyRate)}`,
                    colSpan: 3,
                    style: 'tableFooter',
                  },
                  {},
                  {},
                  { text: totalHours, style: 'tableFooter' },
                  { text: formatCurrency(totalEarnings), colSpan: 2, style: 'tableFooter' },
                  {},
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
            },
          },
        ],
        styles: {
          title: {
            fontSize: 12,
            bold: true,
            alignment: 'center',
          },
          subtitle: {
            fontSize: 10,
            alignment: 'center',
            margin: [0, 0, 0, 4],
          },
          table: {
            fontSize: 8,
          },
          tableHeader: {
            bold: true,
            fillColor: '#000',
            color: '#fff',
          },
          tableFooter: {
            bold: true,
            fillColor: '#000',
            color: '#fff',
          },
        },
      }

      const pdf = pdfMake.createPdf(docDefinition)
      pdf.download(`${title} - ${subtitle}.pdf`)
    },
  },
}
</script>
