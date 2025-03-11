import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const ModelLoader = ({ url }) => {
    const [error, setError] = useState(null);
    const groupRef = useRef();
  
    useEffect(() => {
      if (!url) return;
  
      const controller = new AbortController();
      const { signal } = controller;
  
      console.log(`Loading model from ${url}`);
  
      fetch(url, { 
        headers: { 'Accept': 'application/octet-stream' },
        signal 
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then(buffer => {
          const isOBJ = url.toLowerCase().endsWith('.obj');
          const isSTL = url.toLowerCase().endsWith('.stl');
          
          if (isOBJ) {
            loadOBJModel(buffer);
          } else if (isSTL) {
            loadSTLModel(buffer);
          } else {
            setError('Unsupported file format. Only OBJ and STL are supported.');
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error('Error loading model:', err);
            setError(`Error loading model: ${err.message}`);
          }
        });
  
      const loadOBJModel = (buffer) => {
        import('three/examples/jsm/loaders/OBJLoader').then(({ OBJLoader }) => {
          try {
            const blob = new Blob([buffer]);
            const objectURL = URL.createObjectURL(blob);
  
            const loader = new OBJLoader();
            loader.load(
              objectURL,
              (object) => {
                console.log('OBJ loaded successfully:');
                
                object.traverse(child => {
                  if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshPhongMaterial({
                      color: 0x7c9cb0,
                      shininess: 30,
                      side: THREE.DoubleSide
                    });
                    
                    if (child.geometry) {
                      child.geometry.computeVertexNormals();
                    }
                  }
                });
  
                clearGroup();
                
                groupRef.current.add(object);
                
                orientModelVertically(object);
                
                URL.revokeObjectURL(objectURL);
              },
              (xhr) => {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
              },
              (err) => {
                console.error('Error loading OBJ:', err);
                setError(`Error loading OBJ: ${err.message}`);
                URL.revokeObjectURL(objectURL);
              }
            );
          } catch (err) {
            console.error('Error processing OBJ:', err);
            setError(`Error processing OBJ: ${err.message}`);
          }
        });
      };
  
      const loadSTLModel = (buffer) => {
        import('three/examples/jsm/loaders/STLLoader').then(({ STLLoader }) => {
          try {
            const loader = new STLLoader();
            const geometry = loader.parse(buffer);
            
            const material = new THREE.MeshPhongMaterial({
              color: 0x7c9cb0,
              shininess: 30,
              side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            
            clearGroup();
            
            groupRef.current.add(mesh);
            
            orientModelVertically(mesh);
          } catch (err) {
            console.error('Error processing STL:', err);
            setError(`Error processing STL: ${err.message}`);
          }
        });
      };

      const clearGroup = () => {
        if (groupRef.current) {
          while (groupRef.current.children.length > 0) {
            const child = groupRef.current.children[0];
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
            groupRef.current.remove(child);
          }
        }
      };
  
      const orientModelVertically = (object) => {
        const boundingBox = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        object.position.sub(center);
        
        object.rotation.x = -Math.PI / 2;
        
        boundingBox.setFromObject(object);
        boundingBox.getCenter(center);
        boundingBox.getSize(size);
        
        object.position.sub(center);
        
        fitCameraToObject(object);
      };
  
        const fitCameraToObject = (object) => {
        const boundingBox = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        const scene = groupRef.current.parent;
        if (!scene) return;
        
        let camera = null;
        scene.traverse(child => {
          if (child instanceof THREE.Camera) {
            camera = child;
          }
        });
        
        if (!camera) return;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
        
        cameraDistance *= 1.5;
        
        const cameraPosition = new THREE.Vector3(1, 0.7, 1);
        cameraPosition.normalize().multiplyScalar(cameraDistance);
        camera.position.copy(cameraPosition);
        
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        
        const controls = scene.userData.controls;
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }
      };
  
      return () => {
        controller.abort();
        clearGroup();
      };
    }, [url]);
  
    return (
      <>
        {error && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              left: '10px', 
              backgroundColor: 'rgba(255, 0, 0, 0.7)', 
              color: 'white', 
              padding: '10px', 
              borderRadius: '5px',
              zIndex: 100
            }}
          >
            {error}
          </div>
        )}
        <group ref={groupRef} />
      </>
    );
  };

function ModelViewer({ modelUrl }) {
  const controlsRef = useRef();
  
  const handleSceneCreated = ({scene, camera}) => {
    if (controlsRef.current) {
      scene.userData.controls = controlsRef.current;
    }
  };

  return (
    <div className="h-[650px] relative">
      <Canvas
        gl={{ antialias: true }}
        camera={{ position: [5, 5, 5], fov: 45 }}
        onCreated={handleSceneCreated}
      >
  
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.7} />
        <directionalLight position={[-10, -10, -10]} intensity={0.3} />
    
        {/* Model content */}
        <Suspense fallback={null}>
          {modelUrl && <ModelLoader url={modelUrl} />}
        </Suspense>
        
        {/* Controls */}
        <OrbitControls 
          ref={controlsRef}
          enableDamping
          dampingFactor={0.25}
        />
      </Canvas>
  
      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 pointer-events-none">
          <p className="text-gray-600 text-lg">Upload a model to view</p>
        </div>
      )}
    </div>
  );
}

export default ModelViewer;