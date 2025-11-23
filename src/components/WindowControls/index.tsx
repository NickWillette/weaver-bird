import { getCurrentWindow } from "@tauri-apps/api/window";
import s from "./WindowControls.module.scss";

const appWindow = getCurrentWindow();

export default function WindowControls() {
  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.toggleMaximize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  return (
    <div className={s.windowControls}>
      <button
        className={`${s.windowButton} ${s.close}`}
        onClick={handleClose}
        aria-label="Close window"
        title="Close"
      />
      <button
        className={`${s.windowButton} ${s.minimize}`}
        onClick={handleMinimize}
        aria-label="Minimize window"
        title="Minimize"
      />
      <button
        className={`${s.windowButton} ${s.maximize}`}
        onClick={handleMaximize}
        aria-label="Maximize window"
        title="Maximize"
      />
    </div>
  );
}
