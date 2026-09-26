import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';

function useSceneReady() {
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    const observer = new IntersectionObserver(([entry]) => setReady(Boolean(entry?.isIntersecting)), { rootMargin: '160px' });
    if (hostRef.current) observer.observe(hostRef.current);
    return () => {
      media.removeEventListener?.('change', update);
      observer.disconnect();
    };
  }, []);

  return { hostRef, ready, reducedMotion };
}

function AssemblyBlocks({ reducedMotion, accentColor, secondaryAccentColor }: { reducedMotion: boolean; accentColor: string; secondaryAccentColor: string }) {
  const group = useRef<Group>(null);
  const blocks = useMemo(() => [
    { position: [-1.35, 0.7, 0] as [number, number, number], size: [0.9, 0.18, 0.08] as [number, number, number] },
    { position: [0.9, 0.42, 0.08] as [number, number, number], size: [0.72, 0.3, 0.08] as [number, number, number] },
    { position: [-0.65, -0.35, 0.12] as [number, number, number], size: [1.5, 0.12, 0.08] as [number, number, number] },
    { position: [0.55, -0.84, 0] as [number, number, number], size: [0.95, 0.18, 0.08] as [number, number, number] }
  ], []);

  useFrame((state) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.16;
    group.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.32) * 0.04;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.05;
  });

  return (
    <group ref={group} rotation={[0.08, -0.18, -0.04]}>
      <mesh position={[0, 0, -0.12]}>
        <boxGeometry args={[2.9, 2.15, 0.06]} />
        <meshStandardMaterial color="#0F172A" metalness={0.2} roughness={0.7} />
      </mesh>
      {blocks.map((block, index) => (
        <mesh key={index} position={block.position}>
          <boxGeometry args={block.size} />
          <meshStandardMaterial color={index % 2 === 0 ? accentColor : secondaryAccentColor} emissive={index % 2 === 0 ? accentColor : secondaryAccentColor} emissiveIntensity={0.18} roughness={0.42} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0.06]}>
        <planeGeometry args={[2.3, 1.65]} />
        <meshBasicMaterial color="#F8FAFC" transparent opacity={0.08} side={2} />
      </mesh>
    </group>
  );
}

export function CreatorAssemblyScene({ accentColor = '#7C3AED', secondaryAccentColor = '#2563EB' }: { accentColor?: string; secondaryAccentColor?: string }) {
  const { hostRef, ready, reducedMotion } = useSceneReady();
  const [webglAvailable, setWebglAvailable] = useState(true);

  if (typeof window === 'undefined') return <div aria-hidden="true" className="creator-assembly-fallback" />;

  return (
    <div ref={hostRef} className="creator-assembly-scene" style={{ '--assembly-accent': accentColor, '--assembly-accent-secondary': secondaryAccentColor } as React.CSSProperties} aria-hidden="true">
      {!webglAvailable || reducedMotion ? (
        <div className="creator-assembly-static" />
      ) : ready ? (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4.5], fov: 34 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000000', 0);
            gl.domElement.addEventListener('webglcontextlost', () => setWebglAvailable(false), { once: true });
          }}
        >
          <ambientLight intensity={1.3} />
          <directionalLight position={[2, 2, 4]} intensity={2.2} color="#FFFFFF" />
          <pointLight position={[-2, 0, 2]} intensity={3} color={accentColor} distance={5} />
          <Suspense fallback={null}><AssemblyBlocks reducedMotion={reducedMotion} accentColor={accentColor} secondaryAccentColor={secondaryAccentColor} /></Suspense>
        </Canvas>
      ) : (
        <div className="creator-assembly-loading" />
      )}
    </div>
  );
}
