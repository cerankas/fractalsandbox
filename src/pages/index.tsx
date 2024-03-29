import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";
import FractalSelector from "~/components/FractalSelector";

export default function Home() {
  const { isSignedIn } = useUser();
  const fracs = api.fractal.getManyLatest.useQuery();

  return (
    <>
      <Head>
        <title>Fractal Sandbox</title>
        <meta name="description" content="interactive fractal generator" />
        <meta name="author" content="Szymon Ceranka" />
      </Head>
      <main className="flex min-h-screen flex-col items-center self-start bg-gradient-to-b from-[orange] to-[blue]">
        <div className="absolute right-2 top-2 hover:cursor-pointer hover:brightness-110">
          {isSignedIn && <UserButton userProfileMode="modal" afterSignOutUrl={window.location.href} appearance={{ elements: { userButtonAvatarBox: { width: 32, height: 32 }}}} />}
          {!isSignedIn && <SignInButton mode="modal">
            <span className="flex text-base rounded-full bg-slate-700 w-8 h-8 justify-center items-center"><FaUser/>
            </span></SignInButton>
          }
        </div>
        { fracs.data && <FractalSelector fractals={fracs.data.map(f => ({ form: f.form, color: f.color }))} /> }
      </main>
    </>
  );
}
