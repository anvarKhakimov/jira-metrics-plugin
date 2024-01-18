import React from "react";
import { sendAnalyticsEvent } from "../../utils/google-analytics";

function FilterButton({ filter, isActive, toggleFilter }) {
  const handleClick = () => {
    toggleFilter(filter.id);

    // Отправка события аналитики
    sendAnalyticsEvent("filter_interacted", {
      action: "Toggle",
      label: "Filter Toggled",
    });
  };

  return (
    <button
      id={filter.id}
      className={`filter-button ${isActive ? "active" : ""}`}
      onClick={handleClick}
      type="button"
    >
      {filter.name}
    </button>
  );
}

export default FilterButton;
