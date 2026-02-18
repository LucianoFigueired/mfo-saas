"use client";

import { motion } from "framer-motion";

export function ThinkingLoader() {
  const text = "Analisando...";

  const letterVariants = {
    initial: { opacity: 0.2 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="flex items-center justify-center space-x-1 py-0">
      <motion.div
        className="flex text-sm text-primary-400 font-bold tracking-widest uppercase"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {text.split("").map((char, index) => (
          <motion.span key={index} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
