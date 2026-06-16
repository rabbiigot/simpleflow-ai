import AutomationContainer from "@/components/automation/automationContainer";
import FeatureGate from "@/components/layout/FeatureGate";

const Automation = () => {
  return (
    <FeatureGate
      allowed={(e) => e.maxAutomations !== 0}
      title="Automations are a paid feature"
      description="Your current plan doesn't include automations. Upgrade to Pro or Team to build automated workflows."
    >
      <div>
        <AutomationContainer />
      </div>
    </FeatureGate>
  );
};

export default Automation;
