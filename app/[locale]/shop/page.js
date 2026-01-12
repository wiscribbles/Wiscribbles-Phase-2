import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";

import dynamic from "next/dynamic";

const ShopIsotope = dynamic(() => import("@/components/Isotope/ShopIsotope"), {
  ssr: false,
});

const Shop = () => {
  return (
    <Layout>
      <PageBanner titleHtml={`Our<span> Shop</span>`} titleText="Shop" />
      <section className="shop-page-area py-130 rel z-1">
        <div className="container">
          <div className="row justify-content-center pb-20">
            <div className="col-xl-6 col-lg-8 col-md-10">
              <div className="section-title text-center mb-30 wow fadeInUp delay-0-2s">
                <span className="sub-title style-two mb-15">
                  Pre-made Template
                </span>
                <h2>Let’s See Our Popular Website Template</h2>
              </div>
            </div>
          </div>
          {/* Isotope */}
          <ShopIsotope />
        </div>
      </section>
      {/* Shop Page Area end */}
    </Layout>
  );
};
export default Shop;
