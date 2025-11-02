import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import CelebrationCard from "@/components/CelebrationCard";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const PublicCelebrationCard = ({ celebration }: { celebration: any }) => {
  const isEvent = celebration.isEvent;

  // Render the special animated card for featured events
  if (isEvent) {
    // The grid layout will handle the spanning for this card
    return <div className="celebration-card"><CelebrationCard celebration={celebration} /></div>;
  }

  // Render the default, simpler card for normal celebrations
  return (
    <div className="relative celebration-card">
      <Link to={`/celebration/${celebration._id}`} key={celebration._id} className="h-full block">
        <Card className="overflow-hidden transform transition-transform hover:scale-105 h-full flex flex-col">
          <CardHeader className="p-0">
            <img
              src={celebration.imageUrl}
              alt={celebration.title}
              className="w-full h-48 object-cover"
            />
          </CardHeader>
          <CardContent className="p-4 flex flex-col flex-grow">
            <CardTitle className="text-xl font-semibold mb-2">{celebration.title}</CardTitle>
            <p className="text-gray-600 text-sm">{celebration.description}</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};
const CelebrationPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["celebrations"],
    queryFn: () => apiClient.get("/celebrations"),
  });
  const celebrations = data?.data?.celebrations || [];
  const events = celebrations.filter((c: any) => c.isEvent);
  const nonEvents = celebrations.filter((c: any) => !c.isEvent);

  const sectionRef = useRef(null);

  useEffect(() => {
    if (isLoading || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Animate the main title
      gsap.from(".title-char", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.05,
        ease: "power3.out",
      });

      // Animate cards on scroll
      gsap.from(".celebration-card", {
        scrollTrigger: {
          trigger: ".grid",
          start: "top 80%",
        },
        autoAlpha: 0, // Fades in and sets visibility
        y: 60,
        rotationZ: -5,
        scale: 0.9,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Parallax background effect
      gsap.to(".stars, .twinkling", {
        y: "-20%",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // GSAP-powered pulsing stars
      gsap.to(".pulsing-star", {
        opacity: 0.2,
        scale: 0.5,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.3,
          from: "random",
          grid: "auto",
        },
        ease: "power1.inOut",
      });

      // Plane animation
      const planeTimeline = gsap.timeline({ repeat: -1, repeatDelay: 5 });
      planeTimeline.fromTo("#plane", 
        { x: "-20vw", y: "20vh", rotate: 0, scale: 0.8, opacity: 1 },
        { x: "120vw", y: "40vh", rotate: 15, scale: 1.2, duration: 12, ease: "sine.inOut" }
      ).to("#plane", {
        opacity: 0,
        duration: 1
      }, "-=1");

      // Comet animation
      gsap.to("#comet", {
        x: "120vw",
        y: "-20vh",
        ease: "power2.in",
        duration: 3,
        repeat: -1,
        repeatDelay: 10,
        delay: 5,
        onStart: () => gsap.set("#comet", { x: "-20vw", y: "random(20, 80)vh" }),
      });

      // Light sweep animation
      gsap.fromTo(".light-sweep", {
        x: "-100%",
        y: "-50%",
      }, {
        x: "100%",
        y: "50%",
        duration: 15,
        repeat: -1,
        ease: "sine.inOut",
        yoyo: true,
      });
    }, sectionRef);

    return () => ctx.revert(); // Cleanup GSAP animations on unmount
  }, [isLoading]);

  return (
    <section ref={sectionRef} className="w-full bg-gray-900 py-8 lg:py-12 relative overflow-hidden min-h-screen isolate">
      <div className="absolute inset-0 z-[-1] firework-background">
        <div className="stars"></div>
        <div className="twinkling"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="nebula"></div>
        <div className="nebula"></div>
        {/* New Plane SVG */}
        <svg id="plane" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="absolute w-20 h-20 text-white" style={{ filter: 'drop-shadow(0 0 10px white)' }}>
          <path fill="currentColor" d="M448 336v-40a8 8 0 0 0-12.2-6.2L320 333.5V192l80-48v-32l-80-48V16a16 16 0 0 0-16-16h-32a16 16 0 0 0-16 16v48l-80 48v32l80 48v141.5L172.2 289.8a8 8 0 0 0-12.2 6.2v40a8 8 0 0 0 4.9 7.4l103.1 39.8v58.6a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-58.6l103.1-39.8a8 8 0 0 0 4.9-7.4z"/>
        </svg>
        {/* New Pulsing Stars */}
        <div className="absolute inset-0">
          <div className="pulsing-star" style={{ top: '15%', left: '10%' }}></div>
          <div className="pulsing-star" style={{ top: '25%', left: '80%' }}></div>
          <div className="pulsing-star" style={{ top: '60%', left: '5%' }}></div>
          <div className="pulsing-star" style={{ top: '75%', left: '60%' }}></div>
          <div className="pulsing-star" style={{ top: '90%', left: '30%' }}></div>
        </div>
        <div id="comet" className="absolute top-1/2 -left-40 h-1 w-40 rounded-full bg-gradient-to-r from-white/0 to-white shadow-[0_0_10px_3px_#fff]"></div>
        <div className="light-sweep"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-center mb-8 md:mb-12 text-white">
          {"Our Celebrations".split("").map((char, index) => (
            <span key={index} className="title-char inline-block" style={{ whiteSpace: 'pre' }}>
              {char}
            </span>
          ))}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Render featured events first, making them span the full width */}
          {events.map((event: any) => (
            <div key={event._id} className="md:col-span-2 lg:col-span-3">
              <PublicCelebrationCard celebration={event} />
            </div>
          ))}
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
          {/* Render normal celebrations */}
          {nonEvents.map((celebration: any) => (
            <PublicCelebrationCard key={celebration._id} celebration={celebration} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CelebrationPage;