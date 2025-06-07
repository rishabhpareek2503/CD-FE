/**
 * Data Export Service
 * Handles exporting data to various formats (PDF, Excel, CSV)
 */

import * as XLSX from "xlsx"
import jsPDF from "jspdf"
// Import the autoTable plugin
import "jspdf-autotable"

// Define proper types for jsPDF with autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    getNumberOfPages: () => number
  }
}

export type ExportFormat = "pdf" | "excel" | "csv"

interface ExportOptions {
  filename?: string
  title?: string
  subtitle?: string
  orientation?: "portrait" | "landscape"
  companyInfo?: {
    name: string
    logo?: string
    address?: string
    contact?: string
    website?: string
  }
  chartData?: {
    canvas?: HTMLCanvasElement
    title?: string
    description?: string
  }[]
}

export class DataExportService {
  public static exportData(data: Record<string, unknown>[], format: ExportFormat, options: ExportOptions): void {
    switch (format) {
      case "pdf":
        this.exportToPDF(data, options)
        break
      case "excel":
        this.exportToExcel(data, options.filename || "data")
        break
      case "csv":
        this.exportToCSV(data, options.filename || "data")
        break
      default:
        throw new Error("Unsupported export format")
    }
  }

  public static exportSensorData(
    data: Record<string, unknown>[],
    device: any,
    format: ExportFormat,
    dateRange?: { from: Date; to: Date },
  ): void {
    const filename = `sensor-data-${device.id}-${new Date().toISOString().split("T")[0]}`
    const title = `Sensor Data for ${device.name || device.id}`
    const subtitle = `Device ID: ${device.id} - Location: ${device.location || "Unknown"}`

    // Add date range to subtitle if provided
    const dateRangeText = dateRange
      ? `\nDate Range: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`
      : ""

    this.exportData(data, format, {
      filename,
      title,
      subtitle: subtitle + dateRangeText,
      orientation: "landscape",
      companyInfo: {
        name: "HEEPL Wastewater Monitoring",
        address: "HEEPL Headquarters, Industrial Area, Phase 1",
        contact: "Phone: +91-XXX-XXX-XXXX | Email: info@heepl.com",
        website: "www.heepl.com",
      },
    })
  }

  public static exportDeviceHistory(
    data: Record<string, unknown>[],
    device: any,
    format: ExportFormat,
    dateRange?: { from: Date; to: Date },
  ): void {
    const filename = `device-history-${device.id}-${new Date().toISOString().split("T")[0]}`
    const title = `Historical Data for ${device.name || device.id}`
    const subtitle = `Device ID: ${device.id} - Location: ${device.location || "Unknown"}`

    // Add date range to subtitle if provided
    const dateRangeText = dateRange
      ? `\nDate Range: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`
      : ""

    this.exportData(data, format, {
      filename,
      title,
      subtitle: subtitle + dateRangeText,
      orientation: "landscape",
      companyInfo: {
        name: "HEEPL Wastewater Monitoring",
        address: "HEEPL Headquarters, Industrial Area, Phase 1",
        contact: "Phone: +91-XXX-XXX-XXXX | Email: info@heepl.com",
        website: "www.heepl.com",
      },
    })
  }

