import GetStartedContainer from "@/components/landing-page/getStartedContainer";
import { motion } from "framer-motion";

const GetStarted = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} // Starting state (off-screen/invisible)
      animate={{ opacity: 1, y: 0 }} // Ending state (visible/on-screen)
      transition={{ duration: 0.5, delay: 0.3 }} // Speed and timing
    >
      <GetStartedContainer />
    </motion.div>
  );
};

export default GetStarted;
