import s from "./styles.module.scss";

interface ProgressPayload {
  current: number;
  total: number;
}

interface VanillaTextureProgressProps {
  progress: ProgressPayload | null;
  isVisible: boolean;
}

export default function VanillaTextureProgress({
  progress,
  isVisible,
}: VanillaTextureProgressProps) {
  if (!isVisible || !progress) {
    return null;
  }

  const percentage = Math.round((progress.current / progress.total) * 100);
  const isComplete = progress.current >= progress.total;

  return (
    <div className={s.root}>
      <div className={s.container}>
        <div className={s.title}>
          {isComplete
            ? "Vanilla textures cached"
            : "Caching vanilla textures..."}
        </div>
        <div className={s.progressBar}>
          <div
            className={s.progressFill}
            style={{ width: `${percentage}%` }}
            data-complete={isComplete}
          />
        </div>
      </div>
    </div>
  );
}
