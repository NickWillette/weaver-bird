import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import * as THREE from "three";
import { parseJEM, jemToThreeJS, type JEMFile } from "../jemLoader";
import { AnimationEngine } from "./AnimationEngine";

const PX = 16;

describe("Fresh Animations (wolf) rotation + tail semantics", () => {
  it("handles wolf body_rotation, mane2, head2, tail2 semantics", () => {
    const jemPath = join(
      __dirname,
      "../../../../__mocks__/resourcepacks/FreshAnimations_v1.10.2/assets/minecraft/optifine/cem/wolf.jem",
    );
    const jpmPath = join(
      __dirname,
      "../../../../__mocks__/resourcepacks/FreshAnimations_v1.10.2/assets/minecraft/optifine/cem/wolf_animations.jpm",
    );

    const jem = JSON.parse(readFileSync(jemPath, "utf-8")) as JEMFile;
    const jpm = JSON.parse(readFileSync(jpmPath, "utf-8")) as {
      animations?: Record<string, any>[];
    };

    const parsed = parseJEM(jem);
    parsed.animations = jpm.animations as any;

    const group = jemToThreeJS(parsed, null, {});
    const engine = new AnimationEngine(group, parsed.animations);

    engine.tick(0);

    const body = group.getObjectByName("body") as THREE.Object3D | null;
    const bodyRotation = group.getObjectByName(
      "body_rotation",
    ) as THREE.Object3D | null;
    const tail2 = group.getObjectByName("tail2") as THREE.Object3D | null;
    const head2 = group.getObjectByName("head2") as THREE.Object3D | null;
    const mane2 = group.getObjectByName("mane2") as THREE.Object3D | null;

    expect(body).toBeTruthy();
    expect(bodyRotation).toBeTruthy();
    expect(tail2).toBeTruthy();
    expect(head2).toBeTruthy();
    expect(mane2).toBeTruthy();

    // At rest, FA wolves set `body.rx = pi/2` (vanilla baseline). Our loader marks
    // wolf-style bodies to subtract that baseline because their geometry already
    // bakes the vanilla +90° body rotation via `body_rotation.rotate = -90`.
    expect(body!.rotation.x).toBeCloseTo(0, 6);

    // `body_rotation` keeps its base -90° rotate from the JEM, and animations
    // drive small deltas around it.
    const bodyRotationUserData = (bodyRotation as any).userData ?? {};
    const bodyRotationRx = engine.getBoneValue("body_rotation", "rx");
    const rotSignX =
      typeof bodyRotationUserData.invertAxis === "string" &&
      (bodyRotationUserData.invertAxis as string).includes("x")
        ? -1
        : 1;
    expect(bodyRotation!.rotation.x).toBeCloseTo(
      -Math.PI / 2 + rotSignX * bodyRotationRx,
      6,
    );

    // `body_rotation.tz` is authored as an absolute rotationPoint value, so it should
    // be interpreted in entity-absolute space (subtract parent origin).
    const bodyRotationAbsAxes =
      typeof bodyRotationUserData.absoluteTranslationAxes === "string"
        ? (bodyRotationUserData.absoluteTranslationAxes as string)
        : "";
    expect(bodyRotationAbsAxes).toContain("z");
    const bodyRotationTz = engine.getBoneValue("body_rotation", "tz");
    const bodyOriginPx =
      Array.isArray((body as any)?.userData?.originPx) &&
      (body as any).userData.originPx.length === 3
        ? ((body as any).userData.originPx as [number, number, number])
        : ([0, 0, 0] as [number, number, number]);
    expect(bodyRotation!.position.z).toBeCloseTo(
      bodyRotationTz / PX - bodyOriginPx[2] / PX,
      6,
    );
    // body_rotation.ty baseline should be subtracted so it rests at y≈0.
    expect(Math.abs(bodyRotation!.position.y)).toBeLessThan(1e-3);

    // `mane2` expressions include the rest pose translate, so treat translations as local absolute.
    const mane2UserData = (mane2 as any).userData ?? {};
    expect(mane2UserData.absoluteTranslationSpace).toBe("local");
    const maneAbsAxes =
      typeof mane2UserData.absoluteTranslationAxes === "string"
        ? (mane2UserData.absoluteTranslationAxes as string)
        : "";
    expect(maneAbsAxes).toContain("x");
    expect(maneAbsAxes).toContain("y");
    expect(maneAbsAxes).toContain("z");

    const maneTx = engine.getBoneValue("mane2", "tx");
    const maneTy = engine.getBoneValue("mane2", "ty");
    const maneTz = engine.getBoneValue("mane2", "tz");
    const maneInvertAxis =
      typeof mane2UserData.invertAxis === "string"
        ? (mane2UserData.invertAxis as string)
        : "";

    const expectedManeX =
      (maneInvertAxis.includes("x") ? -1 : 1) * (maneTx / PX);
    const expectedManeY =
      (maneInvertAxis.includes("y") ? -1 : 1) * (maneTy / PX);
    const expectedManeZ =
      (maneInvertAxis.includes("z") ? -1 : 1) * (maneTz / PX);

    expect(mane2!.position.x).toBeCloseTo(expectedManeX, 6);
    expect(mane2!.position.y).toBeCloseTo(expectedManeY, 6);
    expect(mane2!.position.z).toBeCloseTo(expectedManeZ, 6);

    // Wolves use a special Y-origin for head2 so head2.ty behaves like a local-absolute value,
    // but head2.tx/tz remain in the usual entity-absolute space.
    const head2UserData = (head2 as any).userData ?? {};
    const headTy = engine.getBoneValue("head2", "ty");
    const headInvertAxis =
      typeof head2UserData.invertAxis === "string"
        ? (head2UserData.invertAxis as string)
        : "";
    // For body-rotation rigs we set cemYOrigin so head2.ty baseline yields y=0 at rest.
    expect(head2!.position.y).toBeCloseTo(0, 6);
    // Head baseline: FA includes `torad(-90)` in head2.rx. Our loader removes it via rotationOffsetX.
    expect(head2!.rotation.x).toBeCloseTo(0, 6);

    // Tail: on body-rotation rigs, y baseline yields y=0 at rest and tz is treated as a delta.
    const tail2UserData = (tail2 as any).userData ?? {};
    const tailAbsAxes =
      typeof tail2UserData.absoluteTranslationAxes === "string"
        ? (tail2UserData.absoluteTranslationAxes as string)
        : "";
    expect(tailAbsAxes).toContain("y");
    expect(tail2!.position.y).toBeCloseTo(0, 6);

    // tz should keep the base separation and only apply a small delta at rest.
    const baseTailZ = 6 / PX; // (8 - 2) / 16
    expect(tail2!.position.z).toBeCloseTo(baseTailZ, 1);
    // Tail baseline: FA includes a `-pi/2` in tail2.rx; our loader removes it via rotationOffsetX.
    expect(typeof tail2UserData.rotationOffsetX).toBe("number");
  });
});
