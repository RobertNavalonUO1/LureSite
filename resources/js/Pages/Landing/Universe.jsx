import React, { Suspense, useMemo, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const LEMON_GLB_URL = '/images/models/lemon.glb';

function LemonModel() {
    const groupRef = useRef(null);
    const { scene } = useGLTF(LEMON_GLB_URL);

    const { model, scale } = useMemo(() => {
        const cloned = scene.clone(true);

        // Center the model around (0,0,0) using its bounding box.
        const box = new THREE.Box3().setFromObject(cloned);
        const center = box.getCenter(new THREE.Vector3());
        cloned.position.sub(center);

        // Auto-scale so it reads like a "real" lemon on screen.
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x || 0, size.y || 0, size.z || 0) || 1;
        const targetMaxDim = 1.0;
        const scaleFactor = targetMaxDim / maxDim;

        return { model: cloned, scale: scaleFactor };
    }, [scene]);

    useFrame((state, delta) => {
        const group = groupRef.current;
        if (!group) return;

        // Smooth pointer-driven rotation + subtle idle spin.
        const targetY = state.pointer.x * 0.8;
        const targetX = -state.pointer.y * 0.5;

        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetY, 0.10);
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, 0.10);
        group.rotation.z += delta * 0.10;

        // Subtle float.
        group.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <primitive object={model} scale={scale} />
        </group>
    );
}

useGLTF.preload(LEMON_GLB_URL);

function StarsField() {
    const starsGroupRef = useRef(null);

    useFrame((state) => {
        const group = starsGroupRef.current;
        if (!group) return;

        // Parallax 3D feel: move and rotate the starfield with the pointer.
        const targetX = state.pointer.x * 2.5;
        const targetY = state.pointer.y * 1.5;

        group.position.x = THREE.MathUtils.lerp(group.position.x, targetX, 0.06);
        group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, 0.06);

        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, state.pointer.x * 0.35, 0.05);
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -state.pointer.y * 0.25, 0.05);
    });

    return (
        <group ref={starsGroupRef}>
            <Stars radius={120} depth={70} count={7000} factor={4} saturation={0} fade speed={1} />
        </group>
    );
}

export default function Universe() {
    return (
        <>
            <Head title="Próximamente" />
            <div className="h-screen w-screen overflow-hidden bg-black">
                <Canvas
                    camera={{ position: [0, 0, 4.2], fov: 50 }}
                    dpr={[1, 2]}
                    gl={{ antialias: true, alpha: false }}
                    style={{ touchAction: 'none' }}
                >
                    <color attach="background" args={['#000000']} />

                    <ambientLight intensity={0.8} />
                    <directionalLight position={[6, 6, 6]} intensity={1.2} />
                    <directionalLight position={[-6, -4, -2]} intensity={0.35} />

                    <StarsField />

                    <Suspense fallback={null}>
                        <LemonModel />
                    </Suspense>
                </Canvas>
            </div>
        </>
    );
}
