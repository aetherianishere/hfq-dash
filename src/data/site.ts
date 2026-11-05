export const site = {
  name: "HFQ Network",
  ip: "hfq.mcc.lk",
  description:
    "A Lifesteal SMP where every fight can change your story. Take hearts, protect your own, and find your place on HFQ.",
  mainSite: "https://hfqmc.xyz",
} as const;

export const links = {
  discord: "https://discord.gg/5uEdufXZa",
  vote: "https://hfqmc.xyz/vote",
  jobs: "https://hfqmc.xyz/jobs",
  aurex: "https://aurex.lk",
  store: "/store",
} as const;

export const footerNav = [
  { label: "Home", href: site.mainSite, external: true },
  { label: "Store", href: links.store, external: false },
  { label: "Vote", href: links.vote, external: true },
  { label: "Jobs", href: links.jobs, external: true },
  { label: "Aurex Partner", href: links.aurex, external: true },
] as const;

export const partner = {
  name: "Aurex",
  label: "Official Hosting Partner",
  logo: "/images/aurex.png",
  url: links.aurex,
} as const;
