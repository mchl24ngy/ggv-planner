import { Joyride, EVENTS, STATUS, ACTIONS, EventData, Controls, Step } from 'react-joyride';
import { useLanguage } from '../i18n/useLanguage';

export { EVENTS, STATUS, ACTIONS };
export type { EventData, Controls };

interface TutorialWalkthroughProps {
  run: boolean;
  stepIndex: number;
  onCallback: (data: EventData, controls: Controls) => void;
}

export const TutorialWalkthrough: React.FC<TutorialWalkthroughProps> = ({
  run,
  stepIndex,
  onCallback,
}) => {
  const { t } = useLanguage();

  const steps: Step[] = [
    {
      target: '[data-tutorial="address-input"]',
      title: t.tutorialStep1Title,
      content: t.tutorialStep1Content,
      skipBeacon: true,
      placement: 'right',
    },
    {
      target: '[data-tutorial="battery-section"]',
      title: t.tutorialStep2Title,
      content: t.tutorialStep2Content,
      skipBeacon: true,
      placement: 'right',
    },
    {
      target: '[data-tutorial="battery-tooltip"]',
      title: t.tutorialStep3Title,
      content: t.tutorialStep3Content,
      skipBeacon: true,
      placement: 'right',
    },
    {
      target: '[data-tutorial="next-button-tab1"]',
      title: t.tutorialStep4Title,
      content: t.tutorialStep4Content,
      skipBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tutorial="tab2-sidebar-button"]',
      title: t.tutorialStep5Title,
      content: t.tutorialStep5Content,
      skipBeacon: true,
      placement: 'right',
    },
    {
      target: '[data-tutorial="results-section"]',
      title: t.tutorialStep6Title,
      content: t.tutorialStep6Content,
      skipBeacon: true,
      placement: 'top',
      // Wait up to 2 s for Tab 3 to render before giving up
      targetWaitTimeout: 2000,
    },
    {
      target: '[data-tutorial="kpi-display"]',
      title: t.tutorialStep7Title,
      content: t.tutorialStep7Content,
      skipBeacon: true,
      placement: 'bottom',
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={onCallback}
      options={{
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
        skipBeacon: true,
        overlayColor: 'rgba(0,0,0,0.45)',
        primaryColor: '#2563eb',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        arrowColor: '#ffffff',
        zIndex: 10000,
      }}
      locale={{
        back: t.tutorialLocaleBack,
        close: t.tutorialLocaleClose,
        last: t.tutorialLocaleLast,
        next: t.tutorialLocaleNext,
        open: t.tutorialLocaleOpen,
        skip: t.tutorialLocaleSkip,
      }}
      styles={{
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '320px',
        },
        tooltipTitle: {
          fontSize: '15px',
          fontWeight: '700',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '13px',
          lineHeight: '1.6',
          padding: '0',
        },
        buttonPrimary: {
          borderRadius: '8px',
          padding: '8px 18px',
          fontSize: '13px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#64748b',
          fontSize: '13px',
        },
        buttonSkip: {
          color: '#94a3b8',
          fontSize: '12px',
        },
      }}
    />
  );
};
