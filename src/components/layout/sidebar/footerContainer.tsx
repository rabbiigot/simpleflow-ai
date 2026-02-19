import { Card } from "@/components/ui/card";

type FooterContainerProps = {
  sidebarState?: string;
};

const FooterContainer: React.FC<FooterContainerProps> = ({
  sidebarState,
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