  public static exportReport(
    data: Record<string, unknown>[],
    reportType: string,
    format: ExportFormat,
    options?: {
      deviceId?: string;
      dateRange?: { from: Date; to: Date };
    }
  ): void {
    const filename = `historical-data-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'pdf') {
      this.exportToPDF(data, { 
        filename,
        title: 'Historical Data Report',
        orientation: 'landscape'
      });
    } else if (format === 'excel') {
      this.exportToExcel(data, filename);
    } else if (format === 'csv') {
      this.exportToCSV(data, filename);
    }
  }

  private static exportToPDF(data: Record<string, unknown>[], options: ExportOptions): void {
    try {
      // Import jspdf-autotable dynamically to ensure it's available
      import('jspdf-autotable').then((autoTableModule) => {
        // Create a new jsPDF instance with landscape orientation
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: 'a4'
        });

        // Simple header
        doc.setFontSize(16);
        doc.setTextColor(26, 78, 126); // HEEPL blue
        doc.setFont('helvetica', 'bold');
        doc.text('Historical Data Report', 40, 40);

        // Add timestamp
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);

        // Prepare data for the table
        if (data.length === 0) {
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          doc.text('No data available for the selected criteria', 40, 100);
          doc.save(options.filename ? `${options.filename}.pdf` : 'historical-data.pdf');
          return;
        }

        const headers = Object.keys(data[0]);
        const tableData = data.map(row => Object.values(row));

        // Add the table using the imported autoTable function
        autoTableModule.default(doc, {
          head: [headers],
          body: tableData,
          headStyles: {
            fillColor: [26, 78, 126],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            fontSize: 10,
            cellPadding: 6
          },
          bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            fontSize: 9,
            cellPadding: 4,
            font: 'helvetica'
          },
          alternateRowStyles: {
            0: { 
              fillColor: [245, 245, 245],
              textColor: [0, 0, 0]
            }
          },
          margin: { top: 80, left: 40, right: 40 },
          startY: 80,
          theme: 'grid',
          styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          }
        });

        // Save the PDF
        doc.save(options.filename ? `${options.filename}.pdf` : 'historical-data.pdf');
      }).catch(error => {
        console.error('Error loading jspdf-autotable:', error);
        throw new Error('Failed to load PDF generation library. Please try again.');
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF. Please try again.');
    }
  }

  private static addCompanyHeader(doc: jsPDF, options: ExportOptions): void {
    const { title, subtitle, companyInfo } = options

    if (companyInfo) {
      // Add company name with gradient background
      const pageWidth = doc.internal.pageSize.getWidth()

      // Add gradient header
      doc.setFillColor(26, 78, 126) // HEEPL blue
      doc.rect(0, 0, pageWidth, 60, "F")

      // Add company name
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text(companyInfo.name, 40, 35)

      // Add horizontal line
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(1)
      doc.line(40, 45, pageWidth - 40, 45)

      // Add company details
      doc.setFontSize(9)
      doc.setTextColor(220, 220, 220)
      doc.setFont("helvetica", "normal")

      if (companyInfo.address) {
        doc.text(companyInfo.address, pageWidth - 40, 25, { align: "right" })
      }

      if (companyInfo.contact) {
        doc.text(companyInfo.contact, pageWidth - 40, 35, { align: "right" })
      }

      if (companyInfo.website) {
        doc.text(companyInfo.website, pageWidth - 40, 45, { align: "right" })
      }

      // Add title and subtitle
      if (title) {
        doc.setFontSize(16)
        doc.setTextColor(50, 50, 50)
        doc.setFont("helvetica", "bold")
        doc.text(title, pageWidth / 2, 90, { align: "center" })
      }

      if (subtitle) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const subtitleLines = subtitle.split("\n")
        let subtitleYPos = 110
        subtitleLines.forEach((line) => {
          doc.text(line, pageWidth / 2, subtitleYPos, { align: "center" })
          subtitleYPos += 15
        })
      }

      // Add timestamp
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, {
        align: "right",
      })
    }
  }

  private static addCharts(doc: jsPDF, options: ExportOptions): number {
    const { chartData } = options
    let yPos = 150

    if (chartData && chartData.length > 0) {
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 40
      const availableWidth = pageWidth - margin * 2

      chartData.forEach((chart, index) => {
        if (chart.canvas) {
          // Add section title with colored background
          if (chart.title) {
            // Add a colored background for the section title
            doc.setFillColor(240, 245, 250) // Light blue background
            doc.rect(margin - 10, yPos - 15, availableWidth + 20, 30, "F")

            doc.setFontSize(12)
            doc.setTextColor(26, 78, 126) // HEEPL blue
            doc.setFont("helvetica", "bold")
            doc.text(chart.title, margin, yPos)
            yPos += 20
          }

          // Add description
          if (chart.description) {
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.setFont("helvetica", "normal")
            doc.text(chart.description, margin, yPos)
            yPos += 20
          }

          // Add chart image - properly sized and centered
          try {
            const imgData = chart.canvas.toDataURL("image/png")

            // Calculate dimensions to maintain aspect ratio and fit within page
            const imgWidth = availableWidth
            const aspectRatio = chart.canvas.width / chart.canvas.height
            const imgHeight = imgWidth / aspectRatio

            // Center the image
            doc.addImage(imgData, "PNG", margin, yPos, imgWidth, imgHeight)
            yPos += imgHeight + 30
          } catch (error) {
            console.error("Error adding chart to PDF:", error)
            doc.setTextColor(255, 0, 0)
            doc.text("Error adding chart", margin, yPos)
            yPos += 20
          }
        }
      })

      // Add a divider
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos - 15, pageWidth - margin, yPos - 15)
    }

    return yPos
  }

  private static addDataTable(
    doc: jsPDF,
    data: Record<string, unknown>[],
    options: ExportOptions,
    startY: number,
  ): void {
    if (data.length === 0) {
      // If no data, add a message
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text("No data available for this report", doc.internal.pageSize.getWidth() / 2, startY + 30, {
        align: "center",
      })
      return
    }

    try {
      const margin = 40
      const pageWidth = doc.internal.pageSize.getWidth()

      // Ensure we have data to display
      if (data.length === 0) {
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text("No data available for the selected criteria", pageWidth / 2, startY + 30, { align: "center" })
        return
      }
      doc.setFillColor(240, 245, 250) // Light blue background
      doc.rect(margin - 10, startY - 15, pageWidth - margin * 2 + 20, 30, "F")

      doc.setFontSize(12)
      doc.setTextColor(26, 78, 126) // HEEPL blue
      doc.setFont("helvetica", "bold")
      doc.text("Data Table", margin, startY)
      startY += 20

      // Prepare headers and data for autoTable
      const headers = Object.keys(data[0] || {})
      const tableData = data.map((item) => Object.values(item))

      // Define table styles for a more attractive table
      const headerStyles = {
        fillColor: [26, 78, 126], // HEEPL blue
        textColor: [255, 255, 255], // White text for header
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
        cellPadding: 8,
        font: 'helvetica'
      }

      const bodyStyles = {
        fontSize: 9,
        cellPadding: 6,
        lineWidth: 0.1,
        lineColor: [220, 220, 220],
        textColor: [0, 0, 0], // Black text for table body
        font: 'helvetica',
        fontStyle: 'normal',
        overflow: 'linebreak',
        cellWidth: 'wrap',
        valign: 'middle',
        fillColor: [26, 78, 126] // White background for cells
      }

      const alternateRowStyles = {
        0: { 
          fillColor: [51, 102, 153], // Light blue for even rows
          textColor: [255, 255, 255] // Black text
        },
        1: { 
          fillColor: [26, 78, 126], // White for odd rows
          textColor: [255, 255, 255] // Black text
        }
      }

      // Enhanced table styling
      const tableStyles = {
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
          textColor: [50, 50, 50],
          overflow: "linebreak",
        },
        headStyles: headerStyles,
        bodyStyles: bodyStyles,
        alternateRowStyles: alternateRowStyles,
        startY: startY,
        margin: { top: 80, right: margin, bottom: 40, left: margin },
        theme: "grid", // Add grid lines for better readability
        columnStyles: {
          0: { cellWidth: "auto", fontStyle: "bold" }, // Make first column bold
        },
        didDrawPage: (data: any) => {
          // Add page number
          const pageNumber = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text(
            `Page ${data.pageNumber} of ${pageNumber}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" },
          )

