import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getAuth } from "@clerk/nextjs/server";

export const fractalCreateRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ form: z.string().min(1), color: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = getAuth(ctx.req);
      if (typeof userId != 'string') throw new TRPCError({ code: "UNAUTHORIZED" });
      return await ctx.db.fractal.create({
        data: {
          authorId: userId,
          form: input.form,
          color: input.color,
        },
      });
    }),
});