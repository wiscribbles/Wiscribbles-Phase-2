import { useTranslations } from "next-intl";
import Link from "next/link";
const PageBanner = ({ titleHtml, titleText }) => {
  const t = useTranslations();
  return (
    <section className="page-banner-area pt-245 rpt-150 pb-170 rpb-100 rel z-1 bgc-lighter text-center">
      <div className="container">
        <div className="banner-inner rpt-10">
          <h1
            className="page-title wow fadeInUp delay-0-2s"
            dangerouslySetInnerHTML={{ __html: titleHtml }}
          ></h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb justify-content-center wow fadeInUp delay-0-4s">
              <li className="breadcrumb-item">
                <Link legacyBehavior href="/">
                  <a>{t("page_banner_home")}</a>
                </Link>
              </li>
              <li className="breadcrumb-item active">{titleText}</li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="banner-shapes">
        <div
          className="circle wow zoomInLeft delay-0-2s"
          data-wow-duration="2s"
        />
        <img
          className="shape-one"
          src="/assets/images/shapes/hero-shape1.png"
          alt="Shape"
        />
        <img
          className="shape-two"
          src="/assets/images/shapes/hero-shape2.png"
          alt="Shape"
        />
      </div>
    </section>
  );
};
export default PageBanner;
