import React, { useEffect, useRef } from "react";
import SimpleBar from "simplebar-react";
// components
import AppMenu from "./AppMenu";
const logoSm = "/assets/images/logos/logo-white.png";
const logoDark = "/assets/images/logos/logo.png";
const logoDark2 = "/assets/images/logos/logo.png";
const logoLight = "/assets/images/logos/logo-white.png";
const logoLight2 = "/assets/images/logos/logo-white.png";
import { useLayoutContext } from "@/context/useLayoutContext.jsx";
import Link from "next/link";

/* sidebar content */
const SideBarContent = () => {
  return (
    <>
      {/* <div id="sidebar-menu"> */}
      <AppMenu />
      {/* </div> */}

      <div className="clearfix" />
    </>
  );
};
const LeftSidebar = () => {
  const menuNodeRef = useRef(null);
  const { orientation } = useLayoutContext();

  /**
   * Handle the click anywhere in doc
   */
  const handleOtherClick = (e) => {
    if (
      menuNodeRef &&
      menuNodeRef.current &&
      menuNodeRef.current.contains(e.target)
    )
      return;
    // else hide the menubar
    if (document.body) {
      document.body.classList.remove("sidebar-enable");
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleOtherClick, false);
    return () => {
      document.removeEventListener("mousedown", handleOtherClick, false);
    };
  }, []);
  return (
    <React.Fragment>
      <div className="app-menu" ref={menuNodeRef}>
        <div className="logo-box">
          <Link href="/" className="logo logo-dark text-center">
            <span className="logo-sm">
              <img src={"/assets/images/logos/logo-white.png"} alt="" height="22" />
            </span>
            <span className="logo-lg">
              <img
                src={orientation === "two-column" ? logoDark2 : logoDark}
                alt=""
                height="20"
              />
            </span>
          </Link>
          <Link href="/" className="logo logo-light text-center">
            <span className="logo-sm">
              <img src={logoSm} alt="" height="22" />
            </span>
            <span className="logo-lg">
              <img
                src={orientation === "two-column" ? logoLight2 : logoLight}
                alt=""
                height="20"
              />
            </span>
          </Link>
        </div>

        <SimpleBar className="scrollbar show h-100" scrollbarMaxSize={320}>
          <SideBarContent />
        </SimpleBar>
      </div>
    </React.Fragment>
  );
};
LeftSidebar.defaultProps = {
  isCondensed: false,
};
export default LeftSidebar;
