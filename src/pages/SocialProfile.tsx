import SocialProfileContainer from "@/components/social/socialProfileContainer";
import { useParams, useSearch } from "@tanstack/react-router";

const SocialProfile = () => {
  const params = useParams({ strict: false }) as { userId?: string };
  const search = useSearch({ strict: false }) as { tab?: string };
  return <SocialProfileContainer profileUserId={params.userId} initialTab={search.tab} />;
};

export default SocialProfile;
