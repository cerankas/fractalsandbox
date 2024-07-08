'use client';
import Head from "next/head";
import { api } from "~/utils/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { FaUser } from "react-icons/fa6";
import { type ComponentType, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import FractalView from "~/components/FractalView";
import FractalSelector from "~/components/FractalSelector";
import FormulaEditor from "~/components/FormulaEditor";
import { AiOutlineFullscreen, AiOutlineFullscreenExit, AiOutlineQuestionCircle } from "react-icons/ai";
import { IoCloudUploadOutline } from "react-icons/io5";
import { MdOutlineDeleteForever } from "react-icons/md";
import { PiLayout } from "react-icons/pi";
import { HiOutlineViewColumns } from "react-icons/hi2";
import { useQueryClient } from "@tanstack/react-query";
import { type ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import useHorizontal from "~/components/useHorizontal";
import useLocalStorage from "~/components/useLocalStorage";
import dynamic from "next/dynamic";

const withNoSSR = <P extends object>(Component: ComponentType<P>) => dynamic<P>(() => Promise.resolve(Component), { ssr: false });

function Home() {
  const { isSignedIn, user } = useUser();
  const isInitialLoad = useRef(true);

  const queryClient = useQueryClient();
  const fractals = api.fractal.findMany.useQuery();
  const getManyQueryKey = [["fractal","findMany"],{"type":"query"}];
  
  const { mutate: uploadFractal } = api.fractalMutate.create.useMutation({
    onSuccess: (newFractal) => {
      queryClient.setQueryData(
        getManyQueryKey,
        (oldData: typeof fractals.data) => {
          return oldData ? [newFractal, ...oldData] : [newFractal];
        }
      );
      setSelectedFractalId(newFractal.id);
      console.log("Uploaded " + newFractal.id);
    },
  });
  
  const { mutate: deleteFractal } = api.fractalMutate.delete.useMutation({
    onSuccess: (deletedFractal) => {
      if (fractals.data!.length > 1) {
        const deletedIndex = fractals.data!.findIndex((f) => f.id == deletedFractal.id);
        const delta = deletedIndex < fractals.data!.length - 1 ? 1 : -1;
        setSelectedFractalId(fractals.data![deletedIndex + delta]!.id);
      }
      queryClient.setQueryData(
        getManyQueryKey,
        (oldData: typeof fractals.data) => {
          return oldData ? oldData.filter(fractal => fractal.id !== deletedFractal.id) : [];
        }
      );
      console.log("Deleted " + deletedFractal.id);
    },
  });
  
  const [selectedFractalId, setSelectedFractalId] = useState(0);
  const selectedFractal = useMemo(() => fractals.data?.find(fractal => fractal.id === selectedFractalId), [fractals.data, selectedFractalId]);
  
  const [fullscreen, setFullscreen] = useState(false);
  const [fullBefore, setFullBefore] = useState(false);

  const [form, setForm] = useState("");
  const [color, setColor] = useState("");

  const isHorizontal = useHorizontal();
  const primaryDirection = isHorizontal ? 'horizontal' : 'vertical';
  const secondaryDirection = isHorizontal ? 'vertical' : 'horizontal';

  const [layout, setLayout] = useLocalStorage('layout', 'L2');

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
      if (e.key === "f")  { if (fullscreen) exitFullscreen(); else enterFullscreen(); }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => { document.removeEventListener('keydown', keyDownHandler); }
  }, [fullscreen, enterFullscreen, exitFullscreen]);


  const modified = form !== selectedFractal?.form || color != selectedFractal?.color;
  const iconStyle = "size-6 hover:cursor-pointer m-1";

  const [C21, setC21] = useState<number[]>([]);
  const [C22, setC22] = useState<number[]>([]);
  const [C3, setC3] = useState<number[]>([]);

  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [isHorizontal, C21, C22, C3])


  const fPRef = useRef<ImperativePanelHandle>(null);
  const bPRef = useRef<ImperativePanelHandle>(null);
  const ePRef = useRef<ImperativePanelHandle>(null);
  const bePRef = useRef<ImperativePanelHandle>(null);

  const bP = !bPRef.current?.isCollapsed();
  const eP = !ePRef.current?.isCollapsed();
  const beP = !bePRef.current?.isCollapsed();
  
  const L2H = layout === 'L2' && isHorizontal;
  const L2V = layout === 'L2' && !isHorizontal;
  const L3H = layout === 'L3' && isHorizontal;
  const L3V = layout === 'L3' && !isHorizontal;

  const fPMenu = (L2H && !beP) || (L3H && !eP) || L2V || (L3V &&  !bP);
  const bPMenu = bP && ((L2H && beP) || L3V);
  const ePMenu = eP && ((L2H && beP && !bP) || L3H);

  const commonMenu = (
    <div className="flex flex-row">
      <div
        className={iconStyle}
        onClick={() => setLayout(layout === 'L2' ? 'L3' : 'L2')}
        title="Toggle layout"
      >
        {layout === 'L2' ? <HiOutlineViewColumns/> : <PiLayout/>}
      </div>
      <div className="m-1 hover:cursor-pointer hover:brightness-110">
        {isSignedIn && <div className="size-6"><UserButton 
            userProfileMode="modal" 
            afterSignOutUrl={window.location.href} 
            appearance={{ elements: { userButtonAvatarBox: { width: 24, height: 24 }}}} 
        /></div>}
        {!isSignedIn && <SignInButton mode="modal">
          <span className="flex text-base rounded-full bg-gray-500 size-6 justify-center items-center"> <FaUser title="Sign in"/> </span>
        </SignInButton>}
      </div>
    </div>
  );


  const fractalPanel = (<>{fractals.data && selectedFractal &&
    <Panel ref={fPRef} id="f" order={2} minSize={10} className="relative size-full">
      <div className="absolute top-0 right-0 flex flex-row">
        {isSignedIn && !modified && selectedFractal.authorId === user.id && <MdOutlineDeleteForever
          className={iconStyle}
          onClick={() => deleteFractal({id: selectedFractalId})} 
          title="Delete"
        />}
        {modified && <IoCloudUploadOutline
          className={iconStyle + (isSignedIn ? "" : " text-gray-500")} 
          onClick={() => isSignedIn && uploadFractal({form: form, color: color})} 
          title={isSignedIn ? "Upload" : "Upload (must sign in first)"}
        />}
        <AiOutlineQuestionCircle 
          className={iconStyle} 
          onClick={() => {alert((form + "\n\n" + color).replaceAll(';','\n').replaceAll(',',' '))}} 
          title="Fractal coefficients"
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
        cached={form === selectedFractal?.form && color === selectedFractal?.color}
      />
    </Panel>
  }</>);

  const browserPanel = (<>{fractals.data && selectedFractal &&
    <Panel ref={bPRef} id="b" order={1} collapsible={true} minSize={3.5} className="size-full">
      <FractalSelector 
        fractals={fractals.data} 
        onclick={fractalId => setSelectedFractalId(fractalId)} 
        selected={selectedFractalId}
        menu={bPMenu && commonMenu}
        refreshCallback={() => { 
          isInitialLoad.current = true; 
          queryClient.setQueryData(getManyQueryKey, () => []); 
          void queryClient.invalidateQueries({queryKey: getManyQueryKey});
        }}
      />
    </Panel>
  }</>);

  const editorPanel = (<>{fractals.data && selectedFractal &&
    <Panel ref={ePRef} id="e" order={3} collapsible={true} minSize={3.5}>
      <FormulaEditor
        form={selectedFractal.form}
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

        {fractals.data && fullscreen && selectedFractal && 
          <div className="size-full relative">
            <div className="absolute top-0 right-0 flex flex-row">
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

        {layout==='L2' &&
          <PanelGroup className={(fullscreen ? "hidden" : "") + " p-2"} direction={primaryDirection} id="L21" onLayout={setC21} autoSaveId='L21'>
            {fractalPanel}
            <PanelResizeHandle className={beP ? (isHorizontal ? 'w-2' : 'h-2') : ''} />
            <Panel ref={bePRef} id="be" order={3} collapsible={true} minSize={3.5}>
              <PanelGroup direction={secondaryDirection} id="L22" onLayout={setC22} autoSaveId='L22'>
                {browserPanel}
                <PanelResizeHandle className={bP && eP ? (!isHorizontal ? 'w-2' : 'h-2') : ''} />
                {editorPanel}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        }

        {layout==='L3' &&
          <PanelGroup className={(fullscreen ? "hidden" : "") + " p-2"} direction={primaryDirection} id="L3" onLayout={setC3} autoSaveId='L3'>
            {browserPanel}
            <PanelResizeHandle className={!bP ? '' : isHorizontal ? 'w-2' : 'h-2'} />
            {fractalPanel}
            <PanelResizeHandle className={!eP ? '' : isHorizontal ? 'w-2' : 'h-2'} />
            {editorPanel}
          </PanelGroup>
        }

      </main>
    </>
  );
}

export default withNoSSR(Home);