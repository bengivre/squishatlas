export type FilterChip = {
  id: string;
  label: string;
  href: string;
};

export function buildFilterChips(
  slug: string,
  active: { filter?: string; sort?: string; lonely?: string },
): { chips: FilterChip[]; activeId: string } {
  const base = `/t/${slug}/squishies`;
  const lonely = active.lonely === "1";

  const chips: FilterChip[] = [
    { id: "all", label: "All", href: base },
    { id: "favorites", label: "♥ Favourites", href: `${base}?filter=favorites` },
    { id: "newest", label: "Newest", href: `${base}?sort=newest` },
    { id: "connected", label: "Has family", href: `${base}?filter=connected` },
    { id: "no_story", label: "No story yet", href: `${base}?filter=no_story` },
  ];

  if (lonely) {
    chips.push({
      id: "lonely",
      label: "Waiting for a friend",
      href: `${base}?lonely=1`,
    });
  }

  let activeId = "all";
  if (lonely) {
    activeId = "lonely";
  } else if (active.filter === "favorites") {
    activeId = "favorites";
  } else if (active.sort === "newest") {
    activeId = "newest";
  } else if (active.filter === "connected") {
    activeId = "connected";
  } else if (active.filter === "no_story") {
    activeId = "no_story";
  }

  return { chips, activeId };
}
