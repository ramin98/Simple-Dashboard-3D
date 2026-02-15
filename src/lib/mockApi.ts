import { type Designer, type InsertDesigner, type AppObject, type InsertObject } from "@/lib/schema";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const generateId = () => Math.random().toString(36).slice(2, 11);

const STORAGE_KEY = "asset-manager-db";

const INITIAL_DATA = {
  designers: [
    { id: "d1", fullName: "Alice Johnson", workingHoursFrom: 9, workingHoursTo: 17, attachedObjectsCount: 2, createdAt: Date.now() },
    { id: "d2", fullName: "Bob Smith", workingHoursFrom: 10, workingHoursTo: 16, attachedObjectsCount: 1, createdAt: Date.now() },
  ] as Designer[],
  objects: [
    { id: "o1", name: "Blue Cube", designerId: "d1", color: "#3b82f6", position: [-2, 0.5, 0], shape: "box", size: "normal", createdAt: Date.now() },
    { id: "o2", name: "Red Sphere", designerId: "d1", color: "#ef4444", position: [2, 0.5, 0], shape: "sphere", size: "small", createdAt: Date.now() },
    { id: "o3", name: "Green Cylinder", designerId: "d2", color: "#22c55e", position: [0, 0.6, -2], shape: "cylinder", size: "large", createdAt: Date.now() },
  ] as AppObject[],
};

function migrateDesigner(d: Record<string, unknown>): Designer {
  const hasOld = "workingHours" in d && typeof (d as { workingHours?: number }).workingHours === "number";
  const hasNew = "workingHoursFrom" in d && "workingHoursTo" in d;
  if (hasNew || !hasOld)
    return d as Designer;
  const hours = (d as { workingHours: number }).workingHours;
  return {
    ...d,
    workingHoursFrom: 9,
    workingHoursTo: Math.min(23, 9 + hours),
  } as Designer;
}

const getDb = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  const data = JSON.parse(stored) as typeof INITIAL_DATA;
  data.designers = data.designers.map((d) => migrateDesigner(d as Record<string, unknown>));
  return data;
};

const saveDb = (data: typeof INITIAL_DATA) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const mockApi = {
  designers: {
    list: async (): Promise<Designer[]> => {
      await delay(400);
      return getDb().designers;
    },
    create: async (data: InsertDesigner): Promise<Designer> => {
      await delay(500);
      const db = getDb();
      const newDesigner: Designer = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
        attachedObjectsCount: 0,
        workingHoursFrom: Number(data.workingHoursFrom),
        workingHoursTo: Number(data.workingHoursTo),
      };
      db.designers.push(newDesigner);
      saveDb(db);
      return newDesigner;
    },
    update: async (id: string, data: Partial<InsertDesigner>): Promise<Designer> => {
      await delay(400);
      const db = getDb();
      const index = db.designers.findIndex((d) => d.id === id);
      if (index === -1) throw new Error("Designer not found");
      const updated = { ...db.designers[index], ...data };
      if (data.workingHoursFrom != null) updated.workingHoursFrom = Number(data.workingHoursFrom);
      if (data.workingHoursTo != null) updated.workingHoursTo = Number(data.workingHoursTo);
      db.designers[index] = updated;
      saveDb(db);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await delay(400);
      const db = getDb();
      db.designers = db.designers.filter((d) => d.id !== id);
      db.objects = db.objects.filter((o) => o.designerId !== id);
      saveDb(db);
    },
  },
  objects: {
    list: async (): Promise<AppObject[]> => {
      await delay(300);
      return getDb().objects;
    },
    create: async (data: InsertObject): Promise<AppObject> => {
      await delay(400);
      const db = getDb();
      const newObject: AppObject = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
        position: data.position ?? [0, 0, 0],
        shape: data.shape ?? "box",
      };
      db.objects.push(newObject);
      const di = db.designers.findIndex((d) => d.id === data.designerId);
      if (di !== -1) db.designers[di].attachedObjectsCount++;
      saveDb(db);
      return newObject;
    },
    update: async (id: string, data: Partial<InsertObject>): Promise<AppObject> => {
      await delay(300);
      const db = getDb();
      const index = db.objects.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Object not found");
      const oldDesignerId = db.objects[index].designerId;
      const updated = { ...db.objects[index], ...data };
      db.objects[index] = updated;
      if (data.designerId != null && data.designerId !== oldDesignerId) {
        const oldDi = db.designers.findIndex((d) => d.id === oldDesignerId);
        const newDi = db.designers.findIndex((d) => d.id === data.designerId);
        if (oldDi !== -1) db.designers[oldDi].attachedObjectsCount--;
        if (newDi !== -1) db.designers[newDi].attachedObjectsCount++;
      }
      saveDb(db);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      const db = getDb();
      const obj = db.objects.find((o) => o.id === id);
      if (obj) {
        const di = db.designers.findIndex((d) => d.id === obj.designerId);
        if (di !== -1) db.designers[di].attachedObjectsCount--;
      }
      db.objects = db.objects.filter((o) => o.id !== id);
      saveDb(db);
    },
  },
};
