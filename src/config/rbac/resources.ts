export const RESOURCE_KEYS = {
  LINKS: "LINKS",
  WORKSPACES: "WORKSPACES",
  ANALYTICS: "ANALYTICS",
  DOMAINS: "DOMAINS",
  TAGS: "TAGS",
};

export type ResourceKey = keyof typeof RESOURCE_KEYS;

export const RESOURCES: {
  name: string;
  key: ResourceKey;
}[] = [
  {
    name: "Links",
    key: "LINKS",
  },
  {
    name: "Analytics",
    key: "ANALYTICS",
  },
  {
    name: "Workspaces",
    key: "WORKSPACES",
  },
  {
    name: "Domains",
    key: "DOMAINS",
  },
  {
    name: "Tags",
    key: "TAGS",
  },
];
