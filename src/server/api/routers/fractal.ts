import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const fractalRouter = createTRPCRouter({
  getFractalById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const fractal = await ctx.db.fractal.findUnique({ where: { id: input.id } });
      if (!fractal) throw new TRPCError({ code: "NOT_FOUND" });
      return fractal;
    }),    
  
  getManyLatest: publicProcedure
    .query(async ({ ctx }) => {
      const data = await ctx.db.fractal.findMany({
        take: 1000, // 100
        orderBy: [{ createdAt: "desc" }],
      });
      if (!data) throw new TRPCError({ code: "NOT_FOUND" });
      return data;
    }),

});