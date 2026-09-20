const DEFAULT_GITHUB_REPO = "bengivre/squishatlas";

export function getGithubRepoSlug(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GITHUB_REPO?.trim();
  return fromEnv && fromEnv.includes("/") ? fromEnv : DEFAULT_GITHUB_REPO;
}

export function getGithubRepoUrl(repo = getGithubRepoSlug()): string {
  return `https://github.com/${repo}`;
}

export async function fetchGithubStarCount(
  repo = getGithubRepoSlug(),
): Promise<number | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "squishatlas-landing",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

export function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}
