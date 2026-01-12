"use client";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";

const ProgressBar = ({ value, color, extraCls }) => {
  const hex2rgba = (hex, alpha = 1) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };
  return (
    <div
      className={`progress-content mb-3 ${extraCls ? extraCls : "one"}`}
      style={{ width: 130, height: 130 }}
    >
      <h3>{value}%</h3>
      <CircularProgressbar
        width={130}
        value={value}
        strokeWidth={5}
        styles={buildStyles({
          pathColor: color,
          trailColor: hex2rgba(color, 0.2),
        })}
      />
    </div>
  );
};
export default ProgressBar;
