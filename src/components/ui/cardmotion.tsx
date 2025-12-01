import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
  hover: { scale: 1.03 },
};

export default function CardMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover="hover"
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl p-4 bg-white shadow-md"
    >
      {children}
    </motion.div>
  );
}
