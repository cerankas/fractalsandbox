import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";
import { useEffect, useMemo, useRef, useState } from "react";
import FractalView from "~/components/FractalView";
import HorizontalOrVertical from "~/components/HorizontalOrVertical";
import FractalSelector from "~/components/FractalSelector";
import FormulaEditor from "~/components/FormulaEditor";
import { AiOutlineDelete, AiOutlineEdit, AiOutlineFullscreen, AiOutlineFullscreenExit, AiOutlineQuestionCircle } from "react-icons/ai";
import { IoCloudUploadOutline } from "react-icons/io5";
import { GrMultiple } from "react-icons/gr";

export default function Home() {
  const { isSignedIn } = useUser();
  const isInitialLoad = useRef(true);

  const fractals = api.fractal.getManyLatest.useQuery();
  const { mutate } = api.fractalMutate.create.useMutation({ onSuccess: (data) => { alert("Uploaded " + data.id); }});
  const delfrac = api.fractalMutate.delete.useMutation({ onSuccess: (data) => { alert("Deleted " + data.id); }})
  
  const [selectedFractalId, setSelectedFractalId] = useState("");
  const selectedFractal = useMemo(() => fractals.data?.find(fractal => fractal.id === selectedFractalId), [fractals.data, selectedFractalId]);
  
  enum Mode { Browse, Edit }
  const [mode, setMode] = useState(Mode.Browse);
  const [fullscreen, setFullscreen] = useState(false);

  const [form, setForm] = useState("");
  const [color, setColor] = useState("");
  
  useEffect(() => {
    if (isInitialLoad.current && fractals.data?.[0]?.id) {
      setSelectedFractalId(fractals.data[0].id);
      isInitialLoad.current = false;
    }
  }, [fractals]);

  useEffect(() => {
    if (!selectedFractal) return;
    setForm (selectedFractal.form);
    setColor(selectedFractal.color);
  }, [selectedFractal]);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (fullscreen) setFullscreen(false); }
      if (e.key === "f")  setFullscreen(!fullscreen);
      if (e.key === "e" && !fullscreen)  setMode(Mode.Edit);
      if (e.key === "b" && !fullscreen)  setMode(Mode.Browse);
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => { document.removeEventListener('keydown', keyDownHandler); }
  }, [Mode, fullscreen]);


  const modified = form !== selectedFractal?.form || color != selectedFractal?.color;
  const iconStyle = "size-6 hover:cursor-pointer m-1";
  return (
    <>
      <Head>
        <title>Fractal Sandbox</title>
        <meta name="description" content="interactive fractal generator" />
        <meta name="author" content="Szymon Ceranka" />
      </Head>
      
      <main className="bg-gray-500 h-screen v-screen" onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()}>

        {fractals.data && fullscreen && selectedFractal && 
          <div className="size-full relative">
            <div className="absolute top-2 right-2 flex flex-row">
              <AiOutlineFullscreenExit className={iconStyle} onClick={() => setFullscreen(false)} title="Exit full screen [f]"/>
            </div>
            <FractalView
              form={form}
              color={color}
              cached={false}
            />
          </div>
        }

        <div className={fullscreen ? "hidden" : ""}>
          {fractals.data && <HorizontalOrVertical>

            <div className="relative size-full">
              <div className="absolute top-0 right-0 flex flex-row">
                <AiOutlineDelete className={iconStyle} onClick={() => delfrac.mutate({id: selectedFractalId})} />
                {modified && <IoCloudUploadOutline
                  className={iconStyle + (isSignedIn ? "" : " text-gray-500 hover:cursor-default")} 
                  onClick={() => isSignedIn && mutate({form: form, color: color})} title={isSignedIn ? "Upload" : "Upload (must sign in first)"}
                />}
                <AiOutlineQuestionCircle className={iconStyle} onClick={() => {alert((form + "\n\n" + color).replaceAll(';','\n').replaceAll(',',' '))}} title="Fractal coefficients"/>
                <AiOutlineFullscreen className={iconStyle} onClick={() => setFullscreen(true)} title="Full screen [f]"/>
              </div>
              <FractalView
                form={form}
                color={color}
                cached={form === selectedFractal?.form && color === selectedFractal?.color}
              />
            </div>

            <>
              {/* Common Menu */}
              <div className="absolute top-2 right-2 flex flex-row">
                <GrMultiple className={iconStyle + (mode === Mode.Browse ? " bg-gray-300" : "")} onClick={() => setMode(Mode.Browse)} title="Browse [b]"/>
                <AiOutlineEdit className={iconStyle + (mode === Mode.Edit ? " bg-gray-300" : "")} onClick={() => setMode(Mode.Edit)} title="Edit [e]"/>
                <div className="m-1 hover:cursor-pointer hover:brightness-110">
                  {isSignedIn && <UserButton userProfileMode="modal" afterSignOutUrl={window.location.href} appearance={{ elements: { userButtonAvatarBox: { width: 24, height: 24 }}}} />}
                  {!isSignedIn && <SignInButton mode="modal">
                    <span className="flex text-base rounded-full bg-gray-500 size-6 justify-center items-center"><FaUser title="Sign in"/>
                    </span></SignInButton>
                  }
                </div>
              </div>

              {mode===Mode.Edit && selectedFractal && 
                <FormulaEditor
                  form={selectedFractal.form}
                  changeCallback={setForm}
                />
              }

              <div className={`size-full ${mode!=Mode.Browse ? "hidden" : ""}`}>
                <FractalSelector 
                  fractals={fractals.data} 
                  onclick={fractalId => setSelectedFractalId(fractalId)} 
                  selected={selectedFractalId}
                />
              </div>
            </>

          </HorizontalOrVertical>}
        </div>

      </main>
    </>
  );
}
