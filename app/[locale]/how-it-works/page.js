"use client";
import OxencyAccordion from "@/components/OxencyAccordion";
import ProgressBar from "@/components/ProgressBar";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import { useTranslations } from "next-intl";
import Link from "next/link";

const HowItWorks = ({ params: { form_id } }) => {
  const t = useTranslations();
  return (
    <Layout footer={1} >
      <PageBanner
        titleHtml={
          t("how_it_works_banner_html_1") +
          "<span>" +
          t("how_it_works_banner_html_2") +
          "</span>"
        }
        titleText={t("how_it_works_title")}
      />
      <section className="what-we-offer my-130 rel z-1">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-xl-5 col-lg-6">
              <div className="what-we-offer-left mb-30 rmb-65 wow fadeInRight delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">
                    {t("how_it_works_what_we_offer")}
                  </span>
                  <h2>{t("how_it_works_heading")}</h2>
                </div>
                <p>{t("how_it_works_description")}</p>
              </div>
            </div>
            <div className="col-xl-5 col-lg-6">
              <div className="what-we-offer-right wow fadeInLeft delay-0-2s">
                <p>{t("how_it_works_notarization_intro")}</p>
                <ul className="list-style-four pt-5">
                  <li>{t("how_it_works_step_1")}</li>
                  <li>{t("how_it_works_step_2")}</li>
                  <li>{t("how_it_works_step_3")}</li>
                  <li>{t("how_it_works_step_4")}</li>
                  <li>{t("how_it_works_step_5")}</li>
                  <li>{t("how_it_works_step_6")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* What We Offer Area end */}
      {/* Features Area start */}
      <section className="features-area-seven pb-100 rel z-1">
        <div className=" ">
          <div className="w-75 mx-auto d-flex flex-row flex-wrap  gap-2 justify-content-center">
            <div style={{ minWidth: "200px" }} className="col">
              <div className="feature-item-seven mt-30 wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-idea" />
                </div>
                <h5>{t("how_it_works_step_1")}</h5>
                <p>{t("how_it_works_step_1_desc")}</p>
              </div>
            </div>
            <div style={{ minWidth: "200px" }} className="col">
              <div className="feature-item-seven color-two wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-graphic-design" />
                </div>
                <h5>{t("how_it_works_step_2")}</h5>
                <p>{t("how_it_works_step_2_desc")}</p>
              </div>
            </div>
            <div style={{ minWidth: "200px" }} className="col">
              <div className="feature-item-seven color-three mt-40 wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-coding-2" />
                </div>
                <h5>{t("how_it_works_step_3")}</h5>
                <p>{t("how_it_works_step_3_desc")}</p>
              </div>
            </div>
            <div style={{ minWidth: "200px" }} className="col">
              <div className="feature-item-seven color-four wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-checklist" />
                </div>
                <h5>{t("how_it_works_step_4")}</h5>
                <p>{t("how_it_works_step_4_desc")}</p>
              </div>
            </div>
            <div style={{ minWidth: "200px" }} className="col">
              <div className="feature-item-seven color-five mt-40 wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-goal" />
                </div>
                <h5>{t("how_it_works_step_5")}</h5>
                <p>{t("how_it_works_step_5_desc")}</p>
              </div>
            </div>
            <div style={{ minWidth: "200px" }} className="col">
              <div className="feature-item-seven color-five mt-40 wow fadeInUp delay-0-2s">
                <div className="icon">
                  <i className="flaticon-goal" />
                </div>
                <h5>{t("how_it_works_step_6")}</h5>
                <p>{t("how_it_works_step_6_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Area end */}
      {/* What We Offer Two Area start */}
      <section className="what-we-offer-two mb-130 rel z-1">
        <div className="container">
          <div className="row large-gap align-items-center">
            <div className="col-lg-6">
              <div className="what-we-offer-image rmb-65 wow fadeInRight delay-0-2s">
                <img
                  src="/assets/images/about/what-we-offer.png"
                  alt="What We Offer"
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="what-we-offer-content wow fadeInLeft delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">
                    {t("how_it_works_what_we_offer_2")}
                  </span>
                  <h2>{t("how_it_works_why_choose_online_notarization")}</h2>
                </div>
                <p>{t("how_it_works_notarization_description")}</p>
                <ul className="list-style-four pt-5 pb-30">
                  <li>{t("how_it_works_benefit_convenient")}</li>
                  <li>{t("how_it_works_benefit_secure")}</li>
                  <li>{t("how_it_works_benefit_fast")}</li>
                  <li>{t("how_it_works_benefit_legally_valid")}</li>
                </ul>
                <Link legacyBehavior href="/en/form-step1">
                  <a className="theme-btn mt-15" style={{ color: '#FFFFFF' }}>
                    {t("how_it_works_get_started")} {" "}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Two Area end */}
      {/* Responsive Design Area start */}
      <section className="responsive-design-area mb-130 rel z-1">
        <div className="container">
          <div className="row large-gap align-items-center">
            <div className="col-lg-6">
              <div className="responsive-design-content rmb-65 wow fadeInLeft delay-0-2s">
                <div className="section-title mb-25">
                  <span className="sub-title style-two mb-15">
                    {t("how_it_works_notarization_help")}
                  </span>
                  <h2>{t("how_it_works_what_is_online_notarization")}</h2>
                </div>
                <p>{t("how_it_works_online_notarization_description")}</p>
                <ul className="list-style-four pt-5 pb-30">
                  <li>{t("how_it_works_legally_enforceable")}</li>
                  <li>{t("how_it_works_faster_cheaper")}</li>
                  <li>{t("how_it_works_every_device")}</li>
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="responsive-design-image wow fadeInRight delay-0-2s">
                <img
                  src="/assets/images/about/statistics-five.png"
                  alt="Responsive Design"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Design Area end */}
      {/* CTA Two Area start */}
      <section
        className="cta-two bgc-black-with-lighting-half bgs-cover text-white py-75 rel z-1"
        style={{
          backgroundImage: "url(/assets/images/background/cta-two.png)",
        }}
      >
        <div className="container">
          <div className="row large-gap align-items-center">
            <div className="col-lg-5">
              <div className="cta-two-image rmb-65 wow fadeInRight delay-0-2s">
                <img src="/assets/images/about/cta.png" alt="CTA" />
              </div>
            </div>
            <div className="col-lg-7">
              <div className="cta-two-content-two wow fadeInLeft delay-0-2s">
                <div className="section-title mb-25">
                  <h2>{t("how_it_works_cta_heading")}</h2>
                </div>
                <p>{t("how_it_works_cta_description")}</p>
                <Link legacyBehavior href="/en/signUp">
                  <a className="theme-btn style-three white-btn mt-15">
                    {t("how_it_works_join_notary_team")}{" "}
                    <i className="fas fa-angle-double-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Two Area end */}
      {/* Support & Marketing Area start */}
      <section className="support-marketing-area py-130 rel z-1">
        <div></div>
        <div className="container">
          <div className="row large-gap justify-content-between align-items-center">
            <div className="col-lg-6">
              <div className="support-marketing-progress rmb-65 wow fadeInUp delay-0-4s">
                <div className="section-title mb-35">
                  <span className="sub-title style-two mb-15">
                    {t("how_it_works_support_marketing")}
                  </span>
                  <h2>{t("how_it_works_notarization_simple_secure")}</h2>
                </div>
                <p>{t("how_it_works_notarization_services_description")}</p>
                <div className="circle-counter">
                  <div className="circle-progress-item">
                    <ProgressBar value={90} color="#3180fc" />
                    <h5>{t("how_it_works_secure_encrypted")}</h5>
                  </div>
                  <div className="circle-progress-item">
                    <ProgressBar value={50} color="#f1b000" />
                    <h5>{t("how_it_works_cost_effective")}</h5>
                  </div>
                  <div className="circle-progress-item">
                    <ProgressBar value={100} color="#16b4f2" />
                    <h5>{t("how_it_works_legally_valid")}</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="support-marketing-list wow fadeInUp delay-0-2s">
                <ul className="list-style-one">
                  <li>
                    <div className="content">
                      <h5>{t("how_it_works_legally_valid")}</h5>
                      <p>{t("how_it_works_legally_valid_description")}</p>
                    </div>
                  </li>
                  <li>
                    <div className="content">
                      <h5>{t("how_it_works_cost_effective")}</h5>
                      <p>{t("how_it_works_cost_effective_description")}</p>
                    </div>
                  </li>
                  <li>
                    <div className="content">
                      <h5>{t("how_it_works_fast_convenient")}</h5>
                      <p>{t("how_it_works_fast_convenient_description")}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support & Marketing Area end */}
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
              <Link legacyBehavior href="/en/form-step1">
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
export default HowItWorks;
