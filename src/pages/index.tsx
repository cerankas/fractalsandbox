'use client';
import Head from "next/head";
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
import { RiGalleryView2 } from "react-icons/ri";
import { TbTriangles } from "react-icons/tb";
import { type ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { type Fractal } from "@prisma/client";
import { useHorizontal, useLocalStorage, iconStyle } from "~/components/browserUtils"
import dynamic from "next/dynamic";
import { oppositeBackgroundColor } from "~/math/palette";
import FractalHistory from "~/logic/history";
import PaletteEditor from "~/components/PaletteEditor";
import useFractalProvider from "~/logic/fractalProvider";

/*
  Todo:
  - improve image cache
  - configuration dialog with cache options and build date
  - purge image cache on browser/tab close: only keep images of fractals present in db cache
  - improve FormulaEditor selection and add vertex action icons
  - FormulaEditor value editor (x/y offset/scale/rotation, intensity)
  - FormulaEditor group actions / whole fractal rotation
  - FormulaEditor triangle size/offset normalization
  - improve fractalRenderer priority control
  - slideshow
  - go to prev/next in fullscreen
  - autohide icons in fullscreen
  - set render quality
  - image download with options: image size, render quality
  
  - import / export / edit textual definition
  - video: animate triangles and parameters along curves
  - explorer
  - randomization
  - only draw selected parts of the fractal (e.g. last formula == (and the formula before last ==))
  - layers
*/

const withNoSSR = <P extends object>(Component: ComponentType<P>) => dynamic<P>(() => Promise.resolve(Component), { ssr: false });

export default withNoSSR(function Home() {
  useEffect(() => console.log('Build timestamp: ' + process.env.NEXT_PUBLIC_BUILD_TIMESTAMP), []);

  const { isSignedIn, user } = useUser();

  const [selectedFractal, setSelectedFractal] = useState<Fractal | null>(null);
  
  const { fractals, loadMore, uploadFractal, deleteFractal } = useFractalProvider(setSelectedFractal);
  
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

  const browserPanelRef = useRef<ImperativePanelHandle>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);
  const browserEditorPanelRef = useRef<ImperativePanelHandle>(null);

  const [browserPanelVisible, setBrowserPanelVisible] = useState(!browserPanelRef.current?.isCollapsed());
  const [editorPanelVisible, setEditorPanelVisible] = useState(!editorPanelRef.current?.isCollapsed());
  const [browserEditorPanelVisible, setBrowserEditorPanelVisible] = useState(!browserEditorPanelRef.current?.isCollapsed());
  
  const commonMenuInFractalPanel = !isHorizontal || !browserEditorPanelVisible;
  const commonMenuInBrowserPanel = !commonMenuInFractalPanel && browserPanelVisible;
  const commonMenuInEditorPanel = !commonMenuInFractalPanel && !commonMenuInBrowserPanel;

  const bPcollapse = useCallback(() => { editorPanelRef.current!.expand(); browserPanelRef.current!.collapse(); }, [])
  const ePcollapse = useCallback(() => { browserPanelRef.current!.expand(); editorPanelRef.current!.collapse(); }, [])

  const commonMenu = useMemo(() =>
    <div className="flex flex-row">
      {browserEditorPanelVisible && <>
        <RiGalleryView2
          className={iconStyle}
          style={{backgroundColor: browserPanelVisible ? 'lightgray' : 'transparent', borderRadius: 2}}
          onClick={() => browserPanelVisible ? bPcollapse() : browserPanelRef.current!.expand()}
          title={`${browserPanelVisible ? 'Hide' : 'Show'} browser`}
        />
        <TbTriangles
          className={iconStyle}
          style={{backgroundColor: editorPanelVisible ? 'lightgray' : 'transparent', borderRadius: 2}}
          onClick={() => editorPanelVisible ? ePcollapse() : editorPanelRef.current!.expand()}
          title={`${editorPanelVisible ? 'Hide' : 'Show'} editor`}
        />
      </>}
      <IoColorPaletteOutline 
        className={iconStyle}
        style={{backgroundColor: showPalette ? 'lightgray' : 'transparent', borderRadius: 2}}
        onClick={toggleShowPalette}
        title={`${showPalette ? 'Hide' : 'Show'} color palette [c]`}
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
  , [browserEditorPanelVisible, browserPanelVisible, editorPanelVisible, toggleShowPalette, showPalette, isSignedIn, bPcollapse, ePcollapse]);

  const fractalPanelContent = <>
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
      {commonMenuInFractalPanel && commonMenu}
    </div>
    <FractalView
      form={form}
      color={color}
      updateCanvasRef={(canvas) => setFractalCanvas(canvas)}
    />
  </>;

  const browserPanelContent = useMemo(() => <>
    <FractalSelector 
      fractals={fractals} 
      loadMore={loadMore}
      onmousedown={(button, fractal) => {
        setSelectedFractal(fractal);
        if (button == 0 || button == 1) setForm(fractal.form);
        if (button == 0 || button == 2) setColor(fractal.color);
      }} 
      selected={selectedFractal?.id ?? 0}
      menu={commonMenuInBrowserPanel && commonMenu}
    />
  </>, [fractals, loadMore, selectedFractal?.id, commonMenuInBrowserPanel, commonMenu, setForm, setColor]);

  const editorPanelContent = <>
    <FormulaEditor
      form={form}
      changeCallback={setForm}
      menu={commonMenuInEditorPanel && commonMenu}
    />
  </>;

  const pointerDownHandler = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'IMG') return;
    if (typeof t.className === 'string' && t.className.startsWith('react-colorful')) return;
    e.preventDefault();
  }, []);

  return (
    <>
      <Head>
        <title>Fractal Sandbox</title>
        <meta name="description" content="interactive fractal generator" />
        <meta name="author" content="Szymon Ceranka" />
      </Head>
      
      <main className="bg-gray-500 h-screen v-screen" onContextMenu={e => e.preventDefault()} onPointerDown={pointerDownHandler}>

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
            />
          </div>
        }

        <PanelGroup className={(fullscreen ? "hidden" : "") + " p-2"} direction={primaryDirection} autoSaveId="L1">
          
          <Panel minSize={10} className="relative size-full">
            {!fullscreen && fractalPanelContent}
          </Panel>

          <PanelResizeHandle 
            className={browserEditorPanelVisible ? (isHorizontal ? 'w-2' : 'h-2') : ''} 
            onContextMenu={() => browserEditorPanelRef.current!.resize(50)}
          />
          
          <Panel 
            ref={browserEditorPanelRef} 
            collapsible={true} 
            onCollapse={() => setBrowserEditorPanelVisible(false)} 
            onExpand={() => setBrowserEditorPanelVisible(true)} 
            minSize={3.5}
          >
            <PanelGroup direction={secondaryDirection} autoSaveId="L2">
              
              <Panel 
                ref={browserPanelRef} 
                collapsible={true} 
                onCollapse={() => setBrowserPanelVisible(false)} 
                onExpand={() => setBrowserPanelVisible(true)} 
                minSize={3.5} 
                className="size-full"
              >
                {browserPanelContent}
              </Panel>
              
              <PanelResizeHandle 
                className={browserPanelVisible && editorPanelVisible ? (!isHorizontal ? 'w-2' : 'h-2') : ''} 
                onContextMenu={() => browserPanelRef.current!.resize(50)}
              />
              
              <Panel 
                ref={editorPanelRef} 
                collapsible={true} 
                onCollapse={() => setEditorPanelVisible(false)} 
                onExpand={() => setEditorPanelVisible(true)} 
                minSize={3.5}
              >
                {editorPanelContent}
              </Panel>
              
              {showPalette && <PaletteEditor color={color} changeCallback={setColor}/>}
            
            </PanelGroup>
          </Panel>
        </PanelGroup>

      </main>
    </>
  );
});