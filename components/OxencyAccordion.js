import { Fragment } from "react";
import { Accordion } from "react-bootstrap";

const OxencyAccordion = ({ title, event, dec, active, onClick }) => {
  return (
    <Fragment>
      <div className="accordion-item">
        <h5 className="accordion-header">
          <Accordion.Toggle
            eventKey={event}
            className={`accordion-button ${
              active !== event ? "collapsed" : ""
            }`}
            data-bs-toggle="collapse"
            onClick={() => onClick()}
          >
            {title}
          </Accordion.Toggle>
        </h5>
        <Accordion.Collapse
          eventKey={event}
          className={`accordion-collapse ${active !== event ? "collapse" : ""}`}
          data-bs-parent="#faq-accordion"
        >
          <div className="accordion-body">
            <p>{dec}</p>
          </div>
        </Accordion.Collapse>
      </div>
    </Fragment>
  );
};
export default OxencyAccordion;
