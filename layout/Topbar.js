import React from "react";

// components
import TopbarSearch from "@/components/TopbarSearch";
import NotificationDropdown from "@/components/NotificationDropdown";
import ProfileDropdown from "@/components/ProfileDropdown";
const profilePic = "/assets/images/user-1.jpg";
const logoSm = "/assets/images/logos/logo-white.png";
const logoDark = "/assets/images/logos/logo.png";
const logoDark2 = "/assets/images/logos/logo.png";
const logoLight = "/assets/images/logos/logo-white.png";
const logoLight2 = "/assets/images/logos/logo-white.png";
import { useViewport } from "@/hooks/useViewPort";
import { useLayoutContext } from "@/context/useLayoutContext.jsx";
import { toggleDocumentAttribute } from "@/utils/layout";
import Link from "next/link";
import MessageDropdown from "@/components/MessagesDropdown";
// get the notifications
const Notifications = [
  {
    id: 1,
    text: "Cristina Pride",
    subText: "Hi, How are you? What about our next meeting",
    avatar: profilePic,
  },
];

// get the profilemenu
const ProfileMenus = [
  {
    label: "My Account",
    icon: "fe-user",
    redirectTo: "#",
  },
  {
    label: "Settings",
    icon: "fe-settings",
    redirectTo: "#",
  },
  {
    label: "Lock Screen",
    icon: "fe-lock",
    redirectTo: "/auth/lock-screen",
  },
  {
    label: "Logout",
    icon: "fe-log-out",
    redirectTo: "/auth/logout",
  },
];

// dummy search results
const SearchResults = [];
const otherOptions = [];

// get mega-menu options
const MegaMenuOptions = [];
const Topbar = ({ hideLogo, navCssClasses }) => {
  const { width } = useViewport();
  const { menu, orientation, changeMenuSize, themeCustomizer } =
    useLayoutContext();
  const navbarCssClasses = navCssClasses || "";
  const containerCssClasses = !hideLogo ? "container-fluid" : "";

  /**
   * Toggle the leftmenu when having mobile screen
   */
  const handleLeftMenuCallBack = () => {
    if (width < 1140) {
      if (menu.size === "full") {
        showLeftSideBarBackdrop();
        toggleDocumentAttribute("class", "sidebar-enable");
      } else {
        changeMenuSize("full");
      }
    } else if (menu.size === "condensed") {
      changeMenuSize("default");
    } else if (menu.size === "full") {
      showLeftSideBarBackdrop();
      toggleDocumentAttribute("class", "sidebar-enable");
    } else if (menu.size === "fullscreen") {
      changeMenuSize("default");
      toggleDocumentAttribute("class", "sidebar-enable");
    } else {
      changeMenuSize("condensed");
    }
  };

  // create backdrop for leftsidebar
  function showLeftSideBarBackdrop() {
    const backdrop = document.createElement("div");
    backdrop.id = "custom-backdrop";
    backdrop.className = "offcanvas-backdrop fade show";
    document.body.appendChild(backdrop);
    if (
      document.getElementsByTagName("html")[0]?.getAttribute("dir") !== "rtl"
    ) {
      document.body.style.overflow = "hidden";
      if (width > 1140) {
        document.body.style.paddingRight = "15px";
      }
    }
    backdrop.addEventListener("click", function () {
      toggleDocumentAttribute("class", "sidebar-enable", true);
      changeMenuSize("full");
      hideLeftSideBarBackdrop();
    });
  }
  function hideLeftSideBarBackdrop() {
    const backdrop = document.getElementById("custom-backdrop");
    if (backdrop) {
      document.body.removeChild(backdrop);
      document.body.style.overflow = "visible";
    }
  }
  return (
    <React.Fragment>
      <div className={`navbar-custom ${navbarCssClasses}`}>
        <div className={`topbar ${containerCssClasses}`}>
          <div className="topbar-menu d-flex align-items-center gap-1">
            <div className="logo-box">
              <Link href="/" className="logo logo-dark text-center">
                <span className="logo-sm">
                  <img src={logoSm} alt="" height="22" />
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

            <button
              className="button-toggle-menu"
              onClick={handleLeftMenuCallBack}
            >
              <i className="mdi mdi-menu" />
            </button>
          </div>

          <ul className="topbar-menu d-flex align-items-center">
            <li className="app-search dropdown d-none d-lg-block">
              <TopbarSearch items={SearchResults} />
            </li>
            {/* <li className="dropdown d-inline-block d-lg-none">
                         <SearchDropdown />
                         </li> */}

            <li className="dropdown notification-list">
              <NotificationDropdown notifications={Notifications} />
            </li>
            <li className="dropdown notification-list">
              <MessageDropdown notifications={Notifications} />
            </li>
            <li>
              <button
                className="nav-link dropdown-toggle right-bar-toggle waves-effect waves-light btn btn-link shadow-none"
                onClick={themeCustomizer.toggle}
              >
                <i className="fe-settings noti-icon font-22"></i>
              </button>
            </li>
            <li className="dropdown">
              <ProfileDropdown
                profilePic={profilePic}
                menuItems={ProfileMenus}
                username={"Geneva"}
                userTitle={"Founder"}
              />
            </li>
          </ul>
        </div>
      </div>
    </React.Fragment>
  );
};
export default Topbar;
