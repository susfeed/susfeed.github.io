const Engine = {
    scene: null, camera: null, renderer: null, controls: null,
    raycaster: null, mouse: new THREE.Vector2(0, 0),
    colliders: [], interactables: [], npcs: [], allNpcData: [],
    velocity: new THREE.Vector3(), direction: new THREE.Vector3(),
    velocityY: 0, canJump: true,
    moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
    sprinting: false, prevTime: performance.now(),
    inRange: false, currentPrompt: null, currentInteractable: null,
    exitTarget: null, config: {}, frozen: false, frozenTarget: null,
    overlayOpen: false,

    GRAVITY: 30, JUMP_FORCE: 9, WALK_SPEED: 12, SPRINT_MULT: 1.75, PLAYER_HEIGHT: 1.7,

    init: function(config) {
        this.config = config || {};
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.bgColor || 0x0a0e14);
        if (this.config.fog) {
            this.scene.fog = new THREE.Fog(this.config.bgColor, this.config.fogNear || 30, this.config.fogFar || 90);
        }
        this.camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 500);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        document.body.appendChild(this.renderer.domElement);

        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.scene.add(this.controls.getObject());
        this.controls.getObject().position.set(
            this.config.startX || 0, this.PLAYER_HEIGHT, this.config.startZ || 0
        );

        this.raycaster = new THREE.Raycaster();
        this.currentPrompt = document.getElementById('prompt');
        this.setupControls();
        this.setupLights();
    },

    setupLights: function() {
        this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2a1a, 0.8));
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
        const sun = new THREE.DirectionalLight(0xfff0d0, 0.7);
        sun.position.set(8, 18, 12);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = -25;
        sun.shadow.camera.right = 25;
        sun.shadow.camera.top = 25;
        sun.shadow.camera.bottom = -25;
        sun.shadow.bias = -0.0003;
        sun.shadow.normalBias = 0.02;
        this.scene.add(sun);
    },

    setupControls: function() {
        const overlay = document.getElementById('overlay');
        const that = this;

        overlay.addEventListener('click', () => {
            if (!that.overlayOpen) that.controls.lock();
        });
        that.controls.addEventListener('lock', () => {
            if (!that.overlayOpen) overlay.style.display = 'none';
        });
        that.controls.addEventListener('unlock', () => {
            if (!that.overlayOpen) overlay.style.display = 'flex';
        });

        document.addEventListener('keydown', (event) => {
            if (that.overlayOpen) {
                if (event.code === 'Escape') that.closeOverlay();
                return;
            }
            if (!that.controls.isLocked || that.frozen) return;
            switch (event.code) {
                case 'KeyW': case 'ArrowUp': that.moveForward = true; break;
                case 'KeyS': case 'ArrowDown': that.moveBackward = true; break;
                case 'KeyA': case 'ArrowLeft': that.moveLeft = true; break;
                case 'KeyD': case 'ArrowRight': that.moveRight = true; break;
                case 'ShiftLeft': case 'ShiftRight': that.sprinting = true; break;
                case 'Space':
                    if (that.canJump) { that.velocityY = that.JUMP_FORCE; that.canJump = false; }
                    event.preventDefault();
                    break;
                case 'KeyE':
                    if (that.inRange && that.currentInteractable && that.currentInteractable.userData.onInteract) {
                        that.currentInteractable.userData.onInteract(that.currentInteractable);
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': case 'ArrowUp': that.moveForward = false; break;
                case 'KeyS': case 'ArrowDown': that.moveBackward = false; break;
                case 'KeyA': case 'ArrowLeft': that.moveLeft = false; break;
                case 'KeyD': case 'ArrowRight': that.moveRight = false; break;
                case 'ShiftLeft': case 'ShiftRight': that.sprinting = false; break;
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (event.button !== 0 || !that.controls.isLocked || that.frozen) return;
            that.raycaster.setFromCamera(that.mouse, that.camera);
            const hits = that.raycaster.intersectObjects(that.interactables);
            if (hits.length > 0 && hits[0].distance < 10) {
                const obj = hits[0].object;
                if (obj.userData.onInteract) obj.userData.onInteract(obj);
            }
        });
    },

    openOverlay: function(path) {
        const modal = document.getElementById('viewer-modal');
        const iframe = document.getElementById('viewer-frame');
        if (!modal || !iframe) return;
        iframe.src = path;
        modal.style.display = 'flex';
        this.overlayOpen = true;
        this.setFrozen(true);
        if (document.pointerLockElement) document.exitPointerLock();
    },

    closeOverlay: function() {
        const modal = document.getElementById('viewer-modal');
        const iframe = document.getElementById('viewer-frame');
        if (!modal || !iframe) return;
        iframe.src = 'about:blank';
        modal.style.display = 'none';
        this.overlayOpen = false;
        this.setFrozen(false);
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'none';
        this.controls.lock();
    },

    addCollider: function(x, z, r) { this.colliders.push({ x, z, r }); },

    addInteractable: function(obj, data) {
        obj.userData = Object.assign(obj.userData || {}, data);
        if (obj.userData.isExit && this.exitTarget) {
            const t = this.exitTarget;
            obj.userData.onInteract = function() {
                if (t.spawnKey) sessionStorage.setItem('spawnOutside', t.spawnKey);
                window.location.href = t.path;
            };
        }
        if (!this.interactables.includes(obj)) this.interactables.push(obj);
    },

    setExitTarget: function(path, spawnKey) {
        this.exitTarget = { path: path, spawnKey: spawnKey || null };
    },

    setFrozen: function(state, target) {
        this.frozen = state;
        if (state) {
            this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = this.sprinting = false;
            this.velocity.set(0, 0, 0);
            this.velocityY = 0;
            if (target) this.frozenTarget = target;
        } else {
            this.frozenTarget = null;
        }
    },

    createTextTexture: function(text, bgColor, textColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = textColor;
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = '#' + bgColor.toString(16).padStart(6, '0');
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 66);
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 8;
        return tex;
    },

    loadNPCs: function(names, basePath, positions) {
        const loader = new THREE.TextureLoader();
        const that = this;
        names.forEach((name) => that.allNpcData.push({ name, texture: null, loaded: false, inUse: false }));
        that.allNpcData.forEach((data, index) => {
            loader.load(`${basePath}${data.name}`, (texture) => {
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.LinearFilter;
                data.texture = texture;
                data.loaded = true;
                that.spawnNPC(index, positions);
            });
        });
    },

    spawnNPC: function(index, positions) {
        const data = this.allNpcData[index];
        if (!data || !data.loaded || data.inUse) return;
        data.inUse = true;

        const material = new THREE.SpriteMaterial({ map: data.texture, transparent: true, alphaTest: 0.05, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2.2, 3.2, 1);

        let x, z;
        if (positions && positions[index]) { x = positions[index][0]; z = positions[index][1]; }
        else { const a = Math.random() * Math.PI * 2; const r = 5 + Math.random() * 10; x = Math.cos(a) * r; z = Math.sin(a) * r; }

        sprite.position.set(x, 1.6, z);
        const speed = 0.02 + Math.random() * 0.03;
        const dir = Math.random() * Math.PI * 2;

        sprite.userData = {
            data, speedX: Math.cos(dir) * speed, speedZ: Math.sin(dir) * speed,
            changeTimer: 3 + Math.random() * 5, homeX: x, homeZ: z
        };

        this.scene.add(sprite);
        this.npcs.push(sprite);
    },

    updateNPCs: function(delta) {
        const that = this;
        this.npcs.forEach((npc) => {
            const ud = npc.userData;
            ud.changeTimer -= delta;
            if (ud.changeTimer <= 0) {
                const a = Math.random() * Math.PI * 2;
                const s = 0.015 + Math.random() * 0.025;
                ud.speedX = Math.cos(a) * s;
                ud.speedZ = Math.sin(a) * s;
                ud.changeTimer = 3 + Math.random() * 5;
            }
            npc.position.x += ud.speedX;
            npc.position.z += ud.speedZ;

            const dxH = npc.position.x - ud.homeX;
            const dzH = npc.position.z - ud.homeZ;
            if (Math.sqrt(dxH * dxH + dzH * dzH) > 12) {
                ud.speedX *= -1; ud.speedZ *= -1;
                npc.position.x += ud.speedX * 2;
                npc.position.z += ud.speedZ * 2;
            }

            if (that.config.bounds) {
                const b = that.config.bounds;
                if (npc.position.x < b.minX || npc.position.x > b.maxX) ud.speedX *= -1;
                if (npc.position.z < b.minZ || npc.position.z > b.maxZ) ud.speedZ *= -1;
                npc.position.x = Math.max(b.minX, Math.min(b.maxX, npc.position.x));
                npc.position.z = Math.max(b.minZ, Math.min(b.maxZ, npc.position.z));
            }

            that.colliders.forEach(c => {
                const dx = npc.position.x - c.x;
                const dz = npc.position.z - c.z;
                const d = Math.sqrt(dx * dx + dz * dz);
                if (d < c.r + 0.8 && d > 0) {
                    const nx = dx / d, nz = dz / d;
                    npc.position.x = c.x + nx * (c.r + 0.8);
                    npc.position.z = c.z + nz * (c.r + 0.8);
                    const dot = ud.speedX * nx + ud.speedZ * nz;
                    ud.speedX -= 2 * dot * nx;
                    ud.speedZ -= 2 * dot * nz;
                }
            });
        });
    },

    updatePlayer: function(delta) {
        const player = this.controls.getObject();

        if (this.frozen) {
            if (this.frozenTarget) {
                const dx = this.frozenTarget.x - player.position.x;
                const dz = this.frozenTarget.z - player.position.z;
                const d = Math.sqrt(dx * dx + dz * dz);
                if (d > 0.3) {
                    player.position.x += (dx / d) * 3 * delta;
                    player.position.z += (dz / d) * 3 * delta;
                }
            }
            return;
        }

        this.velocity.x -= this.velocity.x * 10 * delta;
        this.velocity.z -= this.velocity.z * 10 * delta;
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const s = this.sprinting ? this.WALK_SPEED * this.SPRINT_MULT : this.WALK_SPEED;
        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * s * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * s * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.velocityY -= this.GRAVITY * delta;
        player.position.y += this.velocityY * delta;
        if (player.position.y < this.PLAYER_HEIGHT) {
            player.position.y = this.PLAYER_HEIGHT;
            this.velocityY = 0; this.canJump = true;
        }

        this.colliders.forEach(c => {
            const dx = player.position.x - c.x;
            const dz = player.position.z - c.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            const m = c.r - 0.6;
            if (d < m && d > 0) {
                player.position.x = c.x + (dx / d) * m;
                player.position.z = c.z + (dz / d) * m;
            }
        });

        if (this.config.bounds) {
            const b = this.config.bounds;
            player.position.x = Math.max(b.minX, Math.min(b.maxX, player.position.x));
            player.position.z = Math.max(b.minZ, Math.min(b.maxZ, player.position.z));
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.interactables);
        let looking = false;
        if (hits.length > 0 && hits[0].distance < 10) {
            looking = true;
            this.currentInteractable = hits[0].object;
            if (this.currentPrompt) this.currentPrompt.style.display = 'block';
            this.inRange = true;
        } else {
            this.inRange = false;
            this.currentInteractable = null;
            if (this.currentPrompt) this.currentPrompt.style.display = 'none';
        }

        const ch = document.getElementById('crosshair');
        if (ch) {
            if (looking) ch.classList.add('active');
            else ch.classList.remove('active');
        }
    },

    animate: function() {
        requestAnimationFrame(() => this.animate());
        const time = performance.now();
        const delta = Math.min((time - this.prevTime) / 1000, 0.1);
        if (this.controls.isLocked || this.frozen) this.updatePlayer(delta);
        this.updateNPCs(delta);
        this.prevTime = time;
        this.renderer.render(this.scene, this.camera);
    },

    start: function() {
        this.animate();
        addEventListener('resize', () => {
            this.camera.aspect = innerWidth / innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
        });
    }
};