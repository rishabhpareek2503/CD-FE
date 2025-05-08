"use client"

import Link from "next/link"
import { FileText, Download, Settings, AlertTriangle, Bell, Brain, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help & Documentation</h1>
        <p className="text-gray-500 mt-1">Find guides and documentation for the wastewater monitoring dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/help/data-export" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Download className="mr-2 h-5 w-5 text-blue-600" />
                Data Export Guide
              </CardTitle>
              <CardDescription>Learn how to export data in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Export your data in PDF, Excel, or CSV formats for analysis, reporting, and compliance purposes.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/help/device-management" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Settings className="mr-2 h-5 w-5 text-green-600" />
                Device Management
              </CardTitle>
              <CardDescription>Managing your monitoring devices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Learn how to add, configure, and maintain your wastewater monitoring devices.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/help/alerts" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
                Alerts & Notifications
              </CardTitle>
              <CardDescription>Understanding the alert system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Learn about the alert system, notification preferences, and how to respond to alerts.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/help/reports" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-purple-600" />
                Reports Guide
              </CardTitle>
              <CardDescription>Generating and managing reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Learn how to generate, customize, and export reports for compliance and analysis.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/help/monitoring" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Bell className="mr-2 h-5 w-5 text-red-600" />
                Automated Monitoring
              </CardTitle>
              <CardDescription>Setting up automated monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Learn how to configure automated monitoring and alerts for your devices.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/help/ai-features" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Brain className="mr-2 h-5 w-5 text-indigo-600" />
                AI Features Guide
              </CardTitle>
              <CardDescription>Using AI predictions and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Learn how to use AI-powered features for chemical dosing recommendations and fault diagnosis.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/help/data-visualization" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="mr-2 h-5 w-5 text-cyan-600" />
                Data Visualization
              </CardTitle>
              <CardDescription>Understanding charts and graphs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Learn how to interpret and customize the various charts and visualizations in the dashboard.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>Contact our support team for assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              If you need additional help or have questions that aren't covered in our documentation, please contact our
              support team:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: support@heepl.com</li>
              <li>Phone: +91-123-456-7890</li>
              <li>Support Hours: Monday to Friday, 9:00 AM to 6:00 PM IST</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
