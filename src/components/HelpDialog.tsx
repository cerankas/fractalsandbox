'use client';
import { IoCloseCircleOutline, IoCloudUploadOutline, IoColorPaletteOutline, IoSettingsOutline } from "react-icons/io5";
import { iconStyle } from "./browserUtils";
import ModalPanel from "./ModalPanel";
import { RiGalleryView2 } from "react-icons/ri";
import { IconType } from "react-icons/lib";
import { TbTriangleMinus, TbTrianglePlus, TbTriangles, TbUsers } from "react-icons/tb";
import { LuCircleHelp } from "react-icons/lu";
import { FaUser } from "react-icons/fa6";
import { AiOutlineFullscreen, AiOutlineFullscreenExit, AiOutlinePicture } from "react-icons/ai";
import { LiaPhotoVideoSolid } from "react-icons/lia";
import { BiRedo, BiUndo } from "react-icons/bi";
import { RxSlider } from "react-icons/rx";
import { TiArrowLeft, TiArrowRight } from "react-icons/ti";
import { MdPlayArrow } from "react-icons/md";

function IconHelp(props: {icon: IconType, description: string}) {
  return <div className="flex flex-row">
    <div>

    <props.icon className={iconStyle}/>
    </div>
    <div className="mt-auto mb-auto">{props.description}</div>
  </div>
}

export default function HelpDialog(props: {close: () => void}) {

  return <ModalPanel style="fixed inset-[8vmin] flex flex-col overflow-y-scroll" close={props.close}>

    <IoCloseCircleOutline
      className={iconStyle + " absolute right-0 top-0"}
      onClick={props.close}
    />

    <div><b>Help</b></div>
    <div>This is Fractal Sandbox, a web app for exploring and creating <a href="https://en.wikipedia.org/wiki/Iterated_function_system" target="_blank">IFS</a> <a href="https://en.wikipedia.org/wiki/Fractal" target="_blank">fractals</a>.</div>
    {/* <div>(App build {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.slice(0,10)})</div> */}
    <br/>
    
    <div><b>Main menu</b></div>
    <IconHelp icon={RiGalleryView2} description="Fractal browser"/>
    <IconHelp icon={TbTriangles} description="Fractal editor"/>
    <IconHelp icon={IoColorPaletteOutline} description="Color palette editor [c]"/>
    <IconHelp icon={IoSettingsOutline} description="Settings"/>
    <IconHelp icon={LuCircleHelp} description="Help"/>
    <IconHelp icon={FaUser} description="Sign in"/>
    <br/>

    <div><b>Fractal view</b></div>
    <IconHelp icon={IoCloudUploadOutline} description="Upload fractal to the cloud"/>
    <IconHelp icon={AiOutlinePicture} description="Save image [s]. Right-click to specify resolution and quality."/>
    <IconHelp icon={LiaPhotoVideoSolid} description="Preview video (morphing between the current fractal and the last displayed fractal). Right-click to specify resolution, quality, duration and frames per second, then render the video and save to mp4 file."/>
    <IconHelp icon={BiUndo} description="Undo last operation on the fractal [z]"/>
    <IconHelp icon={BiRedo} description="Redo last operation on the fractal [y]"/>
    <IconHelp icon={AiOutlineFullscreen} description="Show fractal on full screen [f]"/>
    <br/>
    
    <div><b>Fractal browser</b></div>
    <div>Click a tile to load the fractal to the main view</div>
    <div>Middle-click a tile to load only the fractal shape, keeping the current color palette</div>
    <div>Right-click a tile to load only the color palette, keeping the current fractal shape</div>
    <IconHelp icon={RxSlider} description="Adjust fractal tile size"/>
    <IconHelp icon={TbUsers} description="Filter displayed fractal tiles by author"/>
    <br/>

    <div><b>Fractal editor</b></div>
    <div>The triangles represent parts of the fractal. Drag the dots at triangle vertices to manipulate the fractal shape.</div>
    <div>Each central dot allows unconstrained movement, and two auxiliary dots allow movement constrained to rotation/scale or x/y axis.</div>
    <IconHelp icon={TbTrianglePlus} description="Add triangle [Insert]"/>
    <IconHelp icon={TbTriangleMinus} description="Remove triangle [Delete]"/>
    <br/>
    
    <div><b>Color palette editor</b> [c]</div>
    <div>The palette defines the color assigned to any pixel of the image, depending on fractal intensity level at that point.</div>
    <div>The left end of the palette is the background color, and the right end is the color of the most intense parts of the fractal.</div>
    <div>Click an empty space on the palette to create a new control point.</div>
    <div>Drag a control point to move on the scale of fractal intensity.</div>
    <div>Click a control point to adjust color.</div>
    <div>Middle-click a control point to clone (copy and move).</div>
    <div>Right-click a control point to remove.</div>
    <br/>

    <div><b>Full-screen view</b> [f]</div>
    <IconHelp icon={TiArrowLeft} description="Go to previous fractal [Left]"/>
    <IconHelp icon={MdPlayArrow} description="Start slideshow"/>
    <IconHelp icon={TiArrowRight} description="Go to next fractal [Right]"/>
    <IconHelp icon={AiOutlineFullscreenExit} description="Exit full screen [f]"/>
    <br/>

    <div><b>General</b></div>
    <div>Drag panel separator to resize panels.</div>
    <div>Right-click a separator to restore 1:1 division ratio.</div>
    <br/>

    <div><b>About</b></div>
    <div>Build {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.slice(0,10)}. <a href="https://github.com/cerankas/fractalsandbox" target="_blank">Source code on github</a>.</div>

 </ModalPanel>;
}