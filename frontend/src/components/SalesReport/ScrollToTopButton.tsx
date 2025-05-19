import React, { useState, useEffect } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

const ScrollButton = () => {
  const scrollStep = 100; // Scroll 100px per click
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const [isHovered, setIsHovered] = useState(false);

  // Function to scroll step-by-step
  const handleScroll = () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const targetScroll = scrollDirection === "up" ? currentScroll - scrollStep : currentScroll + scrollStep;

    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  // Detect if at top or bottom to toggle direction
  useEffect(() => {
    const checkScrollPosition = () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
        setScrollDirection("up"); // Switch to up when at bottom
      } else if (window.scrollY <= 0) {
        setScrollDirection("down"); // Switch to down when at top
      }
    };

    window.addEventListener("scroll", checkScrollPosition);
    return () => window.removeEventListener("scroll", checkScrollPosition);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-center">
      {/* Tooltip */}
      <div
        className={`absolute -top-7 px-2 py-1 bg-gray-800 text-white text-[10px] rounded-md shadow-lg 
                    transition-all duration-300 ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        {scrollDirection === "down" ? "Bottom" : "Top"}
      </div>

      {/* Scroll Button */}
      <button
        onClick={handleScroll}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors 
                   before:absolute before:inset-0 before:m-auto before:w-full before:h-full before:rounded-full 
                   before:border-4 before:border-blue-300 before:opacity-50 before:animate-ping"
      >
        {scrollDirection === "down" ? (
          <ArrowDownIcon className="h-4 w-4" />
        ) : (
          <ArrowUpIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export default ScrollButton;
