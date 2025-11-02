import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateDonorResponse,
  Donor,
  GetDonorsResponse,
  Member,
  GetMembersResponse,
} from "../types/api";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
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
import { CelebrationsAdmin } from "@/components/CelebrationsAdmin";

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

export default function Admin() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("adminToken"),
  );
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"images" | "donors" | "members" | "celebrations">(
    "images",
  );
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [donorLogo, setDonorLogo] = useState<File | null>(null);
  const [memberPhoto, setMemberPhoto] = useState<File | null>(null);
  const qc = useQueryClient();

  // DND state
  const [orderedDonors, setOrderedDonors] = useState<Donor[]>([]);
  const [orderedMembers, setOrderedMembers] = useState<Member[]>([]);
  const [isDonorsOrderChanged, setIsDonorsOrderChanged] = useState(false);
  const [isMembersOrderChanged, setIsMembersOrderChanged] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);

  const donorsQuery = useQuery<GetDonorsResponse>({
    queryKey: ["donors"],
    queryFn: async () => apiClient.get("/donors").then(res => res.data || { donors: [] }),
  });
  const membersQuery = useQuery<GetMembersResponse>({
    queryKey: ["members"],
    queryFn: async () => apiClient.get("/members").then(res => res.data || { members: [] }),
  });

  useEffect(() => {
    if (donorsQuery.data?.donors) {
      setOrderedDonors(donorsQuery.data.donors);
    }
  }, [donorsQuery.data]);

  useEffect(() => {
    if (membersQuery.data?.members) {
      setOrderedMembers(membersQuery.data.members);
    }
  }, [membersQuery.data]);

  useEffect(() => {
    if (token) localStorage.setItem("adminToken", token);
    else localStorage.removeItem("adminToken");
  }, [token]);

  function isMutating(m: any) {
    return !!(
      m &&
      ((m as any).isLoading ??
        (m as any).isPending ??
        (m as any).state?.status === "loading")
    );
  }

  const handleUnauthorized = (res: Response) => {
    if (res.status === 401) {
      setToken(null);
      alert("Session expired. Please log in again.");
    }
  };

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { authApi } = await import("@/lib/api-client");
      const result = await authApi.login(email, password);
      if (!result.ok) throw new Error(result.error || "Login failed");
      return result.data;
    },
    onSuccess: (data) => {
      setToken(data!.token);
      alert("Logged in");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!files || files.length === 0) throw new Error("No files");
      const { galleryApi } = await import("@/lib/api-client");
      const result = await galleryApi.upload(files, title || "Donation", token || "");
      if (!result.ok) {
        if (result.status === 401) handleUnauthorized(new Response());
        throw new Error(result.error || "Upload failed");
      }
      return result.data;
    },
    onSuccess: () => {
      setTitle("");
      setFiles(null);
      const input = document.getElementById(
        "multi-images",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      qc.invalidateQueries({ queryKey: ["gallery"] });
      alert("Images uploaded");
    },
  });

  const galleryQuery = useQuery<{
    images: { _id?: string; title: string; url: string; featured?: boolean }[];
  }>({
    queryKey: ["gallery"],
    queryFn: async () => apiClient.get("/gallery").then(res => res.data || { images: [] }),
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { galleryApi } = await import("@/lib/api-client");
      const result = await galleryApi.delete(id, token || "");
      if (!result.ok) {
        if (result.status === 401) handleUnauthorized(new Response());
        throw new Error(result.error || "Failed");
      }
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-hero"] });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { galleryApi } = await import("@/lib/api-client");
      const result = await galleryApi.toggleFeatured(id, featured, token || "");
      if (!result.ok) {
        if (result.status === 401) handleUnauthorized(new Response());
        throw new Error(result.error || "Failed");
      }
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery-hero"] });
    },
  });

  const addDonorMutation = useMutation({
    mutationFn: async (d: {
      name: string;
      tier: Donor["tier"];
      website?: string;
      donatedAmount?: number;
      donatedCommodity?: string;
    }) => {
      const { donorsApi } = await import("@/lib/api-client");
      const result = await donorsApi.create(d, donorLogo, token || "");
      if (!result.ok) {
        if (result.status === 401) handleUnauthorized(new Response());
        throw new Error(result.error || "Failed");
      }
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donors"] });
      setDonorLogo(null);
      const input = document.getElementById("donor-logo") as HTMLInputElement | null;
      if (input) input.value = "";
    },
  });

  const deleteDonorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { donorsApi } = await import("@/lib/api-client");
      const result = await donorsApi.delete(id, token || "");
      if (!result.ok) {
        if (result.status === 401) handleUnauthorized(new Response());
        throw new Error(result.error || "Failed");
      }
      return result.data;
    },
    onSuccess: () => {
      alert("Donor deleted successfully");
    },
    onError: (error) => {
      alert(`Failed to delete donor: ${error.message}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });

  const addMemberMutation = useMutation({
    mutationFn: async (m: {
      name: string;
      role: string;
      bio?: string;
      instaId?: string;
      email?: string;
      contact?: string;
    }) => {
      const { membersApi } = await import("@/lib/api-client");
      const result = await membersApi.create(m, memberPhoto, token || "");
      if (!result.ok) {
        if (result.status === 401) handleUnauthorized(new Response());
        throw new Error(result.error || "Failed");
      }
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      const input = document.getElementById("member-photo") as HTMLInputElement | null;
      if (input) input.value = "";
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { membersApi } = await import("@/lib/api-client");
      const result = await membersApi.delete(id, token || "");
      if (!result.ok) {
        if (result.status === 401) handleUnauthorized(new Response());
        throw new Error(result.error || "Failed");
      }
      return result.data;
    },
    onSuccess: () => {
      alert("Member deleted successfully");
    },
    onError: (error) => {
      alert(`Failed to delete member: ${error.message}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  const reorderDonorsMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { donorsApi } = await import("@/lib/api-client");
      const result = await donorsApi.reorder(orderedIds, token || "");
      if (!result.ok) throw new Error(result.error || "Failed to reorder donors");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donors"] });
      setIsDonorsOrderChanged(false);
      setIsDragMode(false);
      alert("Donors order saved!");
    },
    onError: () => {
      alert("Failed to save donors order.");
    },
  });

  const reorderMembersMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { membersApi } = await import("@/lib/api-client");
      const result = await membersApi.reorder(orderedIds, token || "");
      if (!result.ok) throw new Error(result.error || "Failed to reorder members");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setIsMembersOrderChanged(false);
      setIsDragMode(false);
      alert("Members order saved!");
    },
    onError: () => {
      alert("Failed to save members order.");
    },
  });

  function onAddDonor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    addDonorMutation.mutate({
      name: String(formData.get("name") || "").trim(),
      tier: (String(formData.get("tier") || "Gold") as Donor["tier"]) || "Gold",
      website: String(formData.get("website") || "").trim() || undefined,
      donatedAmount: formData.get("donatedAmount")
        ? Number(formData.get("donatedAmount"))
        : undefined,
      donatedCommodity:
        String(formData.get("donatedCommodity") || "").trim() || undefined,
    });
    form.reset();
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDonorDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedDonors((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        setIsDonorsOrderChanged(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleMemberDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedMembers((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        setIsMembersOrderChanged(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  if (!token) {
    return (
      <section className="container py-12 md:py-16">
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <p className="text-muted-foreground mt-2">
          Sign in with your admin credentials.
        </p>
        <div className="mt-6 w-full max-w-md">
          <input
            className="w-full rounded-md border px-3 py-2 mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-3 py-2 mb-3"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => loginMutation.mutate()}
              disabled={isMutating(loginMutation)}
            >
              Login
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12 md:py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div>
          <button
            className="mr-3 rounded-md border px-3 py-2"
            onClick={() => {
              setToken(null);
              alert("Logged out");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded ${activeTab === "images" ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setActiveTab("images")}
          >
            Image Uploads
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "donors" ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setActiveTab("donors")}
          >
            Donors
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "members" ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setActiveTab("members")}
          >
            Members
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "celebrations" ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setActiveTab("celebrations")}
          >
            Celebrations
          </button>
        </div>

        {activeTab === "images" && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="font-semibold">Upload Images</h2>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                placeholder="Title for all images (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
              <input
                id="multi-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
              <div className="flex gap-3 mt-2">
                <button
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow"
                  onClick={() => uploadMutation.mutate()}
                  disabled={
                    !files || files.length === 0 || isMutating(uploadMutation)
                  }
                >
                  {isMutating(uploadMutation)
                    ? "Uploading..."
                    : "Upload Images"}
                </button>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-3">Gallery Images</h3>
                {galleryQuery.data?.images?.length === 0 && (
                  <div className="text-muted-foreground">No images yet.</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(galleryQuery.data?.images || []).map((img) => (
                    <div
                      key={img._id || img.url}
                      className="rounded overflow-hidden border"
                    >
                      <img
                        src={img.url}
                        className="w-full h-40 object-cover"
                        alt={img.title}
                      />
                      <div className="p-2 flex items-center justify-between">
                        <div className="text-sm">{img.title}</div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={Boolean(img.featured)}
                              onChange={(e) =>
                                img._id &&
                                toggleFeaturedMutation.mutate({
                                  id: img._id,
                                  featured: e.currentTarget.checked,
                                })
                              }
                            />
                            Feature on Home
                          </label>
                          <button
                            className="text-sm text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              img._id && deleteGalleryMutation.mutate(img._id)
                            }}
                            disabled={isMutating(deleteGalleryMutation)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "donors" && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="font-semibold">Add Donor</h2>
            <form className="mt-4 grid gap-3" onSubmit={onAddDonor}>
              <input name="name" placeholder="Name" className="w-full rounded-md border px-3 py-2" required />
              <select name="tier" defaultValue="Bronze" className="w-full rounded-md border px-3 py-2">
                <option>Bronze</option>
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
              </select>
              <input name="website" placeholder="Website URL" className="w-full rounded-md border px-3 py-2" />
              <input name="donatedAmount" type="number" placeholder="Donated Amount" className="w-full rounded-md border px-3 py-2" />
              <input name="donatedCommodity" placeholder="Donated Commodity" className="w-full rounded-md border px-3 py-2" />
              <input id="donor-logo" type="file" accept="image/*" onChange={e => setDonorLogo(e.target.files ? e.target.files[0] : null)} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow disabled:opacity-50"
                disabled={isMutating(addDonorMutation)}
              >
                {isMutating(addDonorMutation) ? "Adding..." : "Add Donor"}
              </button>
            </form>

            <div className="flex items-center justify-between mt-6">
              <h2 className="font-semibold">Existing Donors</h2>
              <button
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow disabled:opacity-50"
                onClick={() => {
                  if (isDragMode) {
                    const orderedIds = orderedDonors.map((d) => d._id!);
                    reorderDonorsMutation.mutate(orderedIds);
                  } else {
                    setIsDragMode(true);
                  }
                }}
                disabled={isMutating(reorderDonorsMutation)}
              >
                {isDragMode ? (isMutating(reorderDonorsMutation) ? "Saving..." : "Save Order") : "Change Order"}
              </button>
            </div>
            {isDragMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDonorDragEnd}
              >
                <SortableContext
                  items={orderedDonors.map((d) => d._id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-4 divide-y border rounded-lg">
                    {orderedDonors.map((d) => (
                      <SortableItem key={d._id} id={d._id!}>
                        <div className="flex items-center justify-between p-3">
                          <div>
                            <div className="font-medium">{d.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {d.tier}{" "}
                              {d.donatedAmount ? `• ₹${d.donatedAmount}` : ""}{" "}
                              {d.donatedCommodity
                                ? `• ${d.donatedCommodity}`
                                : ""}
                            </div>
                          </div>
                          {d.logoUrl && (
                            <img
                              src={d.logoUrl}
                              className="h-10 w-10 object-cover rounded-full"
                            />
                          )}
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="mt-4 divide-y border rounded-lg">
                {orderedDonors.map((d) => (
                  <div key={d._id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.tier}{" "}
                        {d.donatedAmount ? `• ₹${d.donatedAmount}` : ""}{" "}
                        {d.donatedCommodity
                          ? `• ${d.donatedCommodity}`
                          : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.logoUrl && (
                        <img
                          src={d.logoUrl}
                          className="h-10 w-10 object-cover rounded-full"
                        />
                      )}
                      <button
                        className="text-sm text-destructive hover:underline"
                        onClick={() => {
                          d._id && deleteDonorMutation.mutate(d._id)
                        }}
                        disabled={isMutating(deleteDonorMutation)}
                      >
                        {isMutating(deleteDonorMutation) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="font-semibold">Add Member</h2>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                addMemberMutation.mutate({
                  name: String(fd.get("name") || "").trim(),
                  role: String(fd.get("role") || ""),
                  bio: String(fd.get("bio") || ""),
                  instaId:
                    String(fd.get("instaId") || "").trim() || undefined,
                  email: String(fd.get("email") || "").trim() || undefined,
                  contact:
                    String(fd.get("contact") || "").trim() || undefined,
                });
                form.reset();
              }}
            >
              <input name="name" placeholder="Name" className="w-full rounded-md border px-3 py-2" required />
              <input name="role" placeholder="Role" className="w-full rounded-md border px-3 py-2" />
              <input name="bio" placeholder="Bio" className="w-full rounded-md border px-3 py-2" />
              <input name="instaId" placeholder="Instagram ID" className="w-full rounded-md border px-3 py-2" />
              <input name="email" placeholder="Email" className="w-full rounded-md border px-3 py-2" />
              <input name="contact" placeholder="Contact" className="w-full rounded-md border px-3 py-2" />
              <input id="member-photo" type="file" accept="image/*" onChange={e => setMemberPhoto(e.target.files ? e.target.files[0] : null)} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow disabled:opacity-50"
                disabled={isMutating(addMemberMutation)}
              >
                {isMutating(addMemberMutation) ? "Adding..." : "Add Member"}
              </button>
            </form>

            <div className="flex items-center justify-between mt-6">
              <h2 className="font-semibold">Existing Members</h2>
              <button
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow disabled:opacity-50"
                onClick={() => {
                  if (isDragMode) {
                    const orderedIds = orderedMembers.map((m) => m._id!);
                    reorderMembersMutation.mutate(orderedIds);
                  } else {
                    setIsDragMode(true);
                  }
                }}
                disabled={isMutating(reorderMembersMutation)}
              >
                {isDragMode ? (isMutating(reorderMembersMutation) ? "Saving..." : "Save Order") : "Change Order"}
              </button>
            </div>
            {isDragMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleMemberDragEnd}
              >
                <SortableContext
                  items={orderedMembers.map((m) => m._id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-4 divide-y border rounded-lg">
                    {orderedMembers.map((m) => (
                      <SortableItem key={m._id} id={m._id!}>
                        <div className="flex items-center justify-between p-3">
                          <div>
                            <div className="font-medium">
                              {m.name}{" "}
                              <span className="text-xs text-muted-foreground">
                                • {m.role}
                              </span>
                            </div>
                            {m.bio && (
                              <div className="text-xs text-muted-foreground">
                                {m.bio}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {m.instaId ? `@${m.instaId}` : ""}{" "}
                              {m.email ? `• ${m.email}` : ""}{" "}
                              {m.contact ? `• ${m.contact}` : ""}
                            </div>
                          </div>
                          {m.photoUrl && (
                            <img
                              src={m.photoUrl}
                              className="h-10 w-10 object-cover rounded-full"
                            />
                          )}
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="mt-4 divide-y border rounded-lg">
                {orderedMembers.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">
                        {m.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          • {m.role}
                        </span>
                      </div>
                      {m.bio && (
                        <div className="text-xs text-muted-foreground">
                          {m.bio}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {m.instaId ? `@${m.instaId}` : ""}{" "}
                        {m.email ? `• ${m.email}` : ""}{" "}
                        {m.contact ? `• ${m.contact}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.photoUrl && (
                        <img
                          src={m.photoUrl}
                          className="h-10 w-10 object-cover rounded-full"
                        />
                      )}
                      <button
                        className="text-sm text-destructive hover:underline"
                        onClick={() => {
                          m._id && deleteMemberMutation.mutate(m._id)
                        }}
                        disabled={isMutating(deleteMemberMutation)}
                      >
                        {isMutating(deleteMemberMutation) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "celebrations" && <CelebrationsAdmin />}
      </div>
    </section>
  );
}
