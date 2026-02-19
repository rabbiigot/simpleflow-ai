import { useEffect, useState } from "react";
import logoOnly from "/src/assets/logoOnly.png"
import nameLogo from "/src/assets/namelogo.png"

const HeaderContainer: React.FC<{ sidebarState: "expanded" | "collapsed" }> = ({
  sidebarState,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarState === "expanded") {
      setSidebarOpen(sidebarState === "expanded");
    } else {
      setSidebarOpen(false);
    }
  }, [sidebarState]);
  return (
    <>
      <header>
        <div
          className={`relative bg-white left-0 top-0 ${
            sidebarOpen ? "w-62" : "w-19"
          } h-[70px] p-1 z-40 border-b border-r drop-shadow flex items-center  justify-between`}
        >
          <div
            className={`fixed flex flex-row -left-20 ${
              sidebarOpen ? "ml-22" : "ml-22"
            }`}
          >
            <img
              src={logoOnly}
              alt="Logo"
              className=" mt-1 h-13"
            />
            {sidebarOpen ? (
              <div className="">
                <img
                  src={nameLogo}
                  alt="Logo"
                  className="transition-all duration-200 ease-in-out mt-3 h-10"
                />
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderContainer;
