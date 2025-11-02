import { useQuery } from "@tanstack/react-query";
import { celebrationsApi } from "../lib/celebrations-api";
import { Celebration } from "../types";
import { Link } from "react-router-dom";

export default function EventBanner() {
  const {
    data: event,
    isLoading,
    error,
  } = useQuery<Celebration | null>({
    queryKey: ["currentEvent"],
    queryFn: async () => {
      const res = await celebrationsApi.getAll("isEvent=true&limit=1");
      return res.data.celebrations[0] || null;
    },
    staleTime: 0,
  });

  if (isLoading) {
    return <section id="event-banner" className="w-full bg-gray-900 py-8 lg:py-12"><div className="text-center text-white">Loading Event...</div></section>;
  }

  if (error || !event) {
    // You can decide to show nothing or a fallback message if there's an error or no event
    return null;
  }

  return (
    <section id="event-banner" className="w-full py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to={`/celebration/${event._id}`} className="block relative group">
          <div className="relative p-6 lg:p-10 rounded-2xl border-2 border-transparent event-card-frame transition-all duration-500 hover:scale-[1.005] overflow-hidden h-full flex flex-col justify-center min-h-[300px]">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
              <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors duration-300"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-2 uppercase tracking-wide title-shimmer">
                {event.title}
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl description-breathe mb-4 px-4">
                {event.description}
              </p>

              <div className="mt-4 px-6 py-2 text-sm sm:text-base bg-yellow-500 text-gray-900 font-bold rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:bg-yellow-400">
                View Details
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}