"use client"

import Link from "next/link"
import { ArrowLeft, FileText, FileSpreadsheet, FileCode, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DataExportHelpPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/help">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Data Export Guide</h1>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Data Export</AlertTitle>
        <AlertDescription>
          The wastewater monitoring dashboard allows you to export data in various formats for analysis, reporting, and
          compliance purposes.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pdf">PDF Export</TabsTrigger>
          <TabsTrigger value="excel">Excel Export</TabsTrigger>
          <TabsTrigger value="csv">CSV Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export Overview</CardTitle>
              <CardDescription>Understanding the export options available in the dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The wastewater monitoring dashboard provides comprehensive data export capabilities, allowing you to
                export data in three formats:
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-blue-600" />
                      PDF Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Ideal for formal reports, presentations, and sharing with stakeholders who need a formatted
                      document.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileSpreadsheet className="mr-2 h-5 w-5 text-green-600" />
                      Excel Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Perfect for data analysis, creating charts, and performing calculations on the exported data.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileCode className="mr-2 h-5 w-5 text-amber-600" />
                      CSV Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Best for importing into other systems, databases, or for use with data analysis tools.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-lg font-medium mt-6">Where to Find Export Options</h3>
              <p>Export buttons are available in several locations throughout the dashboard:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device Details page - Export current sensor readings</li>
                <li>Historical Data page - Export historical data with filtering options</li>
                <li>Reports page - Export generated reports</li>
                <li>Alerts page - Export alert history</li>
              </ul>

              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                <Download className="h-10 w-10 text-blue-600 mr-4" />
                <div>
                  <h4 className="font-medium">How to Export Data</h4>
                  <p className="text-sm text-gray-500">
                    Look for the "Export" button in the relevant section, click it, and select your preferred format
                    from the dropdown menu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF Export</CardTitle>
              <CardDescription>Exporting data as PDF documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-10 w-10 text-blue-600 mr-4" />
                <div>
                  <h4 className="font-medium">PDF Export Features</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    PDF exports include formatted tables, headers, and metadata about the exported data.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-4">PDF Export Benefits</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Professional formatting with headers, footers, and page numbers</li>
                <li>Company branding included automatically</li>
                <li>Suitable for printing and formal documentation</li>
                <li>Includes metadata such as export date, device information, and date ranges</li>
                <li>Consistent formatting across all devices and platforms</li>
              </ul>

              <h3 className="text-lg font-medium mt-4">When to Use PDF Export</h3>
              <p>PDF export is ideal for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Regulatory compliance reporting</li>
                <li>Sharing data with stakeholders who don't need to modify the data</li>
                <li>Creating permanent records of sensor readings</li>
                <li>Printing reports for meetings or presentations</li>
                <li>Archiving data in a standardized format</li>
              </ul>

              <Alert className="mt-6">
                <Info className="h-4 w-4" />
                <AlertTitle>PDF Export Tip</AlertTitle>
                <AlertDescription>
                  For large datasets, PDF exports will automatically paginate the data and include headers on each page
                  for better readability.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Excel Export</CardTitle>
              <CardDescription>Exporting data as Excel spreadsheets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FileSpreadsheet className="h-10 w-10 text-green-600 mr-4" />
                <div>
                  <h4 className="font-medium">Excel Export Features</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Excel exports provide data in a format that's ready for analysis, with properly formatted columns
                    and data types.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-4">Excel Export Benefits</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data is organized in properly formatted columns with appropriate data types</li>
                <li>Enables further analysis, filtering, and sorting</li>
                <li>Create custom charts and visualizations from the exported data</li>
                <li>Perform calculations and statistical analysis</li>
                <li>Compatible with Microsoft Excel, Google Sheets, and other spreadsheet applications</li>
              </ul>

              <h3 className="text-lg font-medium mt-4">When to Use Excel Export</h3>
              <p>Excel export is ideal for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Performing detailed data analysis</li>
                <li>Creating custom charts and visualizations</li>
                <li>Combining data from multiple sources</li>
                <li>Applying formulas and calculations to the data</li>
                <li>Sharing data with team members who need to work with the data</li>
              </ul>

              <Alert className="mt-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Excel Export Tip</AlertTitle>
                <AlertDescription>
                  Column widths are automatically adjusted based on the data content for better readability. Dates and
                  numeric values are properly formatted.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV Export</CardTitle>
              <CardDescription>Exporting data as CSV files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <FileCode className="h-10 w-10 text-amber-600 mr-4" />
                <div>
                  <h4 className="font-medium">CSV Export Features</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    CSV exports provide data in a simple, universal format that can be imported into virtually any
                    system.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-4">CSV Export Benefits</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Universal compatibility with virtually all data systems</li>
                <li>Smaller file size compared to Excel or PDF</li>
                <li>Easy to import into databases, analysis tools, or other software</li>
                <li>Simple text format that can be processed programmatically</li>
                <li>No special software required to open (can be viewed in any text editor)</li>
              </ul>

              <h3 className="text-lg font-medium mt-4">When to Use CSV Export</h3>
              <p>CSV export is ideal for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Importing data into other systems or databases</li>
                <li>Data migration between platforms</li>
                <li>Automated data processing workflows</li>
                <li>Working with data analysis tools like R, Python, or MATLAB</li>
                <li>Situations where file size needs to be minimized</li>
              </ul>

              <Alert className="mt-6">
                <Info className="h-4 w-4" />
                <AlertTitle>CSV Export Tip</AlertTitle>
                <AlertDescription>
                  CSV files use UTF-8 encoding to ensure proper handling of special characters. The first row contains
                  column headers for easy identification.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
