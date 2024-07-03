import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getAuth } from "@clerk/nextjs/server";

export const fractalMutateRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ form: z.string().min(1), color: z.string().min(1) }))
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

    // createMany: publicProcedure
    // .input(z.array(z.object({ createdAt: z.date(), authorId: z.string(), form: z.string(), color: z.string() })))
    // .mutation(async ({ ctx, input }) => {
    //   const { userId } = getAuth(ctx.req);
    //   if (typeof userId != 'string') throw new TRPCError({ code: "UNAUTHORIZED" });
    //   return await ctx.db.fractal.createMany({
    //     data: input
    //     // data: input.map(fractal => ({
    //     //   ...fractal,
    //     //   authorId: userId,
    //     // }))
    //   });
    // }),

    delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = getAuth(ctx.req);
      if (typeof userId != 'string') throw new TRPCError({ code: "UNAUTHORIZED" });
      return await ctx.db.fractal.delete({
        where: {
          authorId: userId,
          id: input.id,
        },
      });
    }),
  });