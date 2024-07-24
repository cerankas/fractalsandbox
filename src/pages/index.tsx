'use client';
import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";
import { type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from "react";
import FractalView from "~/components/FractalView";
import FractalSelector from "~/components/FractalSelector";
import FormulaEditor from "~/components/FormulaEditor";
import { AiOutlineFullscreen, AiOutlineFullscreenExit, AiOutlinePicture } from "react-icons/ai";
import { IoCloudUploadOutline, IoColorPaletteOutline } from "react-icons/io5";
import { MdOutlineDeleteForever } from "react-icons/md";
import { BiUndo, BiRedo } from "react-icons/bi";
import { useQueryClient } from "@tanstack/react-query";
import { type ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { type Fractal } from "@prisma/client";
import { useHorizontal, useLocalStorage, iconStyle } from "~/components/browserUtils"
import dynamic from "next/dynamic";
import { oppositeBackgroundColor } from "~/math/palette";
import FractalHistory from "~/logic/history";
import PaletteEditor from "~/components/PaletteEditor";

/*
  Todo:
  - collapse/expand controls
  - color editor as collapsible panel
  
  - improve image cache
  - progressive loading and db caching
  
  - import / export / edit textual definition
  - video: animate triangles and parameters along curves
  - explorer
  - randomization
  - only draw selected parts of the fractal (e.g. last formula == (and the formula before last ==))
  - layers
*/

const withNoSSR = <P extends object>(Component: ComponentType<P>) => dynamic<P>(() => Promise.resolve(Component), { ssr: false });

export default withNoSSR(function Home() {
  const { isSignedIn, user } = useUser();

  const queryClient = useQueryClient();
  const fractals = api.fractal.findMany.useQuery();
  const getManyQueryKey = useMemo(() => [["fractal","findMany"],{"type":"query"}], []);
  
  const { mutate: uploadFractal } = api.fractalMutate.create.useMutation({
    onSuccess: (newFractal) => {
      queryClient.setQueryData(
        getManyQueryKey,
        (oldData: typeof fractals.data) => {
          return oldData ? [newFractal, ...oldData] : [newFractal];
        }
      );
      setSelectedFractal(newFractal);
      console.log("Uploaded " + newFractal.id);
    },
  });
  
  const { mutate: deleteFractal } = api.fractalMutate.delete.useMutation({
    onSuccess: (deletedFractal) => {
      setSelectedFractal(null);
      queryClient.setQueryData(
        getManyQueryKey,
        (oldData: typeof fractals.data) => {
          return oldData ? oldData.filter(fractal => fractal.id !== deletedFractal.id) : [];
        }
      );
      console.log("Deleted " + deletedFractal.id);
    },
  });
  
  const [selectedFractal, setSelectedFractal] = useState<Fractal | null>(null);
  
  const [fullscreen, setFullscreen] = useState(false);
  const [fullBefore, setFullBefore] = useState(false);

  const [form, setForm] = useLocalStorage("form", ".83364,.25302,-.29969,.84318,.23402,.22814,1;.61536,-.144,-.10965,-.41233,-.19863,-.47176,1");
  const [color, setColor] = useLocalStorage("color", "0,FFFFFF;1,000000");

  const fractalHistory = useMemo(() => new FractalHistory((item) => { setForm(item.form); setColor(item.color); }), [setForm, setColor]);
  const storeToHistory = useCallback(() => fractalHistory.store({form: form, color: color}), [fractalHistory, form, color]);

  useEffect(() => {
    window.addEventListener('mouseup', storeToHistory)
    return () => window.removeEventListener('mouseup', storeToHistory)
  }, [storeToHistory]);

  useEffect(() => {
    const timeout = setTimeout(storeToHistory, 1000);
    return () => clearTimeout(timeout);
  }, [storeToHistory]);

  const [showPalette, setShowPalette] = useState(false);
  const toggleShowPalette = useCallback(() => setShowPalette(!showPalette), [showPalette])

  const isHorizontal = useHorizontal();
  const primaryDirection = isHorizontal ? 'horizontal' : 'vertical';
  const secondaryDirection = isHorizontal ? 'vertical' : 'horizontal';

  const enterFullscreen = useCallback(() => {
    const isFull = document.fullscreenElement !== null;
    setFullBefore(isFull);
    setFullscreen(true);
    if (!isFull) void document.body.requestFullscreen({navigationUI: 'hide'});
  }, []);
  
  const exitFullscreen = useCallback(() => {
    setFullscreen(false);
    if (!fullBefore && document.fullscreenElement != null) void document.exitFullscreen();
  }, [fullBefore]);

  useEffect(() => {
    const fullscreenObserver = () => setFullscreen(document.fullscreenElement !== null);
    window.addEventListener('fullscreenchange', fullscreenObserver);
    return () => window.removeEventListener('fullscreenchange', fullscreenObserver);
  }, []);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "f")  if (fullscreen) exitFullscreen(); else enterFullscreen();
      if (e.key === "c") toggleShowPalette();
      if (e.key === "z" && e.ctrlKey) fractalHistory.back();
      if (e.key === "y" && e.ctrlKey) fractalHistory.forward(); 
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => { document.removeEventListener('keydown', keyDownHandler); }
  }, [fullscreen, enterFullscreen, exitFullscreen, fractalHistory, toggleShowPalette]);

  const modified = form !== selectedFractal?.form || color != selectedFractal?.color;

  const [fractalCanvas, setFractalCanvas] = useState<HTMLCanvasElement | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const downloadImage = useCallback(() => {
    downloadRef.current!.href = fractalCanvas!.toDataURL('image/png');
    downloadRef.current!.click();
  }, [fractalCanvas])

  const fPRef = useRef<ImperativePanelHandle>(null);
  const bPRef = useRef<ImperativePanelHandle>(null);
  const ePRef = useRef<ImperativePanelHandle>(null);
  const bePRef = useRef<ImperativePanelHandle>(null);

  const [bP, setBP] = useState(!bPRef.current?.isCollapsed());
  const [eP, setEP] = useState(!ePRef.current?.isCollapsed());
  const [beP, setBEP] = useState(!bePRef.current?.isCollapsed());
  
  const fPMenu = !isHorizontal || !beP;
  const bPMenu = !fPMenu && bP;
  const ePMenu = !fPMenu && !bPMenu;

  const commonMenu = useMemo(() =>
    <div className="flex flex-row">
      <IoColorPaletteOutline 
        className={iconStyle}
        onClick={toggleShowPalette}
        title="Colors [c]"
      />
      <div className="m-1 hover:cursor-pointer">
        {isSignedIn && <div className="size-6">
          <UserButton userProfileMode="modal" appearance={{ elements: { userButtonAvatarBox: { width: 24, height: 24 }}}} />
        </div>}
        {!isSignedIn && <SignInButton mode="modal">
          <span className="flex text-base rounded-full bg-gray-500 size-6 justify-center items-center"> <FaUser title="Sign in"/> </span>
        </SignInButton>}
      </div>
    </div>
  , [isSignedIn, toggleShowPalette]);

  const fractalPanel = (<>{
    <Panel ref={fPRef} minSize={10} className="relative size-full">
      <div className="absolute top-0 right-0 flex flex-row" style={{color: oppositeBackgroundColor(color)}}>
        {isSignedIn && !modified && selectedFractal.authorId === user.id && <MdOutlineDeleteForever
          className={iconStyle}
          onClick={() => deleteFractal({id: selectedFractal.id})} 
          title="Delete"
        />}
        {modified && <IoCloudUploadOutline
          className={iconStyle + (isSignedIn ? "" : " text-gray-500")} 
          onClick={() => isSignedIn && uploadFractal({form: form, color: color})} 
          title={isSignedIn ? "Upload fractal" : "Upload fractal (must sign in first)"}
        />}
        <AiOutlinePicture
          className={iconStyle} 
          onClick={downloadImage}
          title="Save image"
        />
        <BiUndo
          className={iconStyle} 
          onClick={() => fractalHistory.back()}
          title="Undo [ctrl-z]"
        />
        <BiRedo
          className={iconStyle} 
          onClick={() => fractalHistory.forward()}
          title="Redo [ctrl-y]"
        />
        <AiOutlineFullscreen 
          className={iconStyle} 
          onClick={() => enterFullscreen()} 
          title="Full screen [f]"
        />
        {fPMenu && commonMenu}
      </div>
      <FractalView
        form={form}
        color={color}
        cached={modified}
        updateCanvasRef={(canvas) => setFractalCanvas(canvas)}
      />
    </Panel>
  }</>);

  const browserPanel = useMemo(() => <>{
    <Panel ref={bPRef} collapsible={true} onCollapse={() => setBP(false)} onExpand={() => setBP(true)} minSize={3.5} className="size-full">
      <FractalSelector 
        fractals={fractals.data ?? []} 
        onmousedown={(button, fractal) => {
          setSelectedFractal(fractal);
          if (button == 0 || button == 1) setForm(fractal.form);
          if (button == 0 || button == 2) setColor(fractal.color);
        }} 
        selected={selectedFractal?.id ?? 0}
        menu={bPMenu && commonMenu}
      />
    </Panel>
  }</>, [bPMenu, commonMenu, fractals.data, selectedFractal, setForm, setColor]);

  const editorPanel = (<>{
    <Panel ref={ePRef} collapsible={true} onCollapse={() => setEP(false)} onExpand={() => setEP(true)} minSize={3.5}>
      <FormulaEditor
        form={form}
        changeCallback={setForm}
        menu={ePMenu && commonMenu}
      />
    </Panel>
  }</>);

  return (
    <>
      <Head>
        <title>Fractal Sandbox</title>
        <meta name="description" content="interactive fractal generator" />
        <meta name="author" content="Szymon Ceranka" />
      </Head>
      
      <main className="bg-gray-500 h-screen v-screen" onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()}>

        <a ref={downloadRef} download="fractalsandbox.png" href="" style={{display: 'none'}}></a>

        {fullscreen &&  
          <div className="size-full relative">
            <div className="absolute top-0 right-0 flex flex-row" style={{color: oppositeBackgroundColor(color)}}>
              <AiOutlineFullscreenExit 
                className={iconStyle} 
                onClick={() => exitFullscreen()} 
                title="Exit full screen [f]"
              />
            </div>

            <FractalView
              form={form}
              color={color}
              cached={false}
            />
          </div>
        }

        <PanelGroup className={(fullscreen ? "hidden" : "") + " p-2"} direction={primaryDirection} autoSaveId="L1">
          {!fullscreen && fractalPanel}
          <PanelResizeHandle className={beP ? (isHorizontal ? 'w-2' : 'h-2') : ''} onContextMenu={() => bePRef.current!.resize(50)}/>
          <Panel ref={bePRef} collapsible={true} onCollapse={() => setBEP(false)} onExpand={() => setBEP(true)} minSize={3.5}>
            <PanelGroup direction={secondaryDirection} autoSaveId="L2">
              {browserPanel}
              <PanelResizeHandle className={bP && eP ? (!isHorizontal ? 'w-2' : 'h-2') : ''} onContextMenu={() => bPRef.current!.resize(50)}/>
              {editorPanel}
              {showPalette && <PaletteEditor color={color} changeCallback={setColor}/>}
            </PanelGroup>
          </Panel>
        </PanelGroup>

      </main>
    </>
  );
});