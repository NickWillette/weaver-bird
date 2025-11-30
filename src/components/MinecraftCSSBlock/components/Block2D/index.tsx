import type { Block2DProps } from "./types";
import s from "../../styles.module.scss";

export const Block2D = ({ textureUrl, alt, size, onError }: Block2DProps) => {
    return (
        <div className={s.blockContainer} style={{ width: size, height: size }}>
            <img
                src={textureUrl}
                alt={alt}
                className={s.fallbackTexture}
                onError={() => {
                    onError?.();
                }}
                draggable={false}
            />
        </div>
    );
};
