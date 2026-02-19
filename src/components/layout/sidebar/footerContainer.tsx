import { Card } from "@/components/ui/card";

type FooterContainerProps = {
  sidebarState?: string;
  toggleSidebar?: () => void;
};

const FooterContainer: React.FC<FooterContainerProps> = ({
  sidebarState,
  toggleSidebar,
}) => {
  return (
    <Card>
      <div
        className={`absolute bottom-0 w-full ${
          sidebarState !== "expanded" ? "p-3" : "p-2"
        } border bg-white text-center text-sm text-gray-500`}
      >
        {sidebarState !== "expanded"
          ? "© 2024"
          : "© 2024 SimpleFlow AI. All rights reserved."}
      </div>
    </Card>
  );
};

export default FooterContainer;
