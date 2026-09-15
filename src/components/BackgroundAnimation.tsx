import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundAnimationProps {
  reducedMotion?: boolean;
}

export const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({
  reducedMotion = false,
}) => {
  if (reducedMotion) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none overflow-hidden"
style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 20%, rgba(180, 83, 9, 0.15) 0%, transparent 50%)," +
            " radial-gradient(ellipse 60% 40% at 80% 80%, rgba(146, 48, 12, 0.1) 0%, transparent 50%)," +
            " radial-gradient(ellipse 50% 30% at 50% 50%, rgba(179, 141, 81, 0.08) 0%, transparent 70%)",
        }}
    >
      <motion.ellipse
        cx={200}
        cy={200}
        rx={300}
        ry={200}
        fill="none"
        stroke="var(--color-accent)"
        stroke-width={1}
        strokeOpacity={0.3}
        style={{
          animation: 'bg-glow 20s ease-in-out infinite',
        }}
      />
      <motion.ellipse
        cx={800}
        cy={400}
        rx={250}
        ry={150}
        fill="none"
        stroke="var(--color-accent)"
        stroke-width={0.5}
        strokeOpacity={0.2}
        style={{
          animation: 'bg-glow 25s ease-in-out infinite reverse',
          delay: '2s',
        }}
      />
      <motion.ellipse
        cx={400}
        cy={600}
        rx={200}
        ry={100}
        fill="none"
        stroke="var(--color-accent)"
        stroke-width={0.8}
        strokeOpacity={0.25}
        style={{
          animation: 'bg-glow 18s ease-in-out infinite',
          direction: 'alternate',
        }}
      />
    </motion.div>
  );
};