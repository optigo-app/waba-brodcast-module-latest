import React from 'react';
import './StepperNavigation.scss';

const StepperNavigation = ({ onNext, onPrevious, nextDisabled = false, prevDisabled = false, currentStep, steps }) => {
  return (
    <div className="stepper-navigation">
      <button
        className="nav-button prev-button"
        onClick={onPrevious}
        disabled={prevDisabled}
      >
        Previous
      </button>
      {currentStep !== steps.length &&
        <button
          className="nav-button next-button"
          onClick={onNext}
          disabled={nextDisabled}
        >
          Next
        </button>
      }
    </div>
  );
};

export default StepperNavigation;
