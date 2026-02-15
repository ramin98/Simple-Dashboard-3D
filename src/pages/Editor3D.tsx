import { useState, Suspense, useRef, useEffect, useCallback } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Html,
  ContactShadows,
  useCursor,
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

const SCALE_BY_SIZE = { small: 0.6, normal: 1, large: 1.4 } as const;

function getShapeAndYOffset(
  shape: "box" | "sphere" | "cylinder",
  size: string
): { geometry: JSX.Element; yOffset: number } {
  const scale = SCALE_BY_SIZE[size as keyof typeof SCALE_BY_SIZE] ?? 1;
  const s = scale;
  switch (shape) {
    case "sphere":
      return { geometry: <sphereGeometry args={[s * 0.5, 32, 32]} />, yOffset: s * 0.5 };
    case "cylinder":
      return { geometry: <cylinderGeometry args={[s * 0.5, s * 0.5, s * 1.2, 32]} />, yOffset: s * 0.6 };
    default:
      return { geometry: <boxGeometry args={[s, s, s]} />, yOffset: s * 0.5 };
  }
}

type SceneObject = {
  id: string;
  position: [number, number, number];
  size: string;
  color: string;
  name: string;
  shape?: "box" | "sphere" | "cylinder";
};

const DRAG_THRESHOLD_PX = 5;
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const groundIntersect = new THREE.Vector3();

function DraggableObject({
  data,
  isSelected,
  onSelect,
  onMove,
}: {
  data: SceneObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (pos: [number, number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const draggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const { camera, gl } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const ndcRef = useRef(new THREE.Vector2());
  useCursor(hovered || draggingRef.current);

  const shape = data.shape ?? (data.size === "small" ? "sphere" : data.size === "large" ? "cylinder" : "box");
  const { geometry, yOffset } = getShapeAndYOffset(shape, data.size);

  useEffect(() => {
    if (meshRef.current && data.position) {
      meshRef.current.position.set(data.position[0], data.position[1], data.position[2]);
    }
  }, [data.position]);

  const updatePositionFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!meshRef.current) return;
      const rect = gl.domElement.getBoundingClientRect();
      ndcRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndcRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(ndcRef.current, camera);
      if (raycasterRef.current.ray.intersectPlane(groundPlane, groundIntersect)) {
        meshRef.current.position.set(groundIntersect.x, yOffset, groundIntersect.z);
      }
    },
    [camera, gl.domElement, yOffset]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      useEditorStore.getState().setDraggingObject(true);

      const onDocPointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - pointerStartRef.current.x;
        const dy = moveEvent.clientY - pointerStartRef.current.y;
        if (!draggingRef.current && (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)) {
          draggingRef.current = true;
        }
        if (draggingRef.current) {
          updatePositionFromPointer(moveEvent.clientX, moveEvent.clientY);
        }
      };

      const onDocPointerUp = () => {
        document.removeEventListener("pointermove", onDocPointerMove);
        document.removeEventListener("pointerup", onDocPointerUp);
        const wasDragging = draggingRef.current;
        draggingRef.current = false;
        if (wasDragging && meshRef.current) {
          const { x, z } = meshRef.current.position;
          meshRef.current.position.y = yOffset;
          onMove([x, yOffset, z]);
        } else {
          const idToSelect = data.id;
          requestAnimationFrame(() => onSelect(idToSelect));
        }
        requestAnimationFrame(() => {
          useEditorStore.getState().setDraggingObject(false);
        });
      };

      document.addEventListener("pointermove", onDocPointerMove);
      document.addEventListener("pointerup", onDocPointerUp);
    },
    [yOffset, data.id, onSelect, onMove, updatePositionFromPointer]
  );

  const handlePointerUp = useCallback(
    (_e: ThreeEvent<PointerEvent>) => {
      if (!draggingRef.current) {
        onSelect(data.id);
      }
    },
    [data.id, onSelect]
  );

  return (
    <mesh
      ref={meshRef}
      position={[data.position[0], data.position[1] ?? yOffset, data.position[2]]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      castShadow
      receiveShadow
    >
      {geometry}
      <meshStandardMaterial color={data.color} emissive={isSelected ? "#444" : "#000"} roughness={0.2} metalness={0.5} />
      {hovered && (
        <Html position={[0, 1.5, 0]} center style={{ pointerEvents: "none" }}>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
            {data.name}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Scene({
  objects,
  onSelect,
  onMove,
  selectedId,
}: {
  objects: SceneObject[] | undefined;
  onSelect: (id: string) => void;
  onMove: (id: string, pos: number[]) => void;
  selectedId: string | null;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
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
  const { toast } = useToast();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
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
      <div className="flex-1 md:ml-64 flex relative min-w-0 overflow-hidden">
        <div className="w-80 shrink-0 border-r border-border bg-card flex flex-col z-10 shadow-xl">
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
                    <div className="text-xs text-muted-foreground">{d.workingHoursFrom} – {d.workingHoursTo}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 min-w-0 relative bg-gradient-to-br from-gray-50 to-gray-200">
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
            <OrbitControls makeDefault enabled={!useEditorStore((s) => s.isDraggingObject)} />
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
          <div className="absolute right-0 top-0 bottom-0 w-72 shrink-0 border-l border-border bg-white z-20 shadow-xl flex flex-col">
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
                const shape = data.shape ?? "box";
                const yOffset = getShapeAndYOffset(shape, data.size).yOffset;
                createObject(
                  { ...data, position: [createPos[0], yOffset, createPos[2]] },
                  { onSuccess: () => setCreateModalOpen(false) }
                );
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
