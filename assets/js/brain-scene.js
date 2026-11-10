let activeCleanup = null;
export async function initBrainScene(canvasId) {
  disposeBrainScene();
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js');
    if (!document.body.contains(canvas)) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 4.15);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    scene.add(new THREE.HemisphereLight(0xe6f8f6, 0x1b3047, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(3, 4, 5); scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x5bc4b6, 2.2, 8);
    rimLight.position.set(-3, 1, -2); scene.add(rimLight);
    const model = new THREE.Group(); scene.add(model);
    const materialLeft = new THREE.MeshPhysicalMaterial({ color: 0xd6e6df, roughness: 0.72, metalness: 0.02, clearcoat: 0.12, clearcoatRoughness: 0.8 });
    const materialRight = materialLeft.clone(); materialRight.color.set(0xc0d9d4);
    function createHemisphere(sign, material) {
      const geometry = new THREE.SphereGeometry(1, 84, 64);
      const position = geometry.attributes.position;
      const vertex = new THREE.Vector3();
      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i);
        const x = vertex.x, y = vertex.y, z = vertex.z;
        const folds = 0.025 * Math.sin(x * 17 + y * 4) * Math.sin(y * 13 + z * 2);
        const folds2 = 0.017 * Math.sin(z * 21 - x * 7) * Math.cos(y * 9);
        const folds3 = 0.012 * Math.cos(x * 29 + z * 11) * Math.sin(y * 18);
        vertex.multiplyScalar(1 + folds + folds2 + folds3);
        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      geometry.computeVertexNormals();
      const hemisphere = new THREE.Mesh(geometry, material);
      hemisphere.scale.set(0.66, 0.83, 0.72);
      hemisphere.position.set(sign * 0.43, 0.02, 0);
      return hemisphere;
    }
    model.add(createHemisphere(-1, materialLeft));
    model.add(createHemisphere(1, materialRight));
    const stemGeometry = new THREE.CapsuleGeometry(0.13, 0.57, 8, 18);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8bb7ad, roughness: 0.82 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(0, -0.78, -0.03); stem.rotation.z = 0.06; model.add(stem);
    const seamPoints = [];
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      seamPoints.push(new THREE.Vector3(0, 0.77 - t * 1.34, 0.68 * Math.sin(Math.PI * t) + 0.02));
    }
    model.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(seamPoints), new THREE.LineBasicMaterial({ color: 0x507f7a, transparent: true, opacity: 0.72 })));
    model.rotation.y = -0.26; model.rotation.x = 0.08;
    let dragging = false, pointerX = 0, pointerY = 0, targetY = model.rotation.y, targetX = model.rotation.x, zoom = 4.15, frame = 0, disposed = false;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    const onPointerDown = (event) => { dragging = true; pointerX = event.clientX; pointerY = event.clientY; canvas.setPointerCapture?.(event.pointerId); };
    const onPointerMove = (event) => {
      if (!dragging) return;
      const dx = event.clientX - pointerX, dy = event.clientY - pointerY;
      pointerX = event.clientX; pointerY = event.clientY;
      targetY += dx * 0.008; targetX = Math.max(-0.55, Math.min(0.55, targetX + dy * 0.006));
    };
    const onPointerUp = () => { dragging = false; };
    const onWheel = (event) => { event.preventDefault(); zoom = Math.max(2.65, Math.min(5.7, zoom + event.deltaY * 0.003)); camera.position.z = zoom; };
    canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    const reset = () => { targetY = -0.26; targetX = 0.08; zoom = 4.15; camera.position.z = zoom; };
    const resetButton = document.querySelector('[data-brain-reset]');
    if (resetButton) resetButton.addEventListener('click', reset);
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (!dragging) targetY += 0.0018;
      model.rotation.y += (targetY - model.rotation.y) * 0.045;
      model.rotation.x += (targetX - model.rotation.x) * 0.045;
      renderer.render(scene, camera);
    };
    animate();
    activeCleanup = () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointercancel', onPointerUp); canvas.removeEventListener('wheel', onWheel);
      if (resetButton) resetButton.removeEventListener('click', reset);
      renderer.dispose(); geometryDispose(model); materialLeft.dispose(); materialRight.dispose(); stemMaterial.dispose();
    };
  } catch (error) {
    const fallback = document.createElement('div');
    fallback.className = 'viewer-fallback';
    fallback.textContent = '3D-визуализация не загрузилась. Проверь подключение к CDN и поддержку WebGL.';
    canvas.replaceWith(fallback);
  }
}
function geometryDispose(group) {
  group.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose());
      else if (object.material.type !== 'MeshPhysicalMaterial') object.material.dispose();
    }
  });
}
export function disposeBrainScene() {
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
}
