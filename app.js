// 3D Model Viewer Application
// Using traditional script loading for GitHub Pages compatibility

class ModelViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isLoading = true;
        this.hasError = false;
        this.animationId = null;
        this.librariesLoaded = false;
        
        // DOM elements
        this.canvas = document.getElementById('threejs-canvas');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.errorScreen = document.getElementById('errorScreen');
        this.loadingProgress = document.getElementById('loadingProgress');
        this.modelStatus = document.getElementById('modelStatus');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.checkLibrariesAndInit();
    }
    
    checkLibrariesAndInit() {
        // Check if all required libraries are loaded
        if (typeof THREE !== 'undefined') {
            console.log('Three.js 메인 라이브러리 로드됨');
            this.librariesLoaded = true;
            this.init();
        } else {
            console.log('Three.js 라이브러리를 기다리는 중...');
            setTimeout(() => this.checkLibrariesAndInit(), 500);
        }
    }
    
    init() {
        try {
            this.updateLoadingProgress('3D 환경 초기화 중...');
            
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLights();
            this.setupControls();
            this.setupEventListeners();
            
            // Always load the fallback first, then try to load the model
            this.createFallbackGeometry();
            this.loadModel();
            this.animate();
            
        } catch (error) {
            console.error('초기화 오류:', error);
            this.handleInitializationError(error);
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    }
    
    setupCamera() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        
        const width = this.canvas.clientWidth || 800;
        const height = this.canvas.clientHeight || 600;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Set encoding if available
        if (this.renderer.outputEncoding !== undefined) {
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
        if (this.renderer.toneMapping !== undefined) {
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;
        }
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        
        // Shadow settings
        if (directionalLight.shadow) {
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -10;
            directionalLight.shadow.camera.right = 10;
            directionalLight.shadow.camera.top = 10;
            directionalLight.shadow.camera.bottom = -10;
        }
        this.scene.add(directionalLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x32b8c6, 0.3);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);
        
        // Point light for accent
        const pointLight = new THREE.PointLight(0x32b8c6, 0.5, 20);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }
    
    setupControls() {
        // Check if OrbitControls is available
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 2;
            this.controls.maxDistance = 20;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.autoRotate = false;
            this.controls.autoRotateSpeed = 0.5;
        } else {
            console.warn('OrbitControls를 사용할 수 없습니다. 기본 카메라 제어를 사용합니다.');
        }
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse click detection
        this.canvas.addEventListener('click', (event) => this.onCanvasClick(event));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (event) => this.onTouchStart(event));
        
        // Keyboard controls
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
    }
    
    async loadModel() {
        this.updateLoadingProgress('3D 모델을 불러오는 중...');
        
        try {
            // Check if GLTFLoader is available
            if (typeof THREE.GLTFLoader === 'undefined') {
                throw new Error('GLTFLoader가 사용할 수 없습니다.');
            }
            
            const loader = new THREE.GLTFLoader();
            
            // Set a timeout for loading
            const loadingTimeout = setTimeout(() => {
                this.onLoadError(new Error('모델 로딩 시간 초과'));
            }, 10000);
            
            // Load with progress tracking
            loader.load(
                './models/a.glb',
                (gltf) => {
                    clearTimeout(loadingTimeout);
                    this.onModelLoaded(gltf);
                },
                (progress) => this.onLoadProgress(progress),
                (error) => {
                    clearTimeout(loadingTimeout);
                    this.onLoadError(error);
                }
            );
            
        } catch (error) {
            this.onLoadError(error);
        }
    }
    
    onModelLoaded(gltf) {
        console.log('모델이 성공적으로 로드되었습니다:', gltf);
        
        // Remove fallback cube
        if (this.model) {
            this.scene.remove(this.model);
        }
        
        this.model = gltf.scene;
        
        // Scale and center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Scale model to fit in view
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        this.model.scale.setScalar(scale);
        
        // Center the model
        this.model.position.sub(center.multiplyScalar(scale));
        
        // Enable shadows
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Enhance materials
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });
        
        this.scene.add(this.model);
        
        // Start any animations if they exist
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);
            gltf.animations.forEach((clip) => {
                this.mixer.clipAction(clip).play();
            });
        }
        
        this.hideLoading();
        this.updateModelStatus('실제 모델 로드됨', 'success');
        this.hasError = false;
    }
    
    onLoadProgress(progress) {
        if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            this.updateLoadingProgress(`로딩 중... ${Math.round(percentComplete)}%`);
        }
    }
    
    onLoadError(error) {
        console.error('모델 로딩 실패:', error);
        
        this.hasError = true;
        
        // The fallback is already loaded, just update the status
        this.hideLoading();
        this.updateModelStatus('기본 큐브 표시됨', 'warning');
        
        // Show brief error message
        this.showError('GLB 파일을 찾을 수 없습니다. 예시 큐브를 표시합니다.');
    }
    
    createFallbackGeometry() {
        // Create a colorful cube as fallback
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const materials = [
            new THREE.MeshLambertMaterial({ color: 0x1FB8CD }), // Right
            new THREE.MeshLambertMaterial({ color: 0xFFC185 }), // Left
            new THREE.MeshLambertMaterial({ color: 0xB4413C }), // Top
            new THREE.MeshLambertMaterial({ color: 0xECEBD5 }), // Bottom
            new THREE.MeshLambertMaterial({ color: 0x5D878F }), // Front
            new THREE.MeshLambertMaterial({ color: 0xDB4545 })  // Back
        ];
        
        this.model = new THREE.Mesh(geometry, materials);
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        
        // Add ground plane
        this.addGroundPlane();
        
        this.scene.add(this.model);
        
        // Add rotation animation to the cube
        this.model.userData.rotate = true;
        
        this.hideLoading();
        this.updateModelStatus('기본 큐브 로드됨', 'info');
    }
    
    addGroundPlane() {
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -2;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }
    
    onCanvasClick(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.model) {
            const intersects = this.raycaster.intersectObject(this.model, true);
            if (intersects.length > 0) {
                this.onModelClick(intersects[0]);
            }
        }
    }
    
    onModelClick(intersection) {
        console.log('모델 클릭됨:', intersection);
        
        // Create click effect
        this.createClickEffect(intersection.point);
        
        // Show alert
        const modelType = this.hasError ? '기본 큐브' : '3D 모델';
        alert(`${modelType}을 클릭했습니다! 👍\n좌표: ` + 
              `x: ${intersection.point.x.toFixed(2)}, ` +
              `y: ${intersection.point.y.toFixed(2)}, ` +
              `z: ${intersection.point.z.toFixed(2)}`);
    }
    
    createClickEffect(position) {
        // Create a temporary sphere at click position
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x32b8c6, 
            transparent: true, 
            opacity: 1 
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        this.scene.add(sphere);
        
        // Animate the sphere
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 1000; // 1 second animation
            
            if (progress < 1) {
                sphere.scale.setScalar(1 + progress * 2);
                sphere.material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(sphere);
                geometry.dispose();
                material.dispose();
            }
        };
        animate();
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            // Handle single touch as click
            const touch = event.touches[0];
            const clickEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            this.onCanvasClick(clickEvent);
        }
    }
    
    onKeyDown(event) {
        if (!this.controls) return;
        
        switch (event.code) {
            case 'KeyR':
                // Reset camera position
                this.camera.position.set(5, 5, 5);
                this.controls.target.set(0, 0, 0);
                this.controls.update();
                break;
            case 'KeyA':
                // Toggle auto-rotate
                this.controls.autoRotate = !this.controls.autoRotate;
                break;
            case 'Space':
                event.preventDefault();
                // Toggle auto-rotate with spacebar
                this.controls.autoRotate = !this.controls.autoRotate;
                break;
        }
    }
    
    onWindowResize() {
        const width = this.canvas.clientWidth || 800;
        const height = this.canvas.clientHeight || 600;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Update animations
        if (this.mixer) {
            this.mixer.update(0.016); // 60fps
        }
        
        // Rotate fallback cube if it exists
        if (this.model && this.model.userData.rotate) {
            this.model.rotation.x += 0.01;
            this.model.rotation.y += 0.01;
        }
        
        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    updateLoadingProgress(text) {
        if (this.loadingProgress) {
            this.loadingProgress.textContent = text;
        }
    }
    
    updateModelStatus(status, type = 'info') {
        if (this.modelStatus) {
            this.modelStatus.textContent = status;
            this.modelStatus.className = `stat-value status--${type}`;
        }
    }
    
    hideLoading() {
        this.isLoading = false;
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
        if (this.canvasContainer) {
            this.canvasContainer.style.display = 'block';
        }
    }
    
    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        if (this.errorScreen) {
            this.errorScreen.classList.remove('hidden');
        }
        
        // Hide error screen after 3 seconds
        setTimeout(() => {
            if (this.errorScreen) {
                this.errorScreen.classList.add('hidden');
            }
        }, 3000);
    }
    
    handleInitializationError(error) {
        console.error('초기화 실패:', error);
        this.updateLoadingProgress('초기화 실패 - 기본 화면 표시');
        this.showError('3D 환경 초기화에 실패했습니다.');
        this.hideLoading();
    }
    
    dispose() {
        // Clean up resources
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }
}

// Global retry function
function retryLoading() {
    if (window.viewer) {
        window.viewer.dispose();
    }
    
    // Reset UI
    const errorScreen = document.getElementById('errorScreen');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (errorScreen) errorScreen.classList.add('hidden');
    if (loadingScreen) loadingScreen.classList.remove('hidden');
    
    // Create new viewer instance
    setTimeout(() => {
        window.viewer = new ModelViewer();
    }, 100);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드됨 - 앱 초기화 중...');
    
    // Initialize immediately if Three.js is available, otherwise the class will wait
    window.viewer = new ModelViewer();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.viewer) {
        window.viewer.dispose();
    }
});