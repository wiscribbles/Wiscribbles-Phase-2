import React, { useMemo, forwardRef } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";

const CountrySelect = forwardRef(({ value, onChange, onBlur, options: customOptions }, ref) => {
  const options = useMemo(() => customOptions || countryList().getData(), [customOptions]);

  const customStyles = {
    control: (base) => ({
      ...base,
      height: "60px",
      border: "2px solid #B4D4E4",
      paddingTop: "10px",
      paddingBottom: "10px",
      paddingRight: "5px",
    }),
    option: (base) => ({
      ...base,
      display: "flex",
      alignItems: "center",
    }),
    singleValue: (base) => ({
      ...base,
      display: "flex",
      alignItems: "center",
    }),
  };

  const formatOptionLabel = ({ label, value }) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <img
        src={`https://flagcdn.com/w40/${value.toLowerCase()}.png`}
        alt={`Flag of ${label}`}
        style={{ width: "20px", height: "15px", marginRight: "10px" }}
      />
      <span>{label}</span>
    </div>
  );

  return (
    <Select
      ref={ref}
      options={options}
      value={options.find((option) => option.label === value)}
      onChange={(selected) => onChange(selected.label)}
      onBlur={onBlur}
      styles={customStyles}
      formatOptionLabel={formatOptionLabel}
    />
  );
});

CountrySelect.displayName = 'CountrySelect';

export default CountrySelect;
