import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './GameWallpaper3D.css'

export default function GameWallpaper3D({ level = 1 }) {
    const mountRef = useRef(null)

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let animationFrameId
        let mouseX = 0
        let mouseY = 0
        let targetX = 0
        let targetY = 0

        // SCENE, CAMERA, RENDERER
        const scene = new THREE.Scene()
        const width = window.innerWidth
        const height = window.innerHeight

        const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000)
        camera.position.z = 15

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.2
        container.appendChild(renderer.domElement)

        // LIGHTS
        const ambientLight = new THREE.AmbientLight(0x4338ca, 1.8)
        scene.add(ambientLight)

        const cyanLight = new THREE.PointLight(0x06b6d4, 4, 60)
        cyanLight.position.set(10, 8, 8)
        scene.add(cyanLight)

        const magentaLight = new THREE.PointLight(0xec4899, 4, 60)
        magentaLight.position.set(-10, -8, 6)
        scene.add(magentaLight)

        const purpleLight = new THREE.PointLight(0x8b5cf6, 3, 50)
        purpleLight.position.set(0, 0, 10)
        scene.add(purpleLight)

        // ROOT 3D GROUP (responds to mouse tilt)
        const sceneGroup = new THREE.Group()
        scene.add(sceneGroup)

        // 1. CENTRAL FLOATING HOLOGRAPHIC ICOSAHEDRON
        const icosaGeometry = new THREE.IcosahedronGeometry(2.6, 0)
        const icosaMaterial = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            emissive: 0x312e81,
            roughness: 0.2,
            metalness: 0.85,
            wireframe: false,
            transparent: true,
            opacity: 0.55,
        })
        const centralCore = new THREE.Mesh(icosaGeometry, icosaMaterial)
        sceneGroup.add(centralCore)

        // Wireframe cage around core
        const wireGeometry = new THREE.IcosahedronGeometry(2.8, 1)
        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
        })
        const wireCage = new THREE.Mesh(wireGeometry, wireMaterial)
        sceneGroup.add(wireCage)

        // 2. ORBITING RINGS (Cyber Astrolabe)
        const ringGeometry1 = new THREE.TorusGeometry(4.2, 0.05, 16, 120)
        const ringMaterial1 = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x0891b2,
            roughness: 0.3,
            metalness: 0.9,
            transparent: true,
            opacity: 0.75,
        })
        const ring1 = new THREE.Mesh(ringGeometry1, ringMaterial1)
        ring1.rotation.x = Math.PI / 3
        sceneGroup.add(ring1)

        const ringGeometry2 = new THREE.TorusGeometry(5.2, 0.04, 16, 120)
        const ringMaterial2 = new THREE.MeshStandardMaterial({
            color: 0xd946ef,
            emissive: 0xa21caf,
            roughness: 0.3,
            metalness: 0.9,
            transparent: true,
            opacity: 0.65,
        })
        const ring2 = new THREE.Mesh(ringGeometry2, ringMaterial2)
        ring2.rotation.y = Math.PI / 4
        sceneGroup.add(ring2)

        const ringGeometry3 = new THREE.TorusGeometry(6.4, 0.03, 16, 120)
        const ringMaterial3 = new THREE.MeshBasicMaterial({
            color: 0xa855f7,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
        })
        const ring3 = new THREE.Mesh(ringGeometry3, ringMaterial3)
        ring3.rotation.x = -Math.PI / 5
        sceneGroup.add(ring3)

        // 3. FLOATING GEOMETRIC SATELLITES / CRYSTALS
        const satellites = []
        const satelliteGeometries = [
            new THREE.OctahedronGeometry(0.8, 0),
            new THREE.TetrahedronGeometry(0.7, 0),
            new THREE.DodecahedronGeometry(0.7, 0),
            new THREE.IcosahedronGeometry(0.6, 0),
        ]
        const satelliteColors = [0x38bdf8, 0xf43f5e, 0xa855f7, 0x10b981, 0xfbbf24, 0x06b6d4]

        for (let i = 0; i < 14; i++) {
            const geo = satelliteGeometries[i % satelliteGeometries.length]
            const color = satelliteColors[i % satelliteColors.length]
            const mat = new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.35,
                roughness: 0.3,
                metalness: 0.8,
                transparent: true,
                opacity: 0.7,
            })
            const mesh = new THREE.Mesh(geo, mat)

            // Random spherical orbit
            const radius = 6.5 + Math.random() * 8
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(Math.random() * 2 - 1)

            mesh.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi) - 3
            )

            mesh.userData = {
                rotSpeedX: (Math.random() - 0.5) * 0.02,
                rotSpeedY: (Math.random() - 0.5) * 0.02,
                orbitSpeed: 0.003 + Math.random() * 0.004,
                orbitRadius: radius,
                orbitAngle: theta,
                orbitElevation: phi,
                floatOffset: Math.random() * Math.PI * 2,
            }

            sceneGroup.add(mesh)
            satellites.push(mesh)
        }

        // 4. NEURAL STARFIELD (Stardust cloud)
        const particleCount = 1400
        const particlePositions = new Float32Array(particleCount * 3)
        const particleColorsArray = new Float32Array(particleCount * 3)
        const colorPalette = [
            new THREE.Color(0x38bdf8),
            new THREE.Color(0xa855f7),
            new THREE.Color(0xec4899),
            new THREE.Color(0x818cf8),
            new THREE.Color(0x22d3ee),
        ]

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3
            particlePositions[i3] = (Math.random() - 0.5) * 60
            particlePositions[i3 + 1] = (Math.random() - 0.5) * 50
            particlePositions[i3 + 2] = (Math.random() - 0.5) * 50 - 5

            const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]
            particleColorsArray[i3] = chosenColor.r
            particleColorsArray[i3 + 1] = chosenColor.g
            particleColorsArray[i3 + 2] = chosenColor.b
        }

        const particleGeometry = new THREE.BufferGeometry()
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColorsArray, 3))

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.16,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
        })
        const particles = new THREE.Points(particleGeometry, particleMaterial)
        scene.add(particles)

        // MOUSE LISTENER FOR 3D PARALLAX
        const handleMouseMove = (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2
        }
        window.addEventListener('mousemove', handleMouseMove, { passive: true })

        // WINDOW RESIZE
        const handleResize = () => {
            const w = window.innerWidth
            const h = window.innerHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }
        window.addEventListener('resize', handleResize)

        // ANIMATION LOOP
        let clock = new THREE.Clock()

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)

            const elapsedTime = clock.getElapsedTime()

            // Smooth mouse parallax interpolation
            targetX += (mouseX - targetX) * 0.05
            targetY += (mouseY - targetY) * 0.05

            camera.position.x = targetX * 2.2
            camera.position.y = -targetY * 1.8
            camera.lookAt(0, 0, 0)

            // Rotate core
            centralCore.rotation.x = elapsedTime * 0.25
            centralCore.rotation.y = elapsedTime * 0.35
            wireCage.rotation.x = -elapsedTime * 0.15
            wireCage.rotation.y = -elapsedTime * 0.2

            // Pulse core scale slightly
            const corePulse = 1 + Math.sin(elapsedTime * 1.5) * 0.04
            centralCore.scale.set(corePulse, corePulse, corePulse)
            wireCage.scale.set(corePulse, corePulse, corePulse)

            // Rotate rings
            ring1.rotation.z = elapsedTime * 0.2
            ring1.rotation.y = elapsedTime * 0.15
            ring2.rotation.x = -elapsedTime * 0.25
            ring2.rotation.z = -elapsedTime * 0.12
            ring3.rotation.y = elapsedTime * 0.18

            // Animate floating satellites
            satellites.forEach((sat, idx) => {
                sat.rotation.x += sat.userData.rotSpeedX
                sat.rotation.y += sat.userData.rotSpeedY

                // Smooth bobbing
                const floatY = Math.sin(elapsedTime * 1.2 + sat.userData.floatOffset) * 0.4
                sat.position.y += floatY * 0.015

                // Slow planetary orbit
                sat.userData.orbitAngle += sat.userData.orbitSpeed
                sat.position.x = sat.userData.orbitRadius * Math.sin(sat.userData.orbitElevation) * Math.cos(sat.userData.orbitAngle)
                sat.position.z = sat.userData.orbitRadius * Math.sin(sat.userData.orbitElevation) * Math.sin(sat.userData.orbitAngle) - 2
            })

            // Slowly drift particles
            particles.rotation.y = elapsedTime * 0.02
            particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.05

            renderer.render(scene, camera)
        }

        animate()

        // CLEANUP
        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', handleResize)

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }

            renderer.dispose()
            icosaGeometry.dispose()
            icosaMaterial.dispose()
            wireGeometry.dispose()
            wireMaterial.dispose()
            ringGeometry1.dispose()
            ringMaterial1.dispose()
            ringGeometry2.dispose()
            ringMaterial2.dispose()
            ringGeometry3.dispose()
            ringMaterial3.dispose()
            satelliteGeometries.forEach((g) => g.dispose())
            particleGeometry.dispose()
            particleMaterial.dispose()
        }
    }, [level])

    return (
        <div className="game-wallpaper-3d-wrapper" aria-hidden="true">
            <div className="game-wallpaper-canvas-container" ref={mountRef} />
            <div className="game-wallpaper-cyber-grid" />
            <div className="game-wallpaper-vignette" />
        </div>
    )
}
