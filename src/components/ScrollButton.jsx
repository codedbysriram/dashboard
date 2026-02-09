import React, { useState, useEffect } from "react";
import "../styles/ScrollButton.css";

export default function ScrollButton() {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 10;

      setAtBottom(isBottom);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <button className="scroll-btn" onClick={handleClick}>
      {atBottom ? "⬆ Top" : "⬇ Bottom"}
    </button>
  );
}
