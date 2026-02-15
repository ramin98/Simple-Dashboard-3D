import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsertObject } from "@/lib/schema";
import { mockApi } from "@/lib/mockApi";
import { useToast } from "@/hooks/use-toast";

export function useObjects() {
  return useQuery({
    queryKey: [api.objects.list.path],
    queryFn: () => mockApi.objects.list(),
  });
}

export function useCreateObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: InsertObject) => mockApi.objects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.objects.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.designers.list.path] });
      toast({ title: "Success", description: "Object created" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<InsertObject>) =>
      mockApi.objects.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.objects.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.designers.list.path] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => mockApi.objects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.objects.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.designers.list.path] });
      toast({ title: "Success", description: "Object deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
