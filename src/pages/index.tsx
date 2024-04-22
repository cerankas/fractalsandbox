import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";
import FractalSelector from "~/components/FractalSelector";
import { useEffect, useState } from "react";
import FractalView from "~/components/FractalView";

export default function Home() {
  const { isSignedIn } = useUser();
  const fracs = api.fractal.getManyLatest.useQuery();
  const [selectedFractalId, setSelectedFractalId] = useState(0);
  const [fractalViewMode, setFractalViewMode] = useState(false);
  const selectedFractal = fracs.data?.[selectedFractalId];
  
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      console.log(e.key);
      if (e.key == "ArrowLeft"  && selectedFractalId > 0)                      setSelectedFractalId(selectedFractalId - 1);
      if (e.key == "ArrowRight" && selectedFractalId < fracs.data!.length - 1) setSelectedFractalId(selectedFractalId + 1);
      if (e.key == "Escape") setFractalViewMode(false);
      if (e.key == "Enter")  setFractalViewMode(!fractalViewMode);
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => { document.removeEventListener('keydown', keyDownHandler); }
  });

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
        <div className={fractalViewMode ? "flex h-screen" : "hidden"}>
          <div className="m-auto">
            {fractalViewMode && <FractalView 
              size={800}
              id={0}
              fractal={selectedFractal!.form}
              color={selectedFractal!.color}
              onclick={(_fractalId) => setFractalViewMode(false)} key={0}
              selected={false}
            />}
          </div>
        </div>
        <div className={fractalViewMode ? "hidden" : ""}>
          {fracs.data && <FractalSelector 
            fractals={fracs.data.map(f => ({ form: f.form, color: f.color }))} 
            onSelect={(fractalId) => { setSelectedFractalId(fractalId); setFractalViewMode(true); }} 
            selected={selectedFractalId}
          />}
        </div>
      </main>
    </>
  );
}
