"use client";
import CountUp from "react-countup";
import ReactVisibilitySensor from "react-visibility-sensor";

const Counter = ({ end, decimals, percentageTrue }) => {
  return (
    <CountUp
      end={end && end !== "24/7" ? end : 100} // Default to 100 if no end is provided
      duration={3}
      decimals={decimals ? decimals : 0}
    >
      {({ countUpRef, start }) => (
        <ReactVisibilitySensor onChange={start} delayedCall>
          <span className="count-text">
            {end === "24/7" ? (
              "24/7"
            ) : (
              <>
                <span ref={countUpRef}></span>
                {percentageTrue ? "%" : ""}
              </>
            )}
          </span>
        </ReactVisibilitySensor>
      )}
    </CountUp>
  );
};

export default Counter;
