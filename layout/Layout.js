"use client";
import { animation, stickyNav } from "@/utility";
import { Fragment, useEffect } from "react";
import niceSelect from "react-nice-select";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider, useMessages } from "next-intl";
import CallToAction from "../components/CallToAction";
import ImageView from "../components/ImageView";
import VideoPopup from "../components/VideoPopup";
import Footer from "./Footer";
import Header from "./Header";
import ScrollTop from "./ScrollTop";
import SideBar from "./SideBar";

const Layout = ({ children, header, className, footer, noHeader, login }) => {
  const pathname = usePathname();
  const locale = pathname.split("/")[1]; // Extract locale from the URL
  const messages = useMessages(); // Auto-fetch messages
  

  useEffect(() => {
    animation();
    document.querySelector("body").className = className ? className : "oxence_body";
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", stickyNav);
  }, []);

  useEffect(() => {
    return () => {
      niceSelect({ withoutwide: true });
    };
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Fragment>
        <VideoPopup />
        <ImageView />
        <div className="page-wrapper">
          {!noHeader && <Header header={header} locale={locale} login={login} />}
          <SideBar />
          {children}
          {!footer && <CallToAction />}
          <Footer footer={footer} />
          <ScrollTop />
        </div>
      </Fragment>
    </NextIntlClientProvider>
  );
};

export default Layout;
