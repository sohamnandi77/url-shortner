import { type createLinkBodySchema } from "@/schema/links";
import { type Link, type UserRole, type Workspace } from "@prisma/client";
import { type z } from "zod";

export type RequestAuthUser = {
  id: string;
  email: string;
  image?: string;
};

export interface IWorkspace extends Workspace {
  domains: {
    id: string;
    slug: string;
    primary: boolean;
    verified: boolean;
  }[];
  users: {
    role: UserRole;
  }[];
}

export type WorkspaceWithUsers = Omit<IWorkspace, "domains">;

export type NewLinkProps = z.infer<typeof createLinkBodySchema>;

type ProcessedLinkOverrides =
  | "domain"
  | "keyword"
  | "originalLink"
  | "workspaceId";
export type ProcessedLinkProps = Omit<NewLinkProps, ProcessedLinkOverrides> &
  Pick<Link, ProcessedLinkOverrides> & { userId?: Link["userId"] } & {
    createdAt?: Date;
    id?: string;
  };
