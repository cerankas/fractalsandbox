import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";
import { getOldFractals } from "~/math/archive";

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const { isSignedIn, user } = useUser();
  const hello = api.fractal.hello.useQuery({ text: "*user*" });
  const frac = api.fractal.getLatest.useQuery();
  const { mutate } = api.fractalCreate.create.useMutation({ onSuccess: (data) => { alert(data.form); }})
  const { mutate: mutateMany } = api.fractalCreate.createMany.useMutation({ onSuccess: (data) => { alert(data.count); }})

  const fractalsArray = getOldFractals();
  console.log(fractalsArray.length);
  
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
        {/*eslint-disable-next-line @typescript-eslint/no-unsafe-member-access*/}
        <div>Hello {user?.firstName} ({user?.primaryEmailAddress?.emailAddress})!</div>
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <p className="text-2xl text-white">
            {hello.data ? hello.data.greeting : "..."}
          </p>
          <p className="text-2xl text-black">
            {frac.data ? (frac.data.form ? frac.data.form : "no content") : "..."}
          </p>
          <p className="cursor-pointer" onClick={() => mutate({ form: Date().split(' (')[0] ?? "", color: "" })}>[Test add 1]</p>
          <p className="cursor-pointer" onClick={() => mutateMany([1,2,3].map((i) => { return { createdAt: new Date(), form: `f${i}`, color: `c${i}` }; } ))}>[Test add 3]</p>
          <p className="cursor-pointer" onClick={() => mutateMany(fractalsArray)}>[Add old fractals from archive]</p>
        </div>
      </main>
    </>
  );
}
