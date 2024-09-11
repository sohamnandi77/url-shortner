import { linkConstructor } from "@/lib/link-constructor";
import { type Link, type Tag } from "@prisma/client";

export type LinkWithTags = Link & {
  tags?: { tag: Pick<Tag, "id" | "name" | "color"> }[];
};

// Transform link with additional properties
export const transformLink = (link: LinkWithTags) => {
  const tags = (link.tags ?? []).map(({ tag }) => tag);

  const shortLink = linkConstructor({
    domain: link.domain,
    key: link.keyword,
  });

  const qrLink = linkConstructor({
    domain: link.domain,
    key: link.keyword,
    searchParams: {
      qr: "1",
    },
  });

  return {
    ...link,
    shortLink,
    tagId: tags?.[0]?.id ?? null,
    tags,
    qrCode: `https://api.dub.co/qr?url=${qrLink}`,
    workspaceId: link.workspaceId ? `ws_${link.workspaceId}` : null,
  };
};
