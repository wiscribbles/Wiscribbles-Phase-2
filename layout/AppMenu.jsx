import React, { useEffect, useRef, useState, useCallback } from "react";
import classNames from "classnames";
import { MENU_ITEMS as menuItems } from "@/constants/menu-items";
import Link from "next/link";

//helpers
// import { findAllParent, findMenuItem } from "../helpers/menu";

// constants
const MenuItem = ({ item, className, linkClassName }) => {
  return (
    <li className={classNames("menu-item", className)}>
      <MenuItemLink item={item} className={linkClassName} />
    </li>
  );
};
const MenuItemLink = ({ item, className }) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.url || "#"}
      target={item.target}
      className={classNames("side-nav-link-ref menu-link", className)}
      data-menu-key={item.key}
    >
      {Icon && (
        <span className="menu-icon">
          <Icon />{" "}
        </span>
      )}
      <span className="menu-text"> {item.label} </span>
      {item.badge && (
        <span className={`badge bg-${item.badge.variant} `}>
          {item.badge.text}
        </span>
      )}
    </Link>
  );
};

/**
 * Renders the application menu
 */

const AppMenu = () => {
  // const location = useLocation();
  const menuRef = useRef(null);
  const [activeMenuItems, setActiveMenuItems] = useState([]);

  /*
   * toggle the menus
   */

  /**
   * activate the menuitems
   */

  ///implement next js version of this
  // const activeMenu = useCallback(() => {
  //   const div = document.getElementById("main-side-menu");
  //   let matchingMenuItem = null;
  //   if (div) {
  //     const items = div.getElementsByClassName("side-nav-link-ref");
  //     for (let i = 0; i < items.length; ++i) {
  //       const trimmedURL = location?.pathname;
  //       if (trimmedURL === items[i]?.pathname) {
  //         matchingMenuItem = items[i];
  //         break;
  //       }
  //     }
  //     if (matchingMenuItem) {
  //       const mid = matchingMenuItem.getAttribute("data-menu-key");
  //       const activeMt = findMenuItem(menuItems, mid);
  //       if (activeMt) {
  //         setActiveMenuItems([
  //           activeMt["key"],
  //           ...findAllParent(menuItems, activeMt),
  //         ]);
  //       }
  //     }
  //   }
  // }, [location, menuItems]);
  // useEffect(() => {
  //   activeMenu();
  // }, []);
  return (
    <>
      <ul className="menu" ref={menuRef} id="main-side-menu">
        {(menuItems || []).map((item, idx) => {
          //
          return (
            <React.Fragment key={idx}>
              {item.isTitle ? (
                <li
                  className={classNames("menu-title", {
                    "mt-2": idx !== 0,
                  })}
                >
                  {item.label}
                </li>
              ) : (
                <MenuItem
                  item={item}
                  linkClassName="menu-link"
                  className={
                    activeMenuItems.includes(item.key) ? "menuitem-active" : ""
                  }
                />
              )}
            </React.Fragment>
          );
        })}
      </ul>
    </>
  );
};
export default AppMenu;