          // Add company name in footer
          if (options.companyInfo) {
            doc.text(options.companyInfo.name, margin, doc.internal.pageSize.getHeight() - 20)
          }

          // Add header to each page
          if (data.pageNumber > 1) {
            // Add a mini header on subsequent pages
            doc.setFillColor(26, 78, 126) // HEEPL blue
            doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F")

            doc.setTextColor(255, 255, 255)
            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.text(options.title || "Report", margin, 20)

            if (options.companyInfo) {
              doc.setFontSize(10)
              doc.text(options.companyInfo.name, doc.internal.pageSize.getWidth() - margin, 20, { align: "right" })
            }
          }
        },
      }

      // Use the correct way to call autoTable with proper typing
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: startY,
        margin: { left: margin, right: margin },
        headStyles: headerStyles,
        bodyStyles: bodyStyles,
        alternateRowStyles: alternateRowStyles,
        styles: {
          textColor: [0, 0, 0], // Force black text
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 6,
          lineWidth: 0.1,
          lineColor: [220, 220, 220]
        },
      })
    } catch (error) {
      console.error("Error generating table:", error)

      // Fallback if autoTable fails
      doc.setFontSize(12)
      doc.setTextColor(255, 0, 0)
      doc.text("Error generating table. Please try again.", doc.internal.pageSize.getWidth() / 2, startY + 30, {
        align: "center",
      })

      // Create a simple table manually as fallback
      this.createManualTable(
        doc,
        Object.keys(data[0] || {}),
        data.map((item) => Object.values(item)),
        startY + 50,
      )
    }
  }

  private static createManualTable(doc: jsPDF, headers: string[], tableData: unknown[][], startY: number): void {
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 40
    const tableWidth = pageWidth - 2 * margin
    const colWidth = tableWidth / headers.length

    // Draw header
    doc.setFillColor(26, 78, 126)
    doc.rect(margin, startY, tableWidth, 30, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")

    headers.forEach((header, i) => {
      doc.text(header, margin + i * colWidth + colWidth / 2, startY + 15, { align: "center" })
    })

    // Draw rows
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    let rowY = startY + 30
    const rowHeight = 25

    tableData.forEach((row, rowIndex) => {
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 250, 255) // Light blue for even rows
      } else {
        doc.setFillColor(255, 255, 255) // White for odd rows
      }
      doc.rect(margin, rowY, tableWidth, rowHeight, "F")

      // Add cell borders
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.1)
      doc.rect(margin, rowY, tableWidth, rowHeight, "S")

      // Add cell data
      row.forEach((cell, cellIndex) => {
        // Draw cell border
        doc.line(margin + cellIndex * colWidth, rowY, margin + cellIndex * colWidth, rowY + rowHeight)

        // Add cell text
        doc.text(String(cell), margin + cellIndex * colWidth + colWidth / 2, rowY + rowHeight / 2, { align: "center" })
      })

      rowY += rowHeight

      // Add new page if needed
      if (rowY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage()

        // Add mini header on new page
        doc.setFillColor(26, 78, 126) // HEEPL blue
        doc.rect(0, 0, pageWidth, 30, "F")

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Report Continued", margin, 20)

        // Reset row position
        rowY = 40

        // Redraw header
        doc.setFillColor(26, 78, 126)
        doc.rect(margin, rowY, tableWidth, 30, "F")

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")

        headers.forEach((header, i) => {
          doc.text(header, margin + i * colWidth + colWidth / 2, rowY + 15, { align: "center" })
        })

        rowY += 30
      }
    })
  }

  private static exportToExcel(data: Record<string, unknown>[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data")

    // Auto-size columns
    const colWidths = this.getColumnWidths(data)
    worksheet["!cols"] = colWidths.map((width) => ({ wch: width }))

    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  private static exportToCSV(data: Record<string, unknown>[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  private static getColumnWidths(data: Record<string, unknown>[]): number[] {
    if (data.length === 0) return []

    const headers = Object.keys(data[0])
    const widths = headers.map((header) => Math.max(header.length, 10)) // Start with header length or minimum 10

    // Check each row's data length
    data.forEach((row) => {
      headers.forEach((header, index) => {
        const value = String(row[header] || "")
        widths[index] = Math.max(widths[index], value.length)
      })
    })

    // Cap maximum width
    return widths.map((width) => Math.min(width, 50))
  }

  // Generate a PDF preview blob for viewing in the browser
  public static generatePDFPreview(data: Record<string, unknown>[], options: ExportOptions): Blob {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: options.orientation || "portrait",
        unit: "pt",
        format: "a4",
      })

      // Add company header
      this.addCompanyHeader(doc, options)

      // Add charts if available
      const yPos = this.addCharts(doc, options)

      // Add data table
      this.addDataTable(doc, data, options, yPos)

      // Return the PDF as a blob for preview
      return new Blob([doc.output("blob")], { type: "application/pdf" })
    } catch (error) {
      console.error("Error generating PDF preview:", error)
      throw new Error("Failed to generate PDF preview. Please try again.")
    }
  }
}
