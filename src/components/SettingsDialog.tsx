'use client';
import { IoCloseCircleOutline } from "react-icons/io5";
import { iconStyle } from "./browserUtils";
import FractalRenderer from "~/math/fractalRenderer";
import ModalPanel from "./ModalPanel";
import { useEffect, useState } from "react";
import IndexedDBManager from "~/logic/cache";
import { thumbnailCache } from "./FractalTile";

export default function SettingsDialog(props: {slideShowPeriod: number, setSlideShowPeriod: (interval: number) => void, close: () => void}) {
  const buttonStyle = "border w-40 rounded-sm m-2";
  const [tileCacheSize, setTileCacheSize] = useState('...');
  const [tileCacheCnt, setTileCacheCnt] = useState('...');
  const [imageCacheSize, setImageCacheSize] = useState('...');
  const [imageCacheCnt, setImageCacheCnt] = useState('...');

  useEffect(() => {
    thumbnailCache.getUsage()
    .then(usage => { setTileCacheSize((usage.size / 1e6).toFixed(1)); setTileCacheCnt(usage.cnt.toString()); })
    .catch(err => console.error("Error estimating DB size:", err));
  }, []);

  useEffect(() => {
    FractalRenderer.imageCache.getUsage()
    .then(usage => { setImageCacheSize((usage.size / 1e6).toFixed(1)); setImageCacheCnt(usage.cnt.toString()); })
    .catch(err => console.error("Error estimating DB size:", err));
  }, []);

  return <ModalPanel style="fixed inset-24 flex flex-col" close={props.close}>
    <IoCloseCircleOutline
      className={iconStyle + " absolute right-0 top-0"}
      onClick={props.close}
    />
    Settings (build {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP?.slice(0,10)})
    <label>
      Slideshow period (in seconds):
      <input
        type="number" min={1}
        className={buttonStyle}
        style={{width:60}}
        value={props.slideShowPeriod / 1000}
        onChange={(e) => props.setSlideShowPeriod(parseFloat(e.target.value) * 1000)}
        />
    </label>
    <div className="flex flex-col">
      <div>

      <input
        type="button"
        value="Clear fractal cache"
        className={buttonStyle}
        onClick={() => { localStorage.removeItem("fractalCache"); location.reload(); }}
        />
      </div>
      <div>
        <input
          type="button"
          value="Clear tile cache"
          className={buttonStyle}
          onClick={() => void thumbnailCache.clearStore().then(() => location.reload())}
        />
        Cached {tileCacheCnt} tiles using {tileCacheSize} MB
      </div>
      <div>
        <input
          type="button"
          value="Clear image cache"
          className={buttonStyle}
          onClick={() => void FractalRenderer.imageCache.clearStore().then(() => location.reload())}
        />
        Cached {imageCacheCnt} images using {imageCacheSize} MB
      </div>
    </div>
  </ModalPanel>;
}