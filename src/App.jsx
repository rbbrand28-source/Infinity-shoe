import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  useGLTF,
  ContactShadows,
  Environment as DreiEnv,
} from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";

/* -------------------- PRODUCT VARIANTS -------------------- */
const PRODUCT_VARIANTS = [
  {
    name: "Obsidian Black",
    line: "Future Runner",
    material: "Matte Composite",
    color: "#1a1a1a",
    luminance: 0.1,
    finishBias: 0.05,
  },
  {
    name: "Stone Grey",
    line: "Future Runner",
    material: "Engineered Mesh",
    color: "#b5b5b0",
    luminance: 0.55,
    finishBias: 0,
  },
  {
    name: "Ivory White",
    line: "Future Runner",
    material: "Performance Knit",
    color: "#f2f2ee",
    luminance: 0.85,
    finishBias: -0.05,
  },
];

/* -------------------- GROUND -------------------- */
function Ground({ variant }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;
    ref.current.material.opacity = THREE.MathUtils.lerp(
      ref.current.material.opacity,
      THREE.MathUtils.lerp(0.35, 0.18, variant.luminance),
      0.08
    );
  });

  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.55, 0]}
      receiveShadow
    >
      <planeGeometry args={[10, 10]} />
      <shadowMaterial transparent opacity={0.25} />
    </mesh>
  );
}

/* -------------------- ENVIRONMENT -------------------- */
function Environment({ variant }) {
  return (
    <>
      <fogExp2 args={["#0b0b0c", 0.035]} />
      <mesh scale={50}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          side={THREE.BackSide}
          color="#0f0f12"
          emissive="#1a1a1f"
          emissiveIntensity={THREE.MathUtils.lerp(0.18, 0.28, 1 - variant.luminance)}
          roughness={1}
        />
      </mesh>
      <DreiEnv preset="studio" />
    </>
  );
}

/* -------------------- SHOE -------------------- */
function Shoe({ variantIndex, setVariantIndex }) {
  const group = useRef();
  const variant = PRODUCT_VARIANTS[variantIndex];
  const targetColor = useRef(new THREE.Color(variant.color));

  const { scene } = useGLTF("/models/rtfkt_creator_one.glb");

  const meshes = useMemo(() => {
    const arr = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.castShadow = true;
        child.receiveShadow = true;
        arr.push(child);
      }
    });

    scene.scale.set(1.6, 1.6, 1.6);
    scene.position.set(0, -0.55, 0);
    scene.rotation.y = 0;

    return arr;
  }, [scene]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.35;

    meshes.forEach((m) => {
      m.material.color.lerp(targetColor.current, 0.05);
      m.material.roughness = THREE.MathUtils.lerp(
        m.material.roughness,
        0.45 + variant.finishBias,
        0.05
      );
    });
  });

  const nextVariant = () => {
    const next = (variantIndex + 1) % PRODUCT_VARIANTS.length;
    targetColor.current.set(PRODUCT_VARIANTS[next].color);
    setVariantIndex(next);
  };

  return (
    <>
      <group ref={group} onClick={nextVariant}>
        <primitive object={scene} />
      </group>

      <ContactShadows
        position={[0, -0.55, 0]}
        opacity={0.4}
        width={6}
        height={6}
        blur={1.6}
        far={1.5}
      />

      <Html
        center
        position={[0, -1.25, 0]}
        style={{
          color: "#e6e6e6",
          fontSize: "14px",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div>
          <div>{variant.name}</div>
          <div style={{ opacity: 0.5, fontSize: "12px" }}>
            {variant.line} · {variant.material}
          </div>
        </div>
      </Html>

      <Ground variant={variant} />
    </>
  );
}

/* -------------------- APP ROOT -------------------- */
export default function App() {
  const [variantIndex, setVariantIndex] = useState(0);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: [4.2, 2.4, 6.5],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 6, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 2, -5]} intensity={0.6} />

        <Environment variant={PRODUCT_VARIANTS[variantIndex]} />

        <Shoe
          variantIndex={variantIndex}
          setVariantIndex={setVariantIndex}
        />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.12}
          minDistance={4.8}
          maxDistance={7}
        />
      </Canvas>
    </div>
  );
}