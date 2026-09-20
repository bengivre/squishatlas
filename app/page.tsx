import { headers } from "next/headers";

import { HomeLanding } from "@/components/marketing/home-landing";
import { auth } from "@/lib/auth";
import { getPostLoginRedirect } from "@/lib/auth/post-login-redirect";
import {
  fetchGithubStarCount,
  getGithubRepoSlug,
  getGithubRepoUrl,
} from "@/lib/github/repo";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const githubRepo = getGithubRepoSlug();
  const [signedInHref, starCount] = await Promise.all([
    session?.user ? getPostLoginRedirect() : Promise.resolve(null),
    fetchGithubStarCount(githubRepo),
  ]);

  return (
    <HomeLanding
      signedInHref={signedInHref}
      githubUrl={getGithubRepoUrl(githubRepo)}
      githubRepo={githubRepo}
      starCount={starCount}
    />
  );
}
