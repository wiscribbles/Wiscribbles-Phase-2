import Pagination from "@/components/Pagination";
import Layout from "@/layout/Layout";
import PageBanner from "@/layout/PageBanner";
import Link from "next/link";
const BlogList = () => {
  return (
    <Layout>
      <PageBanner
        titleHtml={`Blog List <span>View</span>`}
        titleText="Blog List"
      />
      <section className="blog-list-area py-130 rel z-1">
        <div className="container">
          <div className="blog-list-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/blog/blog-list1.jpg" alt="Blog List" />
            </div>
            <div className="blog-content">
              <div className="content">
                <ul className="blog-meta">
                  <li>
                    <img
                      src="/assets/images/blog/blog-author.jpg"
                      alt="Author"
                    />
                    <a href="#">Somalia D. Silva</a>
                  </li>
                  <li>
                    <i className="far fa-calendar-alt" />
                    <a href="#"> 25 June 2024</a>
                  </li>
                </ul>
                <h4>
                  <Link legacyBehavior href="/blog-details">
                    How To Build Group Chat With Vanilla JS, Twilio Manage
                    Accessible Design System
                  </Link>
                </h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium dolore mquees laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architec to
                  beatae vitae dicta sunt explicabo voluptatem quia voluptas
                  site
                </p>
                <Link legacyBehavior href="/blog-details">
                  <a className="read-more">
                    Read More <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="blog-list-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/blog/blog-list2.jpg" alt="Blog List" />
            </div>
            <div className="blog-content">
              <div className="content">
                <ul className="blog-meta">
                  <li>
                    <img
                      src="/assets/images/blog/blog-author.jpg"
                      alt="Author"
                    />
                    <a href="#">Somalia D. Silva</a>
                  </li>
                  <li>
                    <i className="far fa-calendar-alt" />
                    <a href="#"> 25 June 2024</a>
                  </li>
                </ul>
                <h4>
                  <Link legacyBehavior href="/blog-details">
                    How To Build Group Chat With Vanilla JS, Twilio Manage
                    Accessible Design System
                  </Link>
                </h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium dolore mquees laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architec to
                  beatae vitae dicta sunt explicabo voluptatem quia voluptas
                  site
                </p>
                <Link legacyBehavior href="/blog-details">
                  <a className="read-more">
                    Read More <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="blog-list-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/blog/blog-list3.jpg" alt="Blog List" />
            </div>
            <div className="blog-content">
              <div className="content">
                <ul className="blog-meta">
                  <li>
                    <img
                      src="/assets/images/blog/blog-author.jpg"
                      alt="Author"
                    />
                    <a href="#">Somalia D. Silva</a>
                  </li>
                  <li>
                    <i className="far fa-calendar-alt" />
                    <a href="#"> 25 June 2024</a>
                  </li>
                </ul>
                <h4>
                  <Link legacyBehavior href="/blog-details">
                    How To Build Group Chat With Vanilla JS, Twilio Manage
                    Accessible Design System
                  </Link>
                </h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium dolore mquees laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architec to
                  beatae vitae dicta sunt explicabo voluptatem quia voluptas
                  site
                </p>
                <Link legacyBehavior href="/blog-details">
                  <a className="read-more">
                    Read More <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="blog-list-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/blog/blog-list4.jpg" alt="Blog List" />
            </div>
            <div className="blog-content">
              <div className="content">
                <ul className="blog-meta">
                  <li>
                    <img
                      src="/assets/images/blog/blog-author.jpg"
                      alt="Author"
                    />
                    <a href="#">Somalia D. Silva</a>
                  </li>
                  <li>
                    <i className="far fa-calendar-alt" />
                    <a href="#"> 25 June 2024</a>
                  </li>
                </ul>
                <h4>
                  <Link legacyBehavior href="/blog-details">
                    How To Build Group Chat With Vanilla JS, Twilio Manage
                    Accessible Design System
                  </Link>
                </h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium dolore mquees laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architec to
                  beatae vitae dicta sunt explicabo voluptatem quia voluptas
                  site
                </p>
                <Link legacyBehavior href="/blog-details">
                  <a className="read-more">
                    Read More <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="blog-list-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/blog/blog-list5.jpg" alt="Blog List" />
            </div>
            <div className="blog-content">
              <div className="content">
                <ul className="blog-meta">
                  <li>
                    <img
                      src="/assets/images/blog/blog-author.jpg"
                      alt="Author"
                    />
                    <a href="#">Somalia D. Silva</a>
                  </li>
                  <li>
                    <i className="far fa-calendar-alt" />
                    <a href="#"> 25 June 2024</a>
                  </li>
                </ul>
                <h4>
                  <Link legacyBehavior href="/blog-details">
                    How To Build Group Chat With Vanilla JS, Twilio Manage
                    Accessible Design System
                  </Link>
                </h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium dolore mquees laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architec to
                  beatae vitae dicta sunt explicabo voluptatem quia voluptas
                  site
                </p>
                <Link legacyBehavior href="/blog-details">
                  <a className="read-more">
                    Read More <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <div className="blog-list-item wow fadeInUp delay-0-2s">
            <div className="image">
              <img src="/assets/images/blog/blog-list6.jpg" alt="Blog List" />
            </div>
            <div className="blog-content">
              <div className="content">
                <ul className="blog-meta">
                  <li>
                    <img
                      src="/assets/images/blog/blog-author.jpg"
                      alt="Author"
                    />
                    <a href="#">Somalia D. Silva</a>
                  </li>
                  <li>
                    <i className="far fa-calendar-alt" />
                    <a href="#"> 25 June 2024</a>
                  </li>
                </ul>
                <h4>
                  <Link legacyBehavior href="/blog-details">
                    How To Build Group Chat With Vanilla JS, Twilio Manage
                    Accessible Design System
                  </Link>
                </h4>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium dolore mquees laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architec to
                  beatae vitae dicta sunt explicabo voluptatem quia voluptas
                  site
                </p>
                <Link legacyBehavior href="/blog-details">
                  <a className="read-more">
                    Read More <i className="far fa-arrow-right" />
                  </a>
                </Link>
              </div>
            </div>
          </div>
          <ul className="pagination flex-wrap justify-content-center pt-20 wow fadeInUp delay-0-2s">
            <Pagination paginationCls={".blog-list-item"} />
          </ul>
        </div>
      </section>
      {/* Blog List Area end */}
    </Layout>
  );
};
export default BlogList;
