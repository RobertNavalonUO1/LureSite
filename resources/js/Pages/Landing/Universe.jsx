import React, { Suspense, useMemo, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const LEMON_GLB_URL = '/images/models/lemon.glb';

function LemonModel() {
    const groupRef = useRef(null);
    const { scene } = useGLTF(LEMON_GLB_URL);

    const { model, scale } = useMemo(() => {
        const cloned = scene.clone(true);

        // Ensure transforms are up-to-date before measuring.
        cloned.updateMatrixWorld(true);

        // Auto-scale (with safety clamp) so it reads like a "real" lemon on screen.
        const box = new THREE.Box3().setFromObject(cloned);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x || 0, size.y || 0, size.z || 0) || 1;
        const targetMaxDim = 1.6;
        const scaleFactorRaw = targetMaxDim / maxDim;
        const scaleFactor = THREE.MathUtils.clamp(scaleFactorRaw, 0.25, 3.5);

        return { model: cloned, scale: scaleFactor };
    }, [scene]);

    useFrame((state, delta) => {
        const group = groupRef.current;
        if (!group) return;

        // Always centered; rotate on itself.
        group.position.set(0, 0, 0);
        group.rotation.y += delta * 0.7;
        group.rotation.x = 0;
        group.rotation.z = 0;
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <Center>
                <primitive object={model} scale={scale} />
            </Center>
        </group>
    );
}

useGLTF.preload(LEMON_GLB_URL);

function CameraRig() {
    useFrame((state) => {
        const camera = state.camera;

        // Subtle camera parallax toward mouse direction.
        const targetX = state.pointer.x * 0.35;
        const targetY = state.pointer.y * 0.22;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);
        camera.lookAt(0, 0, 0);
    });

    return null;
}

function StarLayer({ radius, depth, count, factor, speed, parallax = 1, rotation = 1 }) {
    const groupRef = useRef(null);

    useFrame((state) => {
        const group = groupRef.current;
        if (!group) return;

        // Different parallax per layer => depth illusion.
        const targetX = -state.pointer.x * 3.0 * parallax;
        const targetY = -state.pointer.y * 2.0 * parallax;

        group.position.x = THREE.MathUtils.lerp(group.position.x, targetX, 0.04);
        group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, 0.04);

        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, state.pointer.x * 0.25 * rotation, 0.03);
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -state.pointer.y * 0.18 * rotation, 0.03);
    });

    return (
        <group ref={groupRef}>
            <Stars radius={radius} depth={depth} count={count} factor={factor} saturation={0} fade speed={speed} />
        </group>
    );
}

export default function Universe() {
    return (
        <>
            <Head title="Próximamente" />
            <div className="fixed inset-0 overflow-hidden bg-black">
                <Canvas
                    camera={{ position: [0, 0, 4.6], fov: 50, near: 0.1, far: 500 }}
                    dpr={[1, 2]}
                    gl={{ antialias: true, alpha: false }}
                    style={{ touchAction: 'none', position: 'absolute', inset: 0 }}
                >
                    <color attach="background" args={['#000000']} />

                    <CameraRig />

                    <ambientLight intensity={0.8} />
                    <directionalLight position={[6, 6, 6]} intensity={1.2} />
                    <directionalLight position={[-6, -4, -2]} intensity={0.35} />

                    <StarLayer radius={55} depth={25} count={2200} factor={2} speed={0.6} parallax={1.3} rotation={1.2} />
                    <StarLayer radius={95} depth={55} count={4200} factor={3} speed={0.9} parallax={0.8} rotation={1.0} />
                    <StarLayer radius={140} depth={85} count={6000} factor={4} speed={1.2} parallax={0.45} rotation={0.8} />

                    <Suspense fallback={null}>
                        <LemonModel />
                    </Suspense>
                </Canvas>
            </div>
        </>
    );
}
