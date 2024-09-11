import { type PermissionAction } from "@/config/rbac/permissions";
import { ApiError } from "./errors";

export const throwIfNoAccess = ({
  permissions,
  requiredPermissions,
}: {
  permissions: PermissionAction[]; // user or token permissions
  requiredPermissions: PermissionAction[];
  workspaceId: string;
}) => {
  if (requiredPermissions.length === 0) {
    return;
  }

  const missingPermissions = requiredPermissions.filter(
    (p) => !permissions.includes(p),
  );

  if (missingPermissions.length === 0) {
    return;
  }

  throw new ApiError({
    code: "FORBIDDEN",
    message: "You do not have permission to perform this action in workspace.",
  });
};
