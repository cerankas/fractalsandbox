import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";
import { useCallback, useEffect, useState } from "react";
import FractalEditor from "~/components/FractalEditor";
import FractalBrowser from "~/components/FractalBrowser";
import FractalView from "~/components/FractalView";

export default function Home() {
  const { isSignedIn } = useUser();
  const fracs = api.fractal.getManyLatest.useQuery();
  const [selectedFractalId, setSelectedFractalId] = useState(0);
  const [viewEdit, setViewEdit] = useState(false);
  const [viewFull, setViewFull] = useState(false);
  const selectedFractal = fracs.data?.[selectedFractalId];
  const selectPrevFractal = useCallback(() => { if (selectedFractalId > 0)                      setSelectedFractalId(selectedFractalId - 1); }, [selectedFractalId]);
  const selectNextFractal = useCallback(() => { if (selectedFractalId < fracs.data!.length - 1) setSelectedFractalId(selectedFractalId + 1); }, [selectedFractalId, fracs.data]);
  
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key == "ArrowLeft")  selectPrevFractal();
      if (e.key == "ArrowRight") selectNextFractal();
      if (e.key == "Escape") { if (viewFull) setViewFull(false); else setViewEdit(false); }
      if (e.key == " ")  setViewFull(true);
      if (e.key == "Enter")  setViewEdit(true);
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => { document.removeEventListener('keydown', keyDownHandler); }
  }, [viewEdit, viewFull, selectPrevFractal, selectNextFractal]);

  return (
    <>
      <Head>
        <title>Fractal Sandbox</title>
        <meta name="description" content="interactive fractal generator" />
        <meta name="author" content="Szymon Ceranka" />
      </Head>
      
      <main className="bg-gray-500" onContextMenu={e => e.preventDefault()}>

        <div className="absolute right-2 top-2 hover:cursor-pointer hover:brightness-110">
          {isSignedIn && <UserButton userProfileMode="modal" afterSignOutUrl={window.location.href} appearance={{ elements: { userButtonAvatarBox: { width: 24, height: 24 }}}} />}
          {!isSignedIn && <SignInButton mode="modal">
            <span className="flex text-base rounded-full bg-slate-700 size-6 justify-center items-center"><FaUser/>
            </span></SignInButton>
          }
        </div>

        <div className={viewFull ? "size-full v-screen h-screen" : "hidden"}>
          {viewFull && selectedFractal && 
            <FractalView
              fractal={selectedFractal.form}
              color={selectedFractal.color}
              cached={false}
            />
          }
        </div>

        <div className={!viewFull && viewEdit ? "flex h-screen" : "hidden"}>
          {viewEdit && selectedFractal && 
            <FractalEditor
              size={800}
              fractal={selectedFractal.form}
              color={selectedFractal.color}
              returnCallback={() => setViewEdit(false)}
              selectPrev={selectPrevFractal}
              selectNext={selectNextFractal}
            />
          }
        </div>

        <div>
          {fracs.data &&
            <FractalBrowser 
              fractals={fracs.data.map(f => ({ form: f.form, color: f.color }))}
              onclick={fractalId => setSelectedFractalId(fractalId)}
              selected={selectedFractalId}
              selectPrev={selectPrevFractal} 
              selectNext={selectNextFractal}
              viewFull={() => setViewFull(true)}
              viewEdit={() => setViewEdit(true)}
              hidden={viewFull || viewEdit}
            />
          }
        </div>

      </main>
    </>
  );
}
