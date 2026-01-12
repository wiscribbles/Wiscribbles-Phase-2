///always wrap this component in LayoutProvider to use the useLayoutContext hook inside here
import React, { Suspense, useEffect, useState } from "react";
import { Container } from "react-bootstrap";

// utils
import { useViewport } from "@/hooks/useViewPort";
import { useLayoutContext } from "@/context/useLayoutContext.jsx";

// code splitting and lazy loading
const Topbar = React.lazy(() => import("./Topbar"));
const LeftSidebar = React.lazy(() => import("./LeftSidebar"));
const loading = () => <div className=""></div>;
const VerticalLayout = ({ children }) => {
  const { width } = useViewport();
  const { changeMenuSize } = useLayoutContext();
  const [isMenuOpened, setIsMenuOpened] = useState(false);

  /*
  layout defaults
  */

  useEffect(() => {
    if (width < 1140) {
      changeMenuSize("full");
    } else if (width >= 1140) {
      changeMenuSize("default");
      document
        .getElementsByTagName("html")[0]
        .classList.remove("sidebar-enable");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  /**
   * Open the menu when having mobile screen
   */
  const openMenu = () => {
    setIsMenuOpened((prevState) => !prevState);
    if (document.body) {
      if (isMenuOpened) {
        document.body.classList.remove("sidebar-enable");
      } else {
        document.body.classList.add("sidebar-enable");
      }
    }
  };
  return (
    <>
      <div id="wrapper">
        <Suspense fallback={loading()}>
          <LeftSidebar />
        </Suspense>

        <div className="content-page">
          <Suspense fallback={loading()}>
            <Topbar openLeftMenuCallBack={openMenu} />
          </Suspense>

          <div className="content">
            <Container fluid>
              <Suspense fallback={loading()}>{children}</Suspense>
            </Container>
          </div>
        </div>
      </div>
    </>
  );
};
export default VerticalLayout;
