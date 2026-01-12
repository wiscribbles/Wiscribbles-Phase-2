import ProgressBar from "@/components/ProgressBar";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import dynamic from "next/dynamic";

const TeamIsotope = dynamic(() => import("@/components/Isotope/TeamIsotope"), {
  ssr: false,
});

const Team = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Expert <span>Team</span>`}
        titleText="Expert Team"
      />
      <section className="support-marketing-area py-130 rel z-1">
        <div className="container">
          <div className="row large-gap justify-content-between align-items-center">
            <div className="col-lg-6">
              <div className="support-marketing-progress rmb-65 wow fadeInLeft delay-0-2s">
                <div className="section-title mb-35">
                  <span className="sub-title style-two mb-15">Best Skills</span>
                  <h2>We are Much Experience in Website Design</h2>
                </div>
                <p>
                  Fortunately, we aren’t just designers and developers here—we
                  are writers, strategists, techs and creatives, all working
                  towards the same end goal: our client’s success. As a
                  full-service digital marketing agency
                </p>
                <div className="circle-counter">
                  <div className="circle-progress-item">
                    <ProgressBar value={89} color="#3180fc" />
                    <h5>SEO Service</h5>
                  </div>
                  <div className="circle-progress-item">
                    <ProgressBar value={76} color="#f1b000" />
                    <h5>Copywriting</h5>
                  </div>
                  <div className="circle-progress-item">
                    <ProgressBar value={63} color="#16b4f2" />
                    <h5>PPC</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="best-skills-image wow fadeInRight delay-0-2s">
                <img
                  src="/assets/images/about/best-skills.jpg"
                  alt="Best Skills"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Support & Marketing Area start */}
      {/* Team Area start */}
      <section className="team-page-area pb-65 rel z-1">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-7">
              <div className="section-title text-center mb-50 wow fadeInUp delay-0-2s">
                <span className="sub-title style-two mb-15">Amazing Team</span>
                <h2>We Have Well Experience Team Member</h2>
              </div>
            </div>
          </div>
          <TeamIsotope />
        </div>
      </section>
      {/* Team Area end */}
    </Layout>
  );
};
export default Team;
