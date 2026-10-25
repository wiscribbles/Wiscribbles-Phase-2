import { useLocale, useTranslations } from "next-intl";
import { notarizeNow } from "@/lib/routes";
import Link from "next/link";
import Slider from "react-slick";

const Hero1 = () => {
  const props = {
    infinite: true,
    arrows: false,
    dots: false,
    fade: true,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: false,
    slidesToScroll: 1,
    slidesToShow: 1,
  };
  const t = useTranslations();
  const locale = useLocale();
  return (
    <section
      id="home"
      className="main-slider-area bgc-black-with-lighting rel z-1"
    >
      <Slider {...props} className="main-slider-active">
        {/* <div className="slider-item">
          <div className="container">
            <div className="slider-content">
              <span className="sub-title">
                25 Years of Experience in web design solutions
              </span>
              <h1>Digital web design solutions agency</h1>
              <div className="slider-btns">
                <Link legacyBehavior href="/contact">
                  <a className="theme-btn">
                    Get Started Us <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
                <Link legacyBehavior href="/services">
                  <a className="theme-btn style-three">
                    Explore Services <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div
            className="slider-video"
            style={{
              backgroundImage: "url(/assets/images/slider/slide1.jpg)",
            }}
          >
            <a
              href="https://www.youtube.com/watch?v=9Y7ma241N8k"
              className="mfp-iframe video-play"
            >
              <i className="fas fa-play" />
            </a>
            <span className="video-title cd-headline clip">
              <span className="cd-words-wrapper">
                <b className="is-visible">Web Design</b>
                <b>Development</b>
              </span>
            </span>
          </div>
        </div> */}
        <div className="slider-item">
          <div className="container">
            <div className="slider-content">
              <span className="sub-title">{t("slider_sub_title")}</span>
              <h1 style={{color: "#416976"}}>
                {t("slider_main_title")}{" "}
                <span style={{ color: "#ffffff" }}>
                  {t("slider_main_title_highlight") + " "}
                </span>
                <span className="text-nowrap">
                  {t("slider_main_title_suffix")
                    .split(" ")
                    .map((str, num, arr) =>
                      arr.length / 2 <= num ? (
                        <span style={{ color: "#ffffff" }}>{str + " "}</span>
                      ) : (
                        str + " "
                      )
                    )}
                </span>
              </h1>
              <div className="slider-btns">
                {/* Was `/en/form-step1` — locale hard-coded to English, and
                    pointing at the Phase 1 form model that Stage 6 replaced
                    with the upload-and-bind flow at /request. */}
                <Link legacyBehavior href={notarizeNow(locale)}>
                  <a className="theme-btn" style={{ color: '#FFFFFF' }}>
                    {t("slider_btn_get_started")}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
                {/* And this one, which reintroduced the identical bug two lines
                    below the comment describing it. */}
                <Link legacyBehavior href={notarizeNow(locale)}>
                  <a className="theme-btn style-three" style={{ color: '#FFFFFF' }}>
                    {t("slider_btn_explore_services")}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div
            className="slider-video"
            style={{
              backgroundImage: "url(/assets/images/slider/slide2.jpg)",
            }}
          >
            <a
              href="https://www.youtube.com/embed/C0DPdy98e4c"
              className="mfp-iframe video-play bg-transparent"
            >
              {/* <i className="fas fa-play" /> */}
              
            <span
              style={{
                  fontFamily: ["Kumbh Sans", "sans-serif"],
                  textTransform: "none",
                  fontSize: "1.5rem",
                  bottom: "30%",
                  left:"-105%",
                  position: "absolute",
                  cursor: "pointer",
              }}
              className="video-title cd-headline clip"
            >
              <span
                  style={{
                    backgroundColor: "#416976", borderRadius: "50px"
                  }}
                className=" py-2 px-3"
              >
                <div className="d-flex flex-row align-items-center">
                  <b className="is-visible text-nowrap">{t("slider_video_title_1")}</b>
                  <div
                    className=" bg-white d-flex align-items-center justify-content-center"
                    style={{ marginLeft: "15px", borderRadius: "50%", width: 36, height: 36 }}
                  >
                    {/* Inline SVG ensures the play icon is always visible */}
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.5 1.8v12.4c0 .5.55.82.98.56l9.9-6.2c.43-.27.43-.85 0-1.12l-9.9-6.2A.65.65 0 0 0 1.5 1.8z" fill="#416976"/>
                    </svg>
                  </div>
                </div>
                {/* <b>{t("slider_video_title_2")}</b> */}
              </span>
            </span>
            </a>
          </div>
        </div>

        {/* <div className="slider-item">
          <div className="container">
            <div className="slider-content">
              <span className="sub-title">
                25 Years of Experience in web design solutions
              </span>
              <h1>Digital web design solutions agency</h1>
              <div className="slider-btns">
                <Link legacyBehavior href="/contact">
                  <a className="theme-btn">
                    Get Started Us <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
                <Link legacyBehavior href="/services">
                  <a className="theme-btn style-three">
                    Explore Services <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div
            className="slider-video"
            style={{
              backgroundImage: "url(/assets/images/slider/slide1.jpg)",
            }}
          >
            <a
              href="https://www.youtube.com/watch?v=9Y7ma241N8k"
              className="mfp-iframe video-play"
            >
              <i className="fas fa-play" />
            </a>
            <span className="video-title cd-headline clip">
              <span className="cd-words-wrapper">
                <b className="is-visible">Web Design</b>
                <b>Development</b>
              </span>
            </span>
          </div>
        </div> */}
      </Slider>
      <div className="container">
        <div className="main-slider-dots" />
      </div>
      <div className="slider-shapes">
        <img
          className="shape dots one"
          src="/assets/images/shapes/slider-dots.png"
          alt="Shape"
        />
        <img
          className="shape dots two"
          src="/assets/images/shapes/slider-dots.png"
          alt="Shape"
        />
        <img
          className="shape wave-line"
          src="/assets/images/shapes/slider-wave-line.png"
          alt="Shape"
        />
        <img
          className="shape circle"
          src="/assets/images/shapes/slider-circle.png"
          alt="Shape"
        />
      </div>
    </section>
  );
};
export default Hero1;
