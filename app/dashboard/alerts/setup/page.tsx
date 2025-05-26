import { AlertNotificationSetup } from "@/components/alert-notification-setup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AlertSetupPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Alert Notifications</h1>
        <p className="text-muted-foreground">
          Set up real-time alerts to be notified when critical issues are detected
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AlertNotificationSetup />

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Understanding real-time alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Instant Notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Receive alerts directly on your mobile device or desktop browser when critical thresholds are exceeded.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Alert Types</h3>
              <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium text-yellow-600">Warnings</span> - Parameters approaching critical levels
                </li>
                <li>
                  <span className="font-medium text-red-600">Critical Alerts</span> - Immediate attention required
                </li>
                <li>
                  <span className="font-medium text-blue-600">Maintenance</span> - System maintenance notifications
                </li>
                <li>
                  <span className="font-medium text-green-600">Recovery</span> - System returned to normal operation
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Requirements</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Notifications require a modern browser with notification permissions enabled. For mobile devices, you
                may need to add this site to your home screen for the best experience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
