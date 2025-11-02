import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { celebrationsApi } from "../lib/celebrations-api";
import { Celebration } from "../types";

export default function AdminCelebrations() {
  const queryClient = useQueryClient();
  const [selectedCelebration, setSelectedCelebration] =
    useState<Celebration | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isEvent: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: celebrations, isLoading } = useQuery<Celebration[]>({
    queryKey: ["celebrations"],
    queryFn: () =>
      celebrationsApi.getAll().then((res) => res.data.celebrations),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => celebrationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["celebrations"] });
      queryClient.invalidateQueries({ queryKey: ["currentEvent"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      celebrationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["celebrations"] });
      queryClient.invalidateQueries({ queryKey: ["currentEvent"] });
      resetForm();
    },
  });

  useEffect(() => {
    if (selectedCelebration) {
      setFormData({
        title: selectedCelebration.title,
        description: selectedCelebration.description,
        isEvent: selectedCelebration.isEvent,
      });
      setImageFile(null);
    } else {
      resetForm();
    }
  }, [selectedCelebration]);

  const resetForm = () => {
    setSelectedCelebration(null);
    setFormData({ title: "", description: "", isEvent: false });
    setImageFile(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("isEvent", String(formData.isEvent));
    if (imageFile) {
      data.append("image", imageFile);
    }

    if (selectedCelebration) {
      updateMutation.mutate({ id: selectedCelebration._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Celebrations</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 p-4 border rounded shadow-md bg-white"
      >
        <h2 className="text-xl mb-2">
          {selectedCelebration ? "Edit Celebration" : "Add New Celebration"}
        </h2>
        <div className="mb-4">
          <label className="block mb-1">Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full p-2 border rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded" required></textarea>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Image</label>
          <input type="file" name="image" onChange={handleFileChange} className="w-full" />
          {selectedCelebration?.imageUrl && !imageFile && (
            <img src={selectedCelebration.imageUrl} alt={selectedCelebration.title} className="w-32 h-32 mt-2 object-cover" />
          )}
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input type="checkbox" name="isEvent" checked={formData.isEvent} onChange={handleCheckboxChange} className="mr-2" />
            Mark as current event (for main banner)
          </label>
        </div>
        <div className="flex gap-4">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" disabled={createMutation.isPending || updateMutation.isPending}>
            {selectedCelebration ? "Update" : "Create"}
          </button>
          {selectedCelebration && (<button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel Edit</button>)}
        </div>
      </form>

      <div>
        <h2 className="text-xl mb-2">Existing Celebrations</h2>
        {isLoading ? (<p>Loading...</p>) : (
          <ul className="space-y-2">
            {celebrations?.map((c: Celebration) => (
              <li key={c._id} className="p-2 border rounded flex justify-between items-center bg-gray-50">
                <span>{c.title} {c.isEvent && <span className="font-bold text-green-600">(Current Event)</span>}</span>
                <button onClick={() => setSelectedCelebration(c)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Edit</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}