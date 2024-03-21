import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const hello = api.fractal.hello.useQuery({ text: "*user*" });
  // const frac = api.fractal.getFractalById.useQuery({ id: "1" });
  const frac = api.fractal.getLatest.useQuery();
  const { mutate } = api.fractal.create.useMutation({
    onSuccess: (data) => { alert(data.content); }
  })

  return (
    <>
      <Head>
        <title>Fractal Sandbox</title>
        <meta name="description" content="interactive fractal generator" />
        <meta name="author" content="Szymon Ceranka" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[orange] to-[blue]">
        <div className="absolute right-2 top-2 hover:cursor-pointer hover:brightness-110">
          {isSignedIn && <UserButton userProfileMode="modal" afterSignOutUrl={window.location.href} appearance={{ elements: { userButtonAvatarBox: { width: 40, height: 40 }}}} />}
          {!isSignedIn && <SignInButton mode="modal">
            <span className="flex rounded-full bg-slate-700 w-10 h-10 justify-center items-center"><FaUser/>
            </span></SignInButton>
          }
        </div>
        <div>Hello {user?.firstName} ({user?.primaryEmailAddress?.emailAddress})!</div>
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <p className="text-2xl text-white">
            {hello.data ? hello.data.greeting : "..."}
          </p>
          <p className="text-2xl text-black">
            {frac.data ? (frac.data.content ? frac.data.content : "no content") : "..."}
          </p>
          <p className="cursor-pointer" onClick={() => mutate({ content: Date().split(' (')[0] ?? "" })}>[Add]</p>
        </div>
      </main>
    </>
  );
}
