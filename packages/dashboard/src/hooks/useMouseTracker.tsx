// hook for tracking if user is moving the mouse
import React from 'react';

const useMouseTracker = () => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  // const [isMouseMoving, setIsMouseMoving] = React.useState(true);
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      setMousePosition({ x, y });
      // setIsMouseMoving(true);
    };
    const resetMouseMoving = () => {
      // setIsMouseMoving(false);
    };
    // const mouseMoveListener = window.addEventListener("mousemove", handleMouseMove);

    // const timer = setInterval(resetMouseMoving, 10000);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);

      // clearInterval(timer);
    };
  }, []);

  return {
    mousePosition,
  };
};

export default useMouseTracker;
