import { motion } from "framer-motion";

export function KanikonnaFall() {
  return (
    <div className="petal-layer">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.span
          key={i}
          className="petal"
          initial={{ y: -40, x: (i % 12) * 8, opacity: 0.4 }}
          animate={{ y: "110vh", opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 8 + (i % 6), delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
