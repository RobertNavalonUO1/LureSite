import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const LEMON_GLB_URL = '/images/models/lemon.glb';

function tintModel(root, tintHex) {
    if (!tintHex) return;

    const tint = new THREE.Color(tintHex);
    root.traverse((child) => {
        if (!child?.isMesh || !child.material) return;

        // Clone material so each planet can have its own tint.
        child.material = child.material.clone();

        if ('color' in child.material) {
            // Blend existing color toward the tint to preserve some shading.
            const base = child.material.color?.clone?.() ?? new THREE.Color('#ffffff');
            child.material.color = base.lerp(tint, 0.6);
        }
        if ('metalness' in child.material) child.material.metalness = 0.15;
        if ('roughness' in child.material) child.material.roughness = 0.75;
    });
}

function LemonBody({ scale, tint, axialTilt = 0 }) {
    const { scene } = useGLTF(LEMON_GLB_URL);

    const model = useMemo(() => {
        const cloned = scene.clone(true);
        cloned.updateMatrixWorld(true);
        tintModel(cloned, tint);
        return cloned;
    }, [scene, tint]);

    return (
        <group rotation={[0, 0, axialTilt]}>
            <Center>
                <primitive object={model} scale={scale} />
            </Center>
        </group>
    );
}

function OrbitRing({ radius }) {
    const ringRef = useRef(null);

    useFrame((state, delta) => {
        const ring = ringRef.current;
        if (!ring) return;
        ring.rotation.z += delta * 0.02;
    });

    return (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, 0.006, 10, 220]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
    );
}

function Planet({
    orbitRadius,
    size,
    speed,
    phase = 0,
    tint,
    axialTilt = 0,
    inclination = 0,
    ring = false,
}) {
    const groupRef = useRef(null);

    useFrame((state) => {
        const group = groupRef.current;
        if (!group) return;

        const t = state.clock.elapsedTime;
        const angle = t * speed + phase;

        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        const y = Math.sin(angle * 0.7) * inclination;

        group.position.set(x, y, z);
        group.rotation.y = angle;
    });

    return (
        <group ref={groupRef}>
            <LemonBody scale={size} tint={tint} axialTilt={axialTilt} />
            {ring ? (
                <mesh rotation={[Math.PI / 2, 0, Math.PI / 8]}>
                    <torusGeometry args={[size * 1.7, size * 0.12, 10, 80]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
                </mesh>
            ) : null}
        </group>
    );
}

function SolarSystem() {
    // Scaled to fit nicely in a single view without zoom.
    const planetScale = 0.55;
    const planets = [
        // Mercury
        { orbitRadius: 1.9, size: 0.16, speed: 1.6, phase: 0.2, tint: '#9CA3AF', inclination: 0.06 },
        // Venus
        { orbitRadius: 2.3, size: 0.22, speed: 1.25, phase: 1.1, tint: '#FDE68A', inclination: 0.07 },
        // Earth
        { orbitRadius: 2.7, size: 0.24, speed: 1.05, phase: 2.2, tint: '#60A5FA', inclination: 0.08 },
        // Mars
        { orbitRadius: 3.1, size: 0.19, speed: 0.92, phase: 2.9, tint: '#F87171', inclination: 0.09 },
        // Jupiter
        { orbitRadius: 3.8, size: 0.52, speed: 0.55, phase: 0.7, tint: '#FDBA74', inclination: 0.12 },
        // Saturn (ring)
        { orbitRadius: 4.4, size: 0.46, speed: 0.42, phase: 1.9, tint: '#FCD34D', ring: true, inclination: 0.12 },
        // Uranus (big tilt)
        { orbitRadius: 5.0, size: 0.32, speed: 0.32, phase: 2.6, tint: '#67E8F9', axialTilt: 1.1, inclination: 0.14 },
        // Neptune
        { orbitRadius: 5.6, size: 0.31, speed: 0.26, phase: 3.4, tint: '#3B82F6', inclination: 0.16 },
    ];

    return (
        <group rotation={[0.35, 0, 0.06]}>
            {planets.map((p, idx) => (
                <React.Fragment key={idx}>
                    <OrbitRing radius={p.orbitRadius} />
                    <Planet {...p} size={p.size * planetScale} />
                </React.Fragment>
            ))}
        </group>
    );
}

function LemonModel() {
    const groupRef = useRef(null);
    const { scene } = useGLTF(LEMON_GLB_URL);
    const spinBoostRef = useRef(0);

    const { model, scale } = useMemo(() => {
        const cloned = scene.clone(true);

        // Ensure transforms are up-to-date before measuring.
        cloned.updateMatrixWorld(true);

        // Auto-scale (with safety clamp) so it reads like a "real" lemon on screen.
        const box = new THREE.Box3().setFromObject(cloned);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x || 0, size.y || 0, size.z || 0) || 1;
        const targetMaxDim = 1.28;
        const scaleFactorRaw = targetMaxDim / maxDim;
        const scaleFactor = THREE.MathUtils.clamp(scaleFactorRaw, 0.25, 3.5);

        return { model: cloned, scale: scaleFactor };
    }, [scene]);

    useEffect(() => {
        const onWheel = (event) => {
            // Scroll down -> positive deltaY. We want "accelerate" in a single direction,
            // but with small impulses and a clamp so trackpads don't explode.
            const impulse = THREE.MathUtils.clamp(event.deltaY * 0.0045, -0.6, 0.6);
            spinBoostRef.current = THREE.MathUtils.clamp(spinBoostRef.current + impulse, -2.5, 2.5);
        };

        window.addEventListener('wheel', onWheel, { passive: true });
        return () => window.removeEventListener('wheel', onWheel);
    }, []);

    useFrame((state, delta) => {
        const group = groupRef.current;
        if (!group) return;

        // Always centered; rotate on itself.
        group.position.set(0, 0, 0);

        // Base spin + scroll boost that decays back to 0.
        const baseSpin = 0.7;
        const boost = spinBoostRef.current;
        const effectiveSpin = baseSpin + boost;

        group.rotation.y += delta * effectiveSpin;

        // Decay boost smoothly back to normal over time.
        const decay = 0.97; // closer to 1 => slower decay
        spinBoostRef.current *= Math.pow(decay, delta * 60);

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

        // "Head look" camera: keep position, slightly shift the look target.
        const lookX = state.pointer.x * 0.55;
        const lookY = -state.pointer.y * 0.35;

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.08);

        camera.lookAt(lookX, lookY, 0);
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
                    camera={{ position: [0, 0, 6.2], fov: 50, near: 0.1, far: 500 }}
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
                        <SolarSystem />
                        <LemonModel />
                    </Suspense>
                </Canvas>
            </div>
        </>
    );
}
