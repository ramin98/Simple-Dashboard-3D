import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Designer, InsertDesigner } from "@/lib/schema";
import { mockApi } from "@/lib/mockApi";
import { useToast } from "@/hooks/use-toast";

export function useDesigners() {
  return useQuery({
    queryKey: [api.designers.list.path],
    queryFn: () => mockApi.designers.list(),
  });
}

export function useCreateDesigner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: InsertDesigner) => mockApi.designers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.designers.list.path] });
      toast({ title: "Success", description: "Designer created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateDesigner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<InsertDesigner>) =>
      mockApi.designers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.designers.list.path] });
      toast({ title: "Success", description: "Designer updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDesigner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => mockApi.designers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.designers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.objects.list.path] });
      toast({ title: "Success", description: "Designer deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
