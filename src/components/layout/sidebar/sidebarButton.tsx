import { Button } from "@/components/ui/button";
import { ChevronsLeftRight } from "lucide-react";

type SidebarButtonProps = {
  sidebarState: string;
  toggleSidebar: () => void;
};

const SidebarButton = ({ toggleSidebar }: SidebarButtonProps) => {
  return (
    <>
      <Button
        onClick={toggleSidebar}
        className="
          cursor-pointer
          bg-blue-500 hover:bg-indigo-500 transition-all
          rounded-full h-6 w-6 p-0 min-w-0
          absolute
          top-1/2 -translate-y-1/2
          left-full -translate-x-1/2
          z-40
          flex items-center justify-center
        "
      >
        <ChevronsLeftRight size={14} />
      </Button>
    </>
  );
};

export default SidebarButton;
