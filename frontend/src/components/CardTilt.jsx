import { useEffect } from 'react';

export default function CardTilt() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    let activeEl = null;

    const reset = (el) => {
      el.style.transform = '';
    };

    const handleMove = (e) => {
      const card = e.target.closest?.('.glossy-card');

      if (card !== activeEl) {
        if (activeEl) reset(activeEl);
        activeEl = card || null;
      }
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
    };

    const handleWindowLeave = () => {
      if (activeEl) {
        reset(activeEl);
        activeEl = null;
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleWindowLeave);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleWindowLeave);
    };
  }, []);

  return null;
}
