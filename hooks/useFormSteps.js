'use client';

import { useEffect, useRef } from 'react';
import $ from 'jquery';

export const useFormSteps = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initialized.current) return;
    initialized.current = true;

    const DOMstrings = {
      stepsBtnClass: 'multisteps-form__progress-btn',
      stepsBtns: document.querySelectorAll('.multisteps-form__progress-btn'),
      stepsBar: document.querySelector('.multisteps-form__progress'),
      stepsForm: document.querySelector('.multisteps-form__form'),
      stepFormPanelClass: 'multisteps-form__panel',
      stepFormPanels: document.querySelectorAll('.multisteps-form__panel'),
      stepPrevBtnClass: 'js-btn-prev',
      stepNextBtnClass: 'js-btn-next'
    };

    if (!DOMstrings.stepsBar || !DOMstrings.stepsForm) return;

    const removeClasses = (elemSet, className) => {
      elemSet.forEach(elem => {
        elem.classList.remove(className);
      });
    };

    const findParent = (elem, parentClass) => {
      let currentNode = elem;
      while (!currentNode.classList.contains(parentClass)) {
        currentNode = currentNode.parentNode;
      }
      return currentNode;
    };

    const getActiveStep = elem => {
      return Array.from(DOMstrings.stepsBtns).indexOf(elem);
    };

    const setActiveStep = activeStepNum => {
      removeClasses(DOMstrings.stepsBtns, 'js-active');
      removeClasses(DOMstrings.stepsBtns, 'current');
      
      DOMstrings.stepsBtns.forEach((elem, index) => {
        if (index <= activeStepNum) {
          elem.classList.add('js-active');
          $(elem).addClass(index);
        }
        if (index === activeStepNum) {
          elem.classList.add('current');
        }
      });
    };

    const getActivePanel = () => {
      let activePanel;
      DOMstrings.stepFormPanels.forEach(elem => {
        if (elem.classList.contains('js-active')) {
          activePanel = elem;
        }
      });
      return activePanel;
    };

    const setActivePanel = activePanelNum => {
      const animation = $(DOMstrings.stepFormPanels, 'js-active').attr("data-animation");

      removeClasses(DOMstrings.stepFormPanels, 'js-active');
      removeClasses(DOMstrings.stepFormPanels, animation);
      removeClasses(DOMstrings.stepFormPanels, 'animate__animated');

      DOMstrings.stepFormPanels.forEach((elem, index) => {
        if (index === activePanelNum) {
          elem.classList.add('js-active');
          elem.classList.add('animate__animated', animation);

          setTimeout(() => {
            removeClasses(DOMstrings.stepFormPanels, 'animate__animated', animation);
          }, 1200);

          setFormHeight(elem);
        }
      });
    };

    const formHeight = activePanel => {
      const activePanelHeight = activePanel.offsetHeight;
      DOMstrings.stepsForm.style.height = `${activePanelHeight}px`;
    };

    const setFormHeight = () => {
      const activePanel = getActivePanel();
      formHeight(activePanel);
    };

    // Event Listeners
    const handleStepsBarClick = e => {
      const eventTarget = e.target;
      if (!eventTarget.classList.contains(DOMstrings.stepsBtnClass)) return;
      
      const activeStep = getActiveStep(eventTarget);
      setActiveStep(activeStep);
      setActivePanel(activeStep);
    };

    const handleStepsFormClick = e => {
      const eventTarget = e.target;
      if (!(eventTarget.classList.contains(DOMstrings.stepPrevBtnClass) || 
            eventTarget.classList.contains(DOMstrings.stepNextBtnClass))) {
        return;
      }

      const activePanel = findParent(eventTarget, DOMstrings.stepFormPanelClass);
      let activePanelNum = Array.from(DOMstrings.stepFormPanels).indexOf(activePanel);

      if (eventTarget.classList.contains(DOMstrings.stepPrevBtnClass)) {
        activePanelNum--;
        setActiveStep(activePanelNum);
        setActivePanel(activePanelNum);
      } else {
        const form = $('#wizard');
        form.validate();

        const parent_fieldset = $('.multisteps-form__panel.js-active');
        let next_step = true;

        parent_fieldset.find('.required').each(function() {
          next_step = false;
          const form = $('.required');
          form.validate();
          $(this).addClass('custom-select is-invalid');
        });

        if (next_step === true || form.valid() === true) {
          $("html, body").animate({
            scrollTop: 0
          }, 600);
          activePanelNum++;
          setActiveStep(activePanelNum);
          setActivePanel(activePanelNum);
        }
      }
    };

    // Attach event listeners
    DOMstrings.stepsBar.addEventListener('click', handleStepsBarClick);
    DOMstrings.stepsForm.addEventListener('click', handleStepsFormClick);
    window.addEventListener('load', setFormHeight);
    window.addEventListener('resize', setFormHeight);

    // Cleanup
    return () => {
      DOMstrings.stepsBar.removeEventListener('click', handleStepsBarClick);
      DOMstrings.stepsForm.removeEventListener('click', handleStepsFormClick);
      window.removeEventListener('load', setFormHeight);
      window.removeEventListener('resize', setFormHeight);
    };
  }, []);
}; 