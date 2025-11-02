import { useQuery } from "@tanstack/react-query";
import { celebrationsApi } from "../lib/celebrations-api";
import { Celebration } from "../types";
import CelebrationCard from "../components/CelebrationCard";

export default function Celebrations() {
  const { data: celebrations, isLoading, error } = useQuery<Celebration[]>({
    queryKey: ["celebrations"],
    queryFn: async () => {
      const res = await celebrationsApi.getAll();
      return res.data.celebrations || [];
    }
  }); 

  return (
    <section className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl lg:text-6xl font-extrabold text-center mb-8">
          Our Celebrations
        </h1>
        {isLoading ? (
          <div className="text-center text-white text-xl">Loading Celebrations...</div>
        ) : error ? (
          <div className="text-center text-red-400 text-xl">Failed to load celebrations. Please try again later.</div>
        ) : celebrations && celebrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {celebrations.map((celebration) => (
              <CelebrationCard key={celebration._id} celebration={celebration} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-xl">No celebrations have been added yet.</div>
        )}
      </div>
    </section>
  );
}