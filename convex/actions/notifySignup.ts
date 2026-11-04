"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { notifySignup } from "../lib/notifySignup";

export const send = internalAction({
  args: {
    kind: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    await notifySignup({
      kind: args.kind,
      email: args.email,
      name: args.name,
      details: { source: "convex createProfile", company: args.company },
    });
    return null;
  },
});
