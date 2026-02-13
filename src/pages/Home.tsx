import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDesigners } from "@/hooks/use-designers";
import { useObjects } from "@/hooks/use-objects";
import { Activity, Box, Users, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: designers } = useDesigners();
  const { data: objects } = useObjects();

  const stats = [
    { label: "Total Designers", value: designers?.length || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Objects", value: objects?.length || 0, icon: Box, color: "text-indigo-500", bg: "bg-indigo-50" },
    {
      label: "Avg Working Hours",
      value: designers?.length ? Math.round(designers.reduce((acc, d) => acc + d.workingHours, 0) / designers.length) + "h" : "0h",
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-display">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back to Studio 3D.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/editor">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  Open Editor <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objects?.slice(0, 5).map((obj) => (
                  <div key={obj.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Box className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Object &quot;{obj.name}&quot; created</p>
                      <p className="text-xs text-muted-foreground">Assigned to a designer</p>
                    </div>
                    <div className="text-xs text-muted-foreground">Just now</div>
                  </div>
                ))}
                {(!objects || objects.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Ready to create?</h3>
              <p className="text-primary-foreground/90 mb-6 max-w-sm">
                Jump into the 3D editor to start building your scene with your design team.
              </p>
              <Link href="/editor">
                <Button size="lg" variant="secondary" className="font-semibold shadow-lg">
                  Launch Editor
                </Button>
              </Link>
            </div>
            <Box className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
            <Users className="absolute top-8 right-8 w-12 h-12 text-white/10" />
          </div>
        </div>
      </main>
    </div>
  );
}
