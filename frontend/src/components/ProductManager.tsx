
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState, useEffect } from "react";
import { celebrationsApi } from "../lib/celebrations-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/types/api";
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

function SortableItem(props: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  );
}

export function ProductManager({ celebration }: { celebration: any }) {
  const qc = useQueryClient();
  const [token] = useState<string | null>(
    localStorage.getItem("adminToken")
  );
  const [isAdding, setIsAdding] = useState(false);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products", celebration._id],
    queryFn: () => celebrationsApi.getProducts(celebration._id),
  });

  useEffect(() => {
    if (productsQuery.data?.data?.products) {
      setOrderedProducts(productsQuery.data.data.products);
    }
  }, [productsQuery.data]);

  const reorderProductsMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      celebrationsApi.reorderProducts(orderedIds, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", celebration._id] });
      setIsDragMode(false);
      alert("Products order saved!");
    },
    onError: () => {
      alert("Failed to save products order.");
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: FormData) =>
            celebrationsApi.createProduct(data, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", celebration._id] });
      setIsAdding(false);
      alert("Product added successfully!");
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      alert(`Failed to add product: ${error.message}`);
    },
  });

  const handleCreateProduct = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("celebrationId", celebration._id);
    createProductMutation.mutate(formData);
    e.currentTarget.reset();
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleProductDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedProducts((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Manage Products for {celebration.title}</h3>
              <div className="flex gap-2">
                <Button onClick={() => setIsAdding(!isAdding)}>
                  {isAdding ? "Cancel" : "Add New Product"}
                </Button>
                <Button
                  onClick={() => {
                    if (isDragMode) {
                      const orderedIds = orderedProducts.map((p) => p._id!);
                      reorderProductsMutation.mutate(orderedIds);
                    } else {
                      setIsDragMode(true);
                    }
                  }}
                  disabled={reorderProductsMutation.isPending}
                >
                  {isDragMode
                    ? reorderProductsMutation.isPending
                      ? "Saving..."
                      : "Save Order"
                    : "Change Order"}
                </Button>
              </div>
            </div>
    
          {isAdding && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <label htmlFor="name">Product Name</label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <label htmlFor="description">Description</label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div>
                    <label htmlFor="price">Price</label>
                    <Input id="price" name="price" type="number" step="0.01" required />
                  </div>
                  <div>
                    <label htmlFor="image">Image</label>
                    <Input id="image" name="image" type="file" accept="image/*" />
                  </div>
                  <Button type="submit" disabled={createProductMutation.isPending}>
                    {createProductMutation.isPending ? "Adding..." : "Add Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
    
          {isDragMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleProductDragEnd}
            >
              <SortableContext
                items={orderedProducts.map((p) => p._id!)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderedProducts.map((p: Product) => (
                    <SortableItem key={p._id} id={p._id!}>
                      <ProductCard product={p} />
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productsQuery.isLoading && <p>Loading products...</p>}
              {productsQuery.data?.data?.products &&
                productsQuery.data.data.products.map((p: Product) => (
                  <ProductCard key={p._id} product={p} />
                ))}
            </div>
          )}
        </div>  );
}

function ProductCard({ product }: { product: Product }) {
  const qc = useQueryClient();
  const [token] = useState<string | null>(
    localStorage.getItem("adminToken")
  );
  const [isEditing, setIsEditing] = useState(false);

  const deleteProductMutation = useMutation({
    mutationFn: () => celebrationsApi.deleteProduct(product._id, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", product.celebrationId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-32 object-cover"
        />
      </CardHeader>
      <CardContent>
        <CardTitle>{product.name}</CardTitle>
        <p className="text-gray-700 font-bold">${product.price.toFixed(2)}</p>
        <p>{product.description}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteProductMutation.mutate()}
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
        {isEditing && (
          <EditProductForm
            product={product}
            onFinished={() => setIsEditing(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EditProductForm({ product, onFinished }: { product: Product, onFinished: () => void }) {
  const qc = useQueryClient();
  const [token] = useState<string | null>(
    localStorage.getItem("adminToken")
  );

  const updateProductMutation = useMutation({
    mutationFn: (data: FormData) =>
      celebrationsApi.updateProduct(product._id, data, token || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", product.celebrationId] });
      onFinished();
    },
  });

  const handleUpdateProduct = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateProductMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleUpdateProduct} className="space-y-4 mt-4">
      <div>
        <label htmlFor="name">Product Name</label>
        <Input id="name" name="name" defaultValue={product.name} required />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product.description}
        />
      </div>
      <div>
        <label htmlFor="price">Price</label>
        <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} required />
      </div>
      <div>
        <label htmlFor="image">Image</label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>
      <Button type="submit" disabled={updateProductMutation.isPending}>
        {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
