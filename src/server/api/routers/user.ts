import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";

export const userRouter = createTRPCRouter({
  findMany: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ input }) => {
      const client = await clerkClient();
      const userList = await client.users.getUserList({userId: input.ids, limit: 50});
      const data = userList.data.map(
        user => ({ id: user.id, name: user.fullName ?? '', image: user.imageUrl })
      );
      
      if (!data) throw new TRPCError({ code: "NOT_FOUND" });
      return data;
    }),
});