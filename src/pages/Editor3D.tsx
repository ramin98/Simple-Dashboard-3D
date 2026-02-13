import { useState, Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
  TransformControls,
  Html,
  ContactShadows,
  useCursor,
  useThree,
} from "@react-three/drei";
import * as THREE from "three";
import { Sidebar } from "@/components/Sidebar";
import { useObjects, useCreateObject, useUpdateObject, useDeleteObject } from "@/hooks/use-objects";
import { useDesigners } from "@/hooks/use-designers";
import { useEditorStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Plus, MousePointer2, Move, Box, Trash2, Maximize, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ObjectForm } from "@/components/ObjectForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function DraggableObject({
  data,
  isSelected,
  onSelect,
  onMove,
}: {
  data: { id: string; position: [number, number, number]; size: string; color: string; name: string };
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (pos: [number, number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  useEffect(() => {
    if (meshRef.current && data.position) {
      meshRef.current.position.set(data.position[0], data.position[1], data.position[2]);
    }
  }, [data.position]);

  const geometry = {
    small: <sphereGeometry args={[0.5, 32, 32]} />,
    normal: <boxGeometry args={[1, 1, 1]} />,
    large: <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />,
  }[data.size] ?? <boxGeometry args={[1, 1, 1]} />;

  const yOffset = data.size === "small" ? 0.5 : data.size === "large" ? 0.75 : 0.5;

  return (
    <>
      {isSelected && (
        <TransformControls
          object={meshRef}
          mode="translate"
          onMouseUp={() => {
            if (meshRef.current) {
              const { x, y, z } = meshRef.current.position;
              onMove([x, y, z]);
            }
          }}
        />
      )}
      <mesh
        ref={meshRef}
        position={[data.position[0], yOffset, data.position[2]]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(data.id);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        castShadow
        receiveShadow
      >
        {geometry}
        <meshStandardMaterial color={data.color} emissive={isSelected ? "#444" : "#000"} roughness={0.2} metalness={0.5} />
        {hovered && (
          <Html position={[0, 1.5, 0]} center>
            <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
              {data.name}
            </div>
          </Html>
        )}
      </mesh>
    </>
  );
}

function Scene({
  objects,
  onSelect,
  onMove,
  selectedId,
}: {
  objects: Array<{ id: string; position: [number, number, number]; size: string; color: string; name: string }> | undefined;
  onSelect: (id: string) => void;
  onMove: (id: string, pos: number[]) => void;
  selectedId: string | null;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
      <Environment preset="city" />
      <group position={[0, -0.01, 0]}>
        <Grid infiniteGrid fadeDistance={30} fadeStrength={5} />
        <ContactShadows resolution={1024} scale={40} blur={2} opacity={0.5} far={10} color="#000000" />
      </group>
      {objects?.map((obj) => (
        <DraggableObject
          key={obj.id}
          data={obj}
          isSelected={selectedId === obj.id}
          onSelect={onSelect}
          onMove={(pos) => onMove(obj.id, pos)}
        />
      ))}
    </>
  );
}

export default function Editor3D() {
  const { data: objects } = useObjects();
  const { data: designers } = useDesigners();
  const { mutate: createObject, isPending: isCreating } = useCreateObject();
  const { mutate: updateObject } = useUpdateObject();
  const { mutate: deleteObject } = useDeleteObject();
  const { selectedObjectId, setSelectedObjectId } = useEditorStore();
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPos, setCreatePos] = useState<[number, number, number]>([0, 0, 0]);

  const selectedObject = objects?.find((o) => o.id === selectedObjectId);

  const handleDoubleClick = () => {
    if (!designers || designers.length === 0) {
      toast({ title: "No Designers Found", description: "Please create a designer first before adding objects.", variant: "destructive" });
      return;
    }
    const x = Math.round((Math.random() * 8 - 4) * 10) / 10;
    const z = Math.round((Math.random() * 8 - 4) * 10) / 10;
    setCreatePos([x, 0, z]);
    setCreateModalOpen(true);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex relative">
        <div className="w-80 border-r border-border bg-card flex flex-col z-10 shadow-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-primary" />
              Scene Explorer
            </h2>
          </div>
          <Tabs defaultValue="objects" className="flex-1 flex flex-col">
            <div className="px-4 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="objects" className="flex-1">Objects</TabsTrigger>
                <TabsTrigger value="designers" className="flex-1">Designers</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="objects" className="flex-1 overflow-hidden flex flex-col mt-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {objects?.map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 flex items-center gap-3",
                        selectedObjectId === obj.id ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:border-border"
                      )}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: obj.color }} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{obj.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {obj.size} • {designers?.find((d) => d.id === obj.designerId)?.fullName ?? "Unknown"}
                        </p>
                      </div>
                      {selectedObjectId === obj.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  ))}
                  {objects?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p>No objects in scene.</p>
                      <p>Double click the grid to add one.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border">
                <Button className="w-full gap-2" onClick={() => handleDoubleClick()}>
                  <Plus className="w-4 h-4" /> Add Object
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="designers" className="flex-1 overflow-auto p-4 mt-0">
              <div className="space-y-3">
                {designers?.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{d.fullName}</span>
                      <Badge variant="outline" className="text-xs">{d.attachedObjectsCount} items</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{d.workingHours} hrs/day</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-200">
          <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
            <Suspense fallback={null}>
              <Scene
                objects={objects}
                selectedId={selectedObjectId}
                onSelect={setSelectedObjectId}
                onMove={(id, pos) => updateObject({ id, position: pos as [number, number, number] })}
              />
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.02, 0]}
                onDoubleClick={handleDoubleClick}
                onClick={() => setSelectedObjectId(null)}
              >
                <planeGeometry args={[50, 50]} />
                <meshBasicMaterial visible={false} />
              </mesh>
            </Suspense>
            <OrbitControls makeDefault />
          </Canvas>
          <div className="absolute top-4 right-4 pointer-events-none">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-sm">
              <MousePointer2 className="w-3 h-3 mr-1" /> Double click to add
            </Badge>
            <Badge variant="secondary" className="bg-white/90 backdrop-blur shadow-sm ml-2">
              <Move className="w-3 h-3 mr-1" /> Drag to move
            </Badge>
          </div>
        </div>

        {selectedObjectId && selectedObject && (
          <div className="w-72 border-l border-border bg-white z-20 shadow-xl flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold">Properties</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedObjectId(null)}>
                <Maximize className="w-4 h-4 rotate-45" />
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <ObjectForm
                designers={designers ?? []}
                defaultValues={selectedObject}
                isLoading={false}
                submitLabel="Update Object"
                onSubmit={(data) => {
                  updateObject({ id: selectedObject.id, ...data });
                  toast({ title: "Updated", description: "Object properties saved." });
                }}
              />
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Actions</h4>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => {
                    deleteObject(selectedObject.id);
                    setSelectedObjectId(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Delete Object
                </Button>
              </div>
            </div>
          </div>
        )}

        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Object</DialogTitle>
            </DialogHeader>
            <ObjectForm
              designers={designers ?? []}
              isLoading={isCreating}
              defaultValues={{ position: createPos }}
              onSubmit={(data) => {
                createObject({ ...data, position: createPos }, { onSuccess: () => setCreateModalOpen(false) });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
