const specialCaseLabels = {
  EYE_ROLL: "eye roll",
  LONG_NOT_TOO_LONG: "medium",
  CAESAR_SIDE_PART: "caesar (side part)",
};

const groupIcons = {
  facial_features: "😊",
  hair: "💇",
};

function sanitizeName(name) {
  return name.replaceAll("_", " ");
}

function sanitizeLabel(label) {
  if (label in specialCaseLabels) {
    return specialCaseLabels[label];
  }
  label = label.toLowerCase();
  const splitIndex = label.indexOf("_");
  if (splitIndex === -1) return label;
  const name = label.substring(0, splitIndex);
  const desc = label
    .substring(splitIndex + 1)
    .replaceAll("_", ", ");
  return `${name} (${desc})`;
}

function Parts({ spec, choices, onChange }) {
  if (!spec) return null;

  return (
    <div className="fade-in">
      {Object.keys(spec.groups).map((groupName) => (
        <PartGroup
          key={`group-${groupName}`}
          name={groupName}
          parts={spec.groups[groupName]}
          spec={spec}
          choices={choices}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function PartGroup({ name, parts, spec, choices, onChange }) {
  return (
    <div className="part-group">
      <div className="part-group-header">
        <span className="part-group-icon" aria-hidden="true">
          {groupIcons[name] ?? "⚙️"}
        </span>
        <h3 className="part-group-title">{sanitizeName(name)}</h3>
      </div>
      {parts.map((partName) => {
        const exclusion = spec.exclusions[partName];
        if (
          exclusion &&
          choices[exclusion.part] ===
            spec.values[spec.parts[exclusion.part]][exclusion.key]
        ) {
          return null;
        }

        return (
          <PartPicker
            key={partName}
            onChange={onChange}
            name={partName}
            type={spec.parts[partName]}
            current={choices[partName]}
            values={spec.values[spec.parts[partName]]}
          />
        );
      })}
    </div>
  );
}

function PartPicker(props) {
  if (props.type.endsWith("Color")) {
    return <ColorPicker {...props} />;
  }

  const handleChange = (e) => {
    props.onChange(props.name, e.target.value);
  };

  return (
    <div className="picker">
      <label htmlFor={`part-${props.name}`} className="picker-label">
        {sanitizeName(props.name)}
      </label>
      <select
        id={`part-${props.name}`}
        onChange={handleChange}
        value={props.current}
        className="picker-select"
      >
        {Object.keys(props.values).map((itemName) => (
          <option
            key={`${props.name}=${itemName}`}
            value={props.values[itemName]}
          >
            {sanitizeLabel(itemName)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorPicker(props) {
  const handleChange = (e) => {
    props.onChange(props.name, e.target.value);
  };

  return (
    <div className="picker">
      <fieldset className="color-picker-grid" onChange={handleChange}>
        <legend className="picker-label">{sanitizeName(props.name)}</legend>
        {Object.keys(props.values).map((colorName) => {
          const colorValue = props.values[colorName];
          const isSelected = props.current === colorValue;
          return (
            <label
              key={`${props.name}-${colorName}`}
              className={`color-swatch${isSelected ? " color-swatch--selected" : ""}`}
              style={{ backgroundColor: colorValue }}
              aria-label={sanitizeName(colorName)}
              title={sanitizeName(colorName)}
            >
              <input
                type="radio"
                name={`color-${props.name}`}
                value={colorValue}
                checked={isSelected}
                onChange={handleChange}
              />
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

export default Parts;
