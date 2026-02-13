import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Edit, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDesigners, useCreateDesigner, useUpdateDesigner, useDeleteDesigner } from "@/hooks/use-designers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDesignerSchema, type InsertDesigner } from "@/lib/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Designers() {
  const { data: designers, isLoading } = useDesigners();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const filteredDesigners = designers?.filter((d) =>
    d.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Designers</h1>
            <p className="text-muted-foreground mt-1">Manage your design team and their workload.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 w-[250px] bg-card"
                placeholder="Search designers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  <Plus className="w-4 h-4" /> Add Designer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Designer</DialogTitle>
                </DialogHeader>
                <DesignerForm onSuccess={() => setIsCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredDesigners?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
            <User className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No designers found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
              Get started by adding your first designer to the team.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create Designer</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigners?.map((designer) => (
              <Card key={designer.id} className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-card group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center text-lg font-bold border border-primary/10">
                    {designer.fullName.charAt(0)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditId(designer.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DeleteButton id={designer.id} />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1">{designer.fullName}</h3>
                <p className="text-sm text-muted-foreground mb-4">ID: {designer.id}</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge variant="secondary" className="font-normal">{designer.workingHours}h / day</Badge>
                  <Badge variant={designer.attachedObjectsCount > 0 ? "default" : "outline"} className="font-normal">
                    {designer.attachedObjectsCount} Objects
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Designer</DialogTitle>
            </DialogHeader>
            {editId && designers && (
              <DesignerForm
                initialData={designers.find((d) => d.id === editId)}
                onSuccess={() => setEditId(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const { mutate, isPending } = useDeleteDesigner();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (confirm("Are you sure? This will delete attached objects too.")) mutate(id);
      }}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

function DesignerForm({ initialData, onSuccess }: { initialData?: InsertDesigner & { id: string }; onSuccess: () => void }) {
  const { mutate: create, isPending: isCreating } = useCreateDesigner();
  const { mutate: update, isPending: isUpdating } = useUpdateDesigner();
  const form = useForm<InsertDesigner>({
    resolver: zodResolver(insertDesignerSchema),
    defaultValues: initialData || { fullName: "", workingHours: 8 },
  });

  const onSubmit = (data: InsertDesigner) => {
    if (initialData) {
      update({ id: initialData.id, ...data }, { onSuccess });
    } else {
      create(data, { onSuccess });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workingHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Working Hours</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={12} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
