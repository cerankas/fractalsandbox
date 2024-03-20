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

  create: publicProcedure
    .input(z.object({ content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.fractal.create({
        data: {
          authorId: "xyz",
          content: input.content,
        },
      });
    }),

  getFractalById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ctx, input}) => {
      const fractal = await ctx.db.fractal.findUnique({ where: { id: input.id } });
      if (!fractal) throw new TRPCError({ code: "NOT_FOUND"});
      return fractal;
    }),    

});