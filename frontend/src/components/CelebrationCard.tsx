import { Celebration } from "../types";
import { Link } from "react-router-dom";

interface CelebrationCardProps {
  celebration: Celebration;
}

export default function CelebrationCard({ celebration }: CelebrationCardProps) {
  return (
    <Link to={`/celebration/${celebration._id}`} className="block relative group">
      <div className="relative p-6 lg:p-10 rounded-2xl border-2 border-transparent event-card-frame transition-all duration-500 hover:scale-[1.005] overflow-hidden h-full flex flex-col justify-center">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={celebration.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors duration-300"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2 uppercase tracking-wide title-shimmer">
            {celebration.title}
          </h1>

          <p className="text-lg sm:text-xl lg:text-xl text-gray-300 max-w-3xl description-breathe mb-4">
            {celebration.description}
          </p>

          <div className="mt-4 px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:bg-yellow-400">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}