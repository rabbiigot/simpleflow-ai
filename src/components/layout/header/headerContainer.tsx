import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import logoOnly from "@/assets/logoOnly.png";
import nameLogo from "@/assets/namelogo.png";
import nameLogoWhite from "@/assets/namelogo-white.svg";

const HeaderContainer: React.FC<{ sidebarState: "expanded" | "collapsed" }> = ({
  sidebarState,
}) => {
  const sidebarOpen = sidebarState === "expanded";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <header>
      <div className="relative left-0 top-0 z-40 flex h-[68px] items-center justify-between border-b border-r border-sidebar-border bg-card px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src={logoOnly} alt="Logo" className="h-11 w-auto shrink-0" />
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              sidebarOpen ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            <img
              src={isDark ? nameLogoWhite : nameLogo}
              alt="Simpleflow"
              className="h-9 w-auto"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderContainer;
