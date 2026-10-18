"use client";
import Counter from "@/components/Counter";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import { useLocale, useTranslations } from "next-intl";
import { notarizeNow } from "@/lib/routes";
import Link from "next/link";
const About = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Layout footer={1}>
      <PageBanner
        titleHtml={
          t("about_us_banner_html_1") +
          "<span>" +
          t("about_us_banner_html_2") +
          "</span>"
        }
        titleText="About"
      />
      <section className="ww-do-two-area py-130 rel z-1">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-xl-5 col-lg-6">
              <div className="ww-do-two-content rmb-65 wow fadeInUp delay-0-2s">
                <div className="section-title mb-30">
                  <span className="sub-title style-two mb-15">
                    {t("about_us_what_we_do")}
                  </span>
                  <h2>{t("about_us_revolutionizing_notarization")}</h2>
                </div>
                <p>{t("about_us_description")}</p>
                <div className="row pt-15">
                  <div className="col-sm-6">
                    <div className="feature-item-two border-right pe-sm-3">
                      <div className="icon">
                        <i className="fas fa-check" />
                      </div>
                      <h5>{t("about_us_simplifying_notarization")}</h5>
                      <p>{t("about_us_simplifying_notarization_desc")}</p>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="feature-item-two color-two">
                      <div className="icon">
                        <i className="fas fa-check" />
                      </div>
                      <h5>{t("about_us_legally_compliant")}</h5>
                      <p>{t("about_us_legally_compliant_desc")}</p>
                    </div>
                  </div>
                </div>
                <div className="ww-do-btns">
                  {/* Was `/about` — the page it is already on. */}
                  <Link legacyBehavior href={notarizeNow(locale)}>
                    <a className="theme-btn mt-15" style={{ color: '#FFFFFF' }}>
                      {t("about_us_notarize_now")}{" "}
                      <i className="fas fa-angle-double-right" />
                    </a>
                  </Link>
                  <a
                    href="https://www.youtube.com/watch?v=9Y7ma241N8k"
                    className="mfp-iframe video-play-text mt-15"
                  >
                    <i className="fas fa-play" />{" "}
                    <span>{t("about_us_watch_tutorial")}</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="ww-do-two-images rel">
                <div className="row">
                  <div className="col-sm-7 offset-1">
                    <img
                      className="image-one wow fadeInUp delay-0-4s"
                      src="/assets/images/about/ww-do-two1.jpg"
                      alt={t("about_us_what_we_do")}
                    />
                  </div>
                  <div className="col-sm-4">
                    <img
                      className="image-two wow fadeInUp delay-0-6s"
                      src="/assets/images/about/ww-do-two2.jpg"
                      alt={t("about_us_what_we_do")}
                    />
                    <img
                      className="image-three wow fadeInUp delay-0-8s"
                      src="/assets/images/about/ww-do-two3.jpg"
                      alt={t("about_us_what_we_do")}
                    />
                  </div>
                </div>
                <div className="year-of-experience wow zoomIn delay-0-6s">
                  <span className="number">5+</span>{" "}
                  {t("about_us_years_experience")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* What We Do Two Area end */}
      {/* Statistics Four Area start */}
      <div className="statistics-area-four rel z-1">
        <div className="container">
          <div
            className="statistics-four-counters bgs-cover bgc-lighter"
            style={{
              backgroundImage: "url(assets/images/background/counter-bg.png)",
            }}
          >
            <div className="row medium-gap">
              <div className="col-xl-3 col-sm-6">
                <div className="counter-item mt-30 counter-text-wrap wow fadeInLeft delay-0-2s">
                  <i className="flaticon-startup" />
                  <Counter end={80} percentageTrue/>
                  <span className="counter-title">{t('about_us_stats.1')}</span>
                </div>
              </div>
              <div className="col-xl-3 col-sm-6">
                <div className="counter-item for-margin counter-text-wrap wow fadeInLeft delay-0-4s">
                  <i className="flaticon-global" />
                  <Counter end={100} percentageTrue/>
                  <span className="counter-title">{t('about_us_stats.2')}</span>
                </div>
              </div>
              <div className="col-xl-3 col-sm-6">
                <div className="counter-item mt-20 counter-text-wrap wow fadeInLeft delay-0-6s">
                  <i className="flaticon-rating" />
                  <Counter end="24/7" />
                  <span className="counter-title">{t('about_us_stats.3')}</span>
                </div>
              </div>
              <div className="col-xl-3 col-sm-6">
                <div className="counter-item for-margin counter-text-wrap wow fadeInLeft delay-0-8s">
                  <i className="flaticon-trophy" />
                  <Counter end={100} percentageTrue/>
                  <span className="counter-title">{t('about_us_stats.4')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Video Area start */}
      <section className="video-area bgc-black pt-250">
        <div className="container">
          <div className="row medium-gap align-items-end pt-80">
            <div className="col-lg-6">
              <div className="video-part rmb-65 wow fadeInRight delay-0-2s">
                <img src="/assets/images/background/video-bg.jpg" alt="Video" />
                {/* <a
                  href="https://www.youtube.com/watch?v=9Y7ma241N8k"
                  className="mfp-iframe video-play"
                  tabIndex={-1}
                >
                  <i className="fas fa-play" />
                </a> */}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="video-content text-white pb-95 rpb-115 wow fadeInLeft delay-0-2s">
                <div className="section-title mb-30">
                  <h2>{t("about_us_notarization_ai_tech")}</h2>
                </div>
                <ul className="list-style-three">
                  <li>{t("about_us_accessible_notarization")}</li>
                  <li>{t("about_us_ai_verification")}</li>
                  <li>{t("about_us_seamless_anytime")}</li>
                  <li>{t("about_us_live_notary")}</li>
                  <li>{t("about_us_secure_technology")}</li>
                  <li>{t("about_us_legally_valid")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Video Area End */}

      {/* Feature Six Area start */}
      <section>
        <div className="container">
          <div
            className="feature-six-inner bgs-cover bgc-primary"
            style={{
              backgroundImage:
                "url(/assets/images/background/freature-bg-line.png)",
              backgroundColor: "#081A34",
              marginTop: "232px",
              marginBottom: "135px",
            }}
          >
            <div className="row">
              <div className="col-lg-6">
                <div className="feature-item-three wow fadeInRight delay-0-3s">
                  <i className="flaticon-technical-support" />
                  <div className="content">
                    <h4>{t("about_us_legally_compliant_secure")}</h4>
                    <p>{t("about_us_legally_compliant_secure_desc")}</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 d-flex">
                <div className="feature-item-three d-flex align-items-center color-two wow fadeInRight delay-0-5s">
                  <i className="flaticon-app-development mb-40" />
                  <div className="content">
                    <h4>{t("about_us_edit_mobile_view")}</h4>
                    <p>{t("about_us_edit_mobile_view_desc")}</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="feature-item-three color-three wow fadeInRight delay-0-4s">
                  <i className="flaticon-settings" />
                  <div className="content">
                    <h4>{t("about_us_add_advanced_features")}</h4>
                    <p>{t("about_us_add_advanced_features_desc")}</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="feature-item-three color-four wow fadeInRight delay-0-6s">
                  <i className="flaticon-optimization" />
                  <div className="content">
                    <h4>{t("about_us_optimize_for_search")}</h4>
                    <p>{t("about_us_optimize_for_search_desc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Six Area end */}
      <section
        style={{ backgroundColor: "#081A34" }}
        className="pt-80 pb-50 bgs-cover bgc-black-with-lighting-half rel z-1"
      >
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-xl-7 col-lg-9">
              <div className="section-title text-white mb-25 wow fadeInUp delay-0-2s">
                <h2>{t("how_it_works_lets_start_notarization")}</h2>
                <p>{t("how_it_works_lets_start_notarization_description")}</p>
              </div>
            </div>
            <div className="col-lg-3 text-lg-end">
              <Link legacyBehavior href="/contact">
                <a className="theme-btn style-two mb-30 wow fadeInUp delay-0-4s">
                  {t("how_it_works_lets_get_started")}{" "}
                  <i className="fas fa-angle-double-right" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default About;
