"use client";
import OxencyAccordion from "@/components/OxencyAccordion";
import ProgressBar from "@/components/ProgressBar";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";

const HowItWorks = ({ params: { form_id } }) => {
  const st = useTranslations("solutions");
  return (
    <Layout footer={1}>
      <PageBanner
        titleHtml={st("banner_html_1") + "<span>" + st("banner_html_2") + "</span>"}
        titleText={st("title")}
      />
      {[1, 2, 3, 4].map((secNo, index) =>
        secNo % 2 == 1 ? (
          <section id={`${secNo}`} key={index} className="what-we-offer my-130 rel z-1">
            <div className="container">
              <div className="row justify-content-between align-items-center">
                <div className="col-xl-5 col-lg-6">
                  <div className="what-we-offer-left mb-30 rmb-65 wow fadeInRight delay-0-2s">
                    <div className="section-title mb-25">
                      <span className="sub-title style-two mb-15">{st(`sec${secNo}.point`)}</span>
                      <h2>{st(`sec${secNo}.heading`)}</h2>
                    </div>
                    <p style={{ textAlign: "justify" }}>
                      {st(`sec${secNo}.para1`)} {st(`sec${secNo}.para2`)}
                    </p>
                    <Link legacyBehavior href={`/en/signUp?signUpAs=${secNo === 1 ? 'Notary' : secNo === 2 ? 'Attorney' : secNo === 3 ? 'Real Estate Agent' : 'Business'}`}>
                      <a className="theme-btn mt-15" style={{ color: secNo === 1 ? '#FFFFFF' : undefined }}>
                        {st(`sec${secNo}.button`)} <i className="fas fa-angle-double-right" />
                      </a>
                    </Link>
                  </div>
                </div>
                <div className="col-xl-5 col-lg-6">
                  <div className="what-we-offer-right wow fadeInLeft delay-0-2s">
                    <div
                      style={{
                        borderRadius: "15px",
                        overflow: "hidden",
                        maxWidth: "fit-content",
                      }}
                    >
                      <Image
                        src={`/assets/images/solutions/solutions-${secNo}.jpg`}
                        width={500}
                        height={500}
                        layout="intrinsic"
                      ></Image>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section
            id={`${secNo}`}
            className="cta-two bgc-black-with-lighting-half solutions-opposite bgs-cover text-white py-75 rel z-1"
            style={{
              backgroundImage: "url(/assets/images/background/cta-two.png)",
            }}
          >
            <div className="container">
              <div className="row large-gap align-items-center">
                <div className="col-lg-6">
                  <div
                    className="what-we-offer-image rmb-65 wow fadeInRight delay-0-2s"
                    style={{ borderRadius: "15px", overflow: "hidden" }}
                  >
                    <div
                      style={{
                        borderRadius: "15px",
                        overflow: "hidden",
                        maxWidth: "fit-content",
                      }}
                    >
                      <Image
                        src={`/assets/images/solutions/solutions-${secNo}.jpg`}
                        width={500}
                        height={500}
                        layout="intrinsic"
                      ></Image>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div
                    style={{ textAlign: "right" }}
                    className="what-we-offer-content wow fadeInLeft delay-0-2s d-flex flex-column align-items-start"
                  >
                    <div className="section-title  d-flex flex-column align-items-start mb-25">
                      <span className="sub-title style-two arrow mb-15">{st(`sec${secNo}.point`)}</span>
                      <h2 style={{ textAlign: "right" }}>{st(`sec${secNo}.heading`)}</h2>
                    </div>
                    <p style={{ textAlign: "justify" }}>
                      {st(`sec${secNo}.para1`)} {st(`sec${secNo}.para2`)}
                    </p>
                    <Link legacyBehavior href={`/en/signUp?signUpAs=${secNo === 1 ? 'Notary' : secNo === 2 ? 'Attorney' : secNo === 3 ? 'Real Estate Agent' : 'Business'}`}>
                      <a className="theme-btn mt-15 t" style={{ color: secNo === 1 ? '#FFFFFF' : undefined }}>
                        {st(`sec${secNo}.button`)} <i className="fas fa-angle-double-right" />
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )
      )}

      {/* What We Offer Area end */}
      {/* What We Offer Two Area start */}

      {/* What We Offer Two Area end */}
    </Layout>
  );
};
export default HowItWorks;
