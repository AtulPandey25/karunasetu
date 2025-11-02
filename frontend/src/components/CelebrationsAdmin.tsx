
import { ProductManager } from "./ProductManager";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState, useEffect } from "react";
import { celebrationsApi } from "../lib/celebrations-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem(props: { id: string; children: React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={props.className}>
      {props.children}
    </div>
  );
}

export function CelebrationsAdmin() {
  const qc = useQueryClient();
  const [token] = useState<string | null>(
    localStorage.getItem("adminToken")
  );
  const [orderedCelebrations, setOrderedCelebrations] = useState<any[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);

  const celebrationsQuery = useQuery({
    queryKey: ["celebrations"],
    queryFn: () => celebrationsApi.getAll(),
  });

  useEffect(() => {
    if (celebrationsQuery.data?.data?.celebrations) {
      setOrderedCelebrations(celebrationsQuery.data.data.celebrations);
    }
  }, [celebrationsQuery.data]);

  const reorderCelebrationsMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      celebrationsApi.reorder(orderedIds, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celebrations"] });
      setIsDragMode(false);
      alert("Celebrations order saved!");
    },
    onError: () => {
      alert("Failed to save celebrations order.");
    },
  });

  const createCelebrationMutation = useMutation({
    mutationFn: (data: FormData) => celebrationsApi.create(data, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celebrations"] });
      alert("Celebration added successfully!");
    },
    onError: (error) => {
      console.error("Error creating celebration:", error);
      alert(`Failed to add celebration: ${error.message}`);
    },
  });

  const handleCreateCelebration = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Log FormData contents for debugging
    const formDataObject: { [key: string]: any } = {};
    formData.forEach((value, key) => {
      formDataObject[key] = value;
    });
    console.log("FormData:", formDataObject);
    console.log("Token:", token);

    createCelebrationMutation.mutate(formData);
    e.currentTarget.reset();
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleCelebrationDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedCelebrations((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="mt-6 rounded-xl border p-6">
      <h2 className="font-semibold">Manage Celebrations</h2>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Add New Celebration</h3>
        <form onSubmit={handleCreateCelebration} className="space-y-4">
          <div>
            <label htmlFor="title">Title</label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <Textarea id="description" name="description" />
          </div>
          <div>
            <label htmlFor="image">Image</label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>
          <div className="flex items-center space-x-2">
            <Input id="isEvent" name="isEvent" type="checkbox" className="w-4 h-4" />
            <label htmlFor="isEvent">Mark as Event</label>
          </div>
          <Button type="submit" disabled={createCelebrationMutation.isPending}>
            {createCelebrationMutation.isPending ? "Adding..." : "Add Celebration"}
          </Button>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-medium mb-2">Existing Celebrations</h3>
          <Button
            onClick={() => {
              if (isDragMode) {
                const orderedIds = orderedCelebrations.map((c) => c._id!);
                reorderCelebrationsMutation.mutate(orderedIds);
              } else {
                setIsDragMode(true);
              }
            }}
            disabled={reorderCelebrationsMutation.isPending}
          >
            {isDragMode
              ? reorderCelebrationsMutation.isPending
                ? "Saving..."
                : "Save Order"
              : "Change Order"}
          </Button>
        </div>
        {isDragMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCelebrationDragEnd}
          >
            <SortableContext
              items={orderedCelebrations.map((c) => c._id!)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderedCelebrations.map((c: any) => (
                  <SortableItem key={c._id} id={c._id!} className={`${c.isEvent ? "col-span-full" : ""}`}>
                    <CelebrationCard celebration={c} />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {celebrationsQuery.isLoading && <p>Loading...</p>}
            {celebrationsQuery.data?.data?.celebrations &&
              celebrationsQuery.data.data.celebrations.map((c: any) => (
                <CelebrationCard key={c._id} celebration={c} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CelebrationCard({ celebration }: { celebration: { _id: string; title: string; description?: string; isEvent?: boolean; imageUrl?: string; } }) {
  const qc = useQueryClient();
  const [token] = useState<string | null>(
    localStorage.getItem("adminToken")
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingProducts, setIsManagingProducts] = useState(false);

  const deleteCelebrationMutation = useMutation({
    mutationFn: () => celebrationsApi.delete(celebration._id, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celebrations"] });
    },
  });

  return (
    <div className="">
      <Card className={`relative overflow-hidden transform transition-all duration-300 hover:scale-103 ${celebration.isEvent ? "bg-yellow-50 border-yellow-200" : ""}`}>
        <CardHeader className={`p-0`}>
          <img
            src={celebration.imageUrl}
            alt={celebration.title}
            className={`w-full h-32 object-cover`}
          />
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-xl font-semibold mb-2">{celebration.title}</CardTitle>
          <p className="text-gray-600">{celebration.description}</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsManagingProducts(!isManagingProducts)}>
              {isManagingProducts ? "Hide Products" : "Manage Products"}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCelebrationMutation.mutate()}
              disabled={deleteCelebrationMutation.isPending}
            >
              {deleteCelebrationMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
          {isEditing && (
            <EditCelebrationForm
              celebration={celebration}
              onFinished={() => setIsEditing(false)}
            />
          )}
          {isManagingProducts && <ProductManager celebration={celebration} />}
        </CardContent>
      </Card>
    </div>
  );
}

function EditCelebrationForm({ celebration, onFinished }: { celebration: any, onFinished: () => void }) {
  const qc = useQueryClient();
  const [token] = useState<string | null>(
    localStorage.getItem("adminToken")
  );

  const updateCelebrationMutation = useMutation({
    mutationFn: (data: FormData) =>
      celebrationsApi.update(celebration._id, data, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["celebrations"] });
      onFinished();
    },
  });

  const handleUpdateCelebration = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCelebrationMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleUpdateCelebration} className="space-y-4 mt-4">
      <div>
        <label htmlFor="title">Title</label>
        <Input id="title" name="title" defaultValue={celebration.title} required />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <Textarea
          id="description"
          name="description"
          defaultValue={celebration.description}
        />
      </div>
      <div>
        <label htmlFor="image">Image</label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>
      <div className="flex items-center space-x-2">
        <Input
          id="isEvent"
          name="isEvent"
          type="checkbox"
          defaultChecked={celebration.isEvent}
          className="w-4 h-4"
        />
        <label htmlFor="isEvent">Mark as Event</label>
      </div>
      <Button type="submit" disabled={updateCelebrationMutation.isPending}>
        {updateCelebrationMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
