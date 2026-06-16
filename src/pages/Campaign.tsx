import CampaignContainer from "@/components/campaign/campaignContainer";
import FeatureGate from "@/components/layout/FeatureGate";

const Campaign = () => {
  return (
    <FeatureGate
      allowed={(e) => e.emailCampaigns}
      title="Email campaigns are a paid feature"
      description="Your current plan doesn't include email campaigns. Upgrade to Team to run campaigns."
    >
      <div>
        <CampaignContainer />
      </div>
    </FeatureGate>
  );
};

export default Campaign;
