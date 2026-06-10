import { z } from "zod";

/**
 * Validates a request to update a workspace member's role.
 * Ensures the role value is strictly one of: Owner, Admin, or Member.
 */
export const updateMemberRoleSchema = z.object({
  role: z.enum(["Owner", "Admin", "Member"], {
    message: "Role must be either 'Owner', 'Admin', or 'Member'.",
  }),
});

/**
 * Validates invitations.
 */
export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address format"),
  role: z.enum(["Owner", "Admin", "Member"], {
    message: "Role must be either 'Owner', 'Admin', or 'Member'.",
  }),
});


