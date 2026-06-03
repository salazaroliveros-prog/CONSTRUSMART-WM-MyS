import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { toast } from 'sonner';
import { Upload, Move, ZoomIn, ZoomOut, Rotate3d, Box, Maximize2, Sun } from 'lucide-react';

interface IFCViewerProps {
  className?: string;
}

const IFCViewer: React.FC<IFCViewerProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const ifcModelRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [modelName, setModelName] = useState('');
  const [sectionMode, setSectionMode] = useState(false);
  const [clipPlane, setClipPlane] = useState<THREE.Plane | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    scene.add(gridHelper);

    // Axes
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const loadIFCFile = async (file: File) => {
    try {
      const { IFCLoader } = await import('web-ifc');
      const ifcLoader = new IFCLoader();

      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      const ifcModel = await ifcLoader.parse(data);
      // web-ifc returns a THREE.Mesh with geometry
      if (ifcModel instanceof THREE.Mesh || ifcModel instanceof THREE.Group) {
        if (ifcModelRef.current && sceneRef.current) {
          sceneRef.current.remove(ifcModelRef.current);
        }
        
        // Center model
        const box = new THREE.Box3().setFromObject(ifcModel);
        const center = box.getCenter(new THREE.Vector3());
        ifcModel.position.sub(center);
        
        sceneRef.current?.add(ifcModel);
        ifcModelRef.current = ifcModel as unknown as THREE.Mesh;

        // Auto-fit camera
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (cameraRef.current && controlsRef.current) {
          const distance = maxDim * 2;
          cameraRef.current.position.set(distance, distance * 0.7, distance);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        setLoaded(true);
        setModelName(file.name);
        toast.success(`Modelo IFC cargado: ${file.name}`);
      }
    } catch (err) {
      console.error('Error loading IFC:', err);
      toast.error('Error al cargar el modelo IFC. Asegúrate de que sea un archivo .ifc válido.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      toast.error('Solo se admiten archivos .ifc');
      return;
    }
    loadIFCFile(file);
    e.target.value = '';
  };

  const toggleSection = () => {
    if (!sceneRef.current || !ifcModelRef.current) return;
    setSectionMode(prev => {
      if (!prev) {
        // Enable clipping
        const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        const clipPlanes = [plane];
        ifcModelRef.current?.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = child.material.clone();
            child.material.clippingPlanes = clipPlanes;
            child.material.clipShadows = true;
            child.material.needsUpdate = true;
          }
        });
        setClipPlane(plane);
        if (rendererRef.current) rendererRef.current.localClippingEnabled = true;
        return true;
      } else {
        // Disable clipping
        ifcModelRef.current?.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material.clippingPlanes = [];
            child.material.needsUpdate = true;
          }
        });
        setClipPlane(null);
        if (rendererRef.current) rendererRef.current.localClippingEnabled = false;
        return false;
      }
    });
  };

  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(10, 10, 10);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
      toast.info(controlsRef.current.autoRotate ? 'Rotación automática activada' : 'Rotación automática desactivada');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`flex flex-col ${className || ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-slate-800 text-white rounded-t-xl flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-xs font-medium"
        >
          <Upload className="w-3.5 h-3.5" /> Cargar IFC
        </button>
        <input ref={fileInputRef} type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
        <div className="w-px h-6 bg-slate-600" />
        <button onClick={resetView} className="p-1.5 hover:bg-slate-700 rounded-lg" title="Resetear vista">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button onClick={toggleAutoRotate} className="p-1.5 hover:bg-slate-700 rounded-lg" title="Rotación automática">
          <Rotate3d className="w-4 h-4" />
        </button>
        <button
          onClick={toggleSection}
          className={`p-1.5 rounded-lg ${sectionMode ? 'bg-orange-500 text-white' : 'hover:bg-slate-700'}`}
          title="Corte seccional"
        >
                        <Box className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        {loaded && (
          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{modelName}</span>
        )}
      </div>

      {/* Viewport */}
      <div ref={containerRef} className="flex-1 min-h-[400px] bg-slate-100 rounded-b-xl relative">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Box className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-sm font-medium">Visor IFC 3D</p>
            <p className="text-xs mt-1">Carga un archivo .ifc para visualizar el modelo BIM</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
            >
              <Upload className="w-4 h-4 inline mr-1.5" /> Seleccionar archivo .ifc
            </button>
          </div>
        )}
        {loaded && (
          <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-1 rounded">
            🖱️ Orbitar · Rueda: Zoom · Click derecho: Panorámica
          </div>
        )}
      </div>
    </div>
  );
};

export default IFCViewer;