import { rgbToCSS } from "@lib/biomeColors";
import type { Block3DProps } from "./types";
import s from "../../styles.module.scss";

export const Block3D = ({
    faces,
    tintedTextures,
    foliageColor,
    alt,
    size,
    onError,
}: Block3DProps) => {
    return (
        <div className={s.blockContainer} style={{ width: size, height: size }}>
            <div className={s.blockScene}>
                {faces.map((face, index) => (
                    <div
                        key={index}
                        className={`${s.face} ${s[`face${face.type.charAt(0).toUpperCase()}${face.type.slice(1)}`]} ${face.tintType ? s[`${face.tintType}Tint`] : ""}`}
                        style={
                            {
                                transform: face.transform, // Pre-baked transform from worker
                                "--face-width": `${face.width}px`,
                                "--face-height": `${face.height}px`,
                                "--face-brightness": face.brightness,
                                "--uv-x": face.uv.u,
                                "--uv-y": face.uv.v,
                                "--uv-width": face.uv.width,
                                "--uv-height": face.uv.height,
                                "--uv-flip-x": face.uv.flipX,
                                "--uv-flip-y": face.uv.flipY,
                                "--foliage-color": rgbToCSS(foliageColor),
                                zIndex: face.zIndex,
                            } as React.CSSProperties
                        }
                    >
                        <img
                            src={
                                face.tintType && tintedTextures.has(face.textureUrl)
                                    ? tintedTextures.get(face.textureUrl)!
                                    : face.textureUrl
                            }
                            alt={`${alt} ${face.type}`}
                            onError={() => {
                                onError?.();
                            }}
                            draggable={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
