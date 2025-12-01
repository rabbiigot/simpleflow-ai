const HeaderContainer = () => {
  return (
    <>
      <header>
        <div className="fixed left-0 top-0 w-full h-[70px] p-1 z-40 bg-white border-b shadow-sm flex items-center px-5 justify-between">
          <div className="fixed">
            <img src="./src/assets/SF.png" alt="Logo" className="ml-5 h-15" />
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderContainer;
