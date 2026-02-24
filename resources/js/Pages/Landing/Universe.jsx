import React, { Suspense, useMemo, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const LEMON_GLB_URL = '/images/models/lemon.glb';

function LemonModel() {
    const groupRef = useRef(null);
    const { scene } = useGLTF(LEMON_GLB_URL);

    const model = useMemo(() => scene.clone(true), [scene]);

    useFrame((state, delta) => {
        const group = groupRef.current;
        if (!group) return;

        // Smooth pointer-driven rotation + subtle idle spin.
        const targetY = state.pointer.x * 0.8;
        const targetX = -state.pointer.y * 0.5;

        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetY, 0.08);
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, 0.08);
        group.rotation.z += delta * 0.15;

        // Subtle float.
        group.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <primitive object={model} scale={1.6} />
        </group>
    );
}

useGLTF.preload(LEMON_GLB_URL);

export default function Universe() {
    return (
        <>
            <Head title="Próximamente" />
            <div className="min-h-screen w-full bg-black">
                <Canvas
                    camera={{ position: [0, 0, 4.2], fov: 50 }}
                    dpr={[1, 2]}
                    gl={{ antialias: true, alpha: false }}
                >
                    <color attach="background" args={['#000000']} />

                    <ambientLight intensity={0.8} />
                    <directionalLight position={[6, 6, 6]} intensity={1.2} />
                    <directionalLight position={[-6, -4, -2]} intensity={0.35} />

                    <Stars radius={90} depth={55} count={5500} factor={4} saturation={0} fade speed={1} />

                    <Suspense fallback={null}>
                        <LemonModel />
                    </Suspense>
                </Canvas>
            </div>
        </>
    );
}
