// import ProjectGridIsotope from "@/components/Isotope/ProjectGridIsotope";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";

import dynamic from "next/dynamic";

const ProjectGridIsotope = dynamic(
  () => import("@/components/Isotope/ProjectGridIsotope"),
  {
    ssr: false,
  }
);

const Projects = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Project <span>Grid</span>`}
        titleText="Project Grid"
      />
      <section className="project-page-area pt-130 pb-100 rel z-1">
        <div className="container">
          <ProjectGridIsotope />
        </div>
      </section>
      {/* Project Area end */}
    </Layout>
  );
};
export default Projects;
