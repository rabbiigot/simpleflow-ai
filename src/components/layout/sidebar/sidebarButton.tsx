import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SidebarButtonProps = {
  sidebarState: string;
  toggleSidebar: () => void;
};

const SidebarButton = ({ sidebarState, toggleSidebar }: SidebarButtonProps) => {
  return (
    <>
      <Button
        onClick={toggleSidebar}
        className="cursor-pointer bg-cyan-500 hover:bg-orange-500 transition-all rounded-full py-5 absolute flex bottom-100 left-full -translate-x-1/2 z-100 text-sm font-medium"
      >
        {sidebarState === "expanded" ? <ChevronRight /> : <ChevronLeft />}
      </Button>
    </>
  );
};

export default SidebarButton;
