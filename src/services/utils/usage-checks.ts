import { ApiError, exceededLimitError } from "@/lib/errors";
import { type WorkspaceWithUsers } from "@/types";

// Workspace clicks usage overage checks
export const throwIfClicksUsageExceeded = (workspace: WorkspaceWithUsers) => {
  if (workspace.usage > workspace.usageLimit) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: exceededLimitError({
        plan: workspace.plan,
        limit: workspace.usageLimit,
        type: "clicks",
      }),
    });
  }
};

// Workspace links usage overage checks
export const throwIfLinksUsageExceeded = (workspace: WorkspaceWithUsers) => {
  if (
    workspace.linksUsage >= workspace.linksLimit &&
    (workspace.plan === "FREE" || workspace.plan === "PRO")
  ) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: exceededLimitError({
        plan: workspace.plan,
        limit: workspace.linksLimit,
        type: "links",
      }),
    });
  }
};
