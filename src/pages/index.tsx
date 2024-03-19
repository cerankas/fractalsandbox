import Head from "next/head";

import { api } from "~/utils/api";

export default function Home() {
  const hello = api.fractal.hello.useQuery({ text: "from tRPC" });
  const frac = api.fractal.getFractalById.useQuery({ id: 1 });

  return (
    <>
      <Head>
        <title>Fractal Sandbox</title>
        <meta name="description" content="interactive fractal generator" />
        <meta name="author" content="Szymon Ceranka" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[orange] to-[blue]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <p className="text-2xl text-white">
            {hello.data ? hello.data.greeting : "Loading tRPC query..."}
          </p>
          <p className="text-2xl text-black">
            {frac.data ? (frac.data.content ? frac.data.content : "no content") : "Loading tRPC query..."}
          </p>
        </div>
      </main>
    </>
  );
}
