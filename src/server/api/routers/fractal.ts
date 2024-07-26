import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const fractalRouter = createTRPCRouter({
  findUnique: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const fractal = await ctx.db.fractal.findUnique({ where: { id: input.id } });
      if (!fractal) throw new TRPCError({ code: "NOT_FOUND" });
      return fractal;
    }),    
  
  findMany: publicProcedure
    .input(z.object({ gt: z.optional(z.nullable(z.number())), lt: z.optional(z.nullable(z.number())) }))
    .query(async ({ ctx, input }) => {

      const whereClause: { id?: { gt?: number, lt?: number } } = {};
      
      if (input.gt != null) whereClause.id = { ...whereClause.id, gt: input.gt };
      if (input.lt != null) whereClause.id = { ...whereClause.id, lt: input.lt };
      
      const data = await ctx.db.fractal.findMany({
        take: 50,
        where: whereClause,
        orderBy: [{ id: "desc" }],
      });
      
      if (!data) throw new TRPCError({ code: "NOT_FOUND" });
      return data;
    }),

});