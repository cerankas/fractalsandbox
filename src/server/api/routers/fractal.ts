import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const fractalRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text} from fractal router!`,
      };
    }),

  getFractalById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const fractal = await ctx.db.fractal.findUnique({ where: { id: input.id } });
      if (!fractal) throw new TRPCError({ code: "NOT_FOUND" });
      return fractal;
    }),    
  
  getLatest: publicProcedure
    .query(async ({ ctx }) => {
      const data = await ctx.db.fractal.findMany({
        take: 1,
        orderBy: [{ createdAt: "desc" }],
      });
      if (!data) throw new TRPCError({ code: "NOT_FOUND" });
      return data[0];
    }),

});