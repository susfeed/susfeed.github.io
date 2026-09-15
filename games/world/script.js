const SPRITE_NAMES = [
    'neil.png', 'cam.png', 'smeff.png', 'chip.png', 'sara.png', 'phil.png',
    'red.png', 'olivia.png', 'lukas.png', 'andrew.png', 'evilandrew.png',
    'ellie.png', 'johnsusfeed.png', 'antonio.png', 'chog e choggers.png',
    'takochan.png', 'ringo.png', 'delicious.png', 'furret.png', 'kaeru.png',
    'wokeler.png', 'pikmin.png', 'karaagekun.png', 'sister.png', 'howard.png', 'sylus.png'
];

const INTERIOR_PATHS = {
    'YOUR HOUSE': 'interiors/house.html',
    'BOOKSTORE': 'interiors/bookstore.html',
    'LIBRARY': 'interiors/library.html',
    'CINEMA': 'interiors/cinema.html',
    'SUSFEED HQ': 'interiors/hq.html'
};

const EXIT_SPAWNS = {
    'YOUR HOUSE': { x: 0, z: 44 },
    'BOOKSTORE': { x: 15, z: -6 },
    'LIBRARY': { x: -12, z: 7 },
    'CINEMA': { x: 12, z: 7 },
    'SUSFEED HQ': { x: 0, z: -27 }
};

const TOWN_RADIUS = 42;
const ROAD_WIDTH = 10;

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let sprinting = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let velocityY = 0;
let canJump = true;
const GRAVITY = 30;
const JUMP_FORCE = 9;
const WALK_SPEED = 14;
const SPRINT_MULT = 1.85;
const PLAYER_HEIGHT = 1.7;
let prevTime = performance.now();
let raycaster, mouse;
let doors = [];
let npcs = [];
let allNpcData = [];
let colliders = [];
let crosshair;
let car;
let carPrompt;
let inCarRange = false;
let carMesh;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fc9e8);
    scene.fog = new THREE.Fog(0x9fc9e8, 60, 200);

    camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 500);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    const spawnOutside = sessionStorage.getItem('spawnOutside');
    if (spawnOutside && EXIT_SPAWNS[spawnOutside]) {
        const spawn = EXIT_SPAWNS[spawnOutside];
        controls.getObject().position.set(spawn.x, PLAYER_HEIGHT, spawn.z);
        sessionStorage.removeItem('spawnOutside');
    } else {
        controls.getObject().position.set(0, PLAYER_HEIGHT, 45);
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(0, 0);
    crosshair = document.getElementById('crosshair');
    carPrompt = document.getElementById('prompt');

    setupLights();
    setupWorld();
    setupBuildings();
    setupCar();
    setupNPCs();
    setupControls();

    window.addEventListener('resize', onWindowResize, false);
}

function setupLights() {
    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5a6e42, 0.85);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0cc, 0.75);
    sun.position.set(35, 70, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xa8c8ff, 0.25);
    fill.position.set(-30, 25, -20);
    scene.add(fill);

    const ambient = new THREE.AmbientLight(0xffffff, 0.12);
    scene.add(ambient);
}

function makeSignTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FDF6E3';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 10;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.fillStyle = '#3a2410';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
}

function addDoorAndSign(group, w, h, d, name, showSign = true) {
    const doorW = 2.2, doorH = 3.6;
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, doorH, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x5a3a1c })
    );
    door.position.set(0, doorH / 2, d / 2 - 0.05);
    door.castShadow = true;
    door.userData = { isDoor: true, name: name, path: INTERIOR_PATHS[name] };
    group.add(door);
    doors.push(door);

    const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffd966 })
    );
    handle.position.set(doorW / 2 - 0.3, doorH / 2, d / 2 + 0.12);
    group.add(handle);

    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.4, doorH + 0.3, 0.15),
        new THREE.MeshLambertMaterial({ color: 0x3a2410 })
    );
    frame.position.set(0, doorH / 2, d / 2 + 0.02);
    group.add(frame);

    if (showSign) {
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(5.5, 1.375),
            new THREE.MeshBasicMaterial({ map: makeSignTexture(name) })
        );
        sign.position.set(0, doorH + 1.4, d / 2 + 0.06);
        group.add(sign);
    }
}

function makeHouse(x, z, ry) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = ry;

    const W = 8, H = 5, D = 8;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xf5c2cc });

    const walls = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat);
    walls.position.y = H / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    const roofShape = new THREE.Shape();
    roofShape.moveTo(-W / 2 - 0.6, 0);
    roofShape.lineTo(W / 2 + 0.6, 0);
    roofShape.lineTo(0, 3);
    roofShape.lineTo(-W / 2 - 0.6, 0);
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: D + 1.2, bevelEnabled: false });
    roofGeo.translate(0, 0, -(D + 1.2) / 2);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0x8b2424 }));
    roof.position.y = H;
    roof.castShadow = true;
    group.add(roof);

    const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 2.8, 0.9),
        new THREE.MeshLambertMaterial({ color: 0x6b3410 })
    );
    chimney.position.set(-W / 3, H + 2, -D / 3);
    chimney.castShadow = true;
    group.add(chimney);

    const winMat = new THREE.MeshLambertMaterial({ color: 0xa8d8ff, emissive: 0x2a4a6a });
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.15), winMat);
    win1.position.set(-W / 2 - 0.01, H / 2 + 0.4, D / 4);
    win1.rotation.y = -Math.PI / 2;
    group.add(win1);
    const win2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.15), winMat);
    win2.position.set(-W / 2 - 0.01, H / 2 + 0.4, -D / 4);
    win2.rotation.y = -Math.PI / 2;
    group.add(win2);

    addDoorAndSign(group, W, H, D, 'YOUR HOUSE', false);

    scene.add(group);
    colliders.push({ x, z, r: Math.max(W, D) / 2 + 1.5 });
}

function makeBookstore(x, z, ry) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = ry;

    const W = 10, H = 7, D = 10;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x7a4a2a });

    const walls = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat);
    walls.position.y = H / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(W + 1, 0.6, D + 1),
        new THREE.MeshLambertMaterial({ color: 0x3a2010 })
    );
    roof.position.y = H + 0.3;
    roof.castShadow = true;
    group.add(roof);

    const awning = new THREE.Mesh(
        new THREE.BoxGeometry(W - 0.5, 0.2, 2.4),
        new THREE.MeshLambertMaterial({ color: 0x2e6b3c })
    );
    awning.position.set(0, 3.6, D / 2 + 1);
    awning.rotation.x = -0.28;
    awning.castShadow = true;
    group.add(awning);

    const displayMat = new THREE.MeshLambertMaterial({ color: 0xffe9a8, emissive: 0x554020 });
    const display = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 0.15), displayMat);
    display.position.set(0, 2.4, D / 2 + 0.02);
    group.add(display);

    addDoorAndSign(group, W, H, D, 'BOOKSTORE');

    scene.add(group);
    colliders.push({ x, z, r: Math.max(W, D) / 2 + 1.5 });
}

function makeLibrary(x, z, ry) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = ry;

    const W = 16, H = 11, D = 14;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xe8dcc4 });

    const walls = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat);
    walls.position.y = H / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(W + 1.4, 0.7, D + 1.4),
        new THREE.MeshLambertMaterial({ color: 0x9a8a5a })
    );
    roof.position.y = H + 0.35;
    roof.castShadow = true;
    group.add(roof);

    const pedShape = new THREE.Shape();
    pedShape.moveTo(-W / 2 - 0.6, 0);
    pedShape.lineTo(W / 2 + 0.6, 0);
    pedShape.lineTo(0, 2.6);
    pedShape.lineTo(-W / 2 - 0.6, 0);
    const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 1.5, bevelEnabled: false });
    pedGeo.translate(0, 0, -0.75);
    const pediment = new THREE.Mesh(pedGeo, wallMat);
    pediment.position.set(0, H + 0.7, D / 2);
    pediment.castShadow = true;
    group.add(pediment);

    const colMat = new THREE.MeshLambertMaterial({ color: 0xfaf5e6 });
    for (let i = -1; i <= 1; i++) {
        if (i === 0) continue;
        const colX = i * 5.5;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, H, 16), colMat);
        col.position.set(colX, H / 2, D / 2 + 1.6);
        col.castShadow = true;
        col.receiveShadow = true;
        group.add(col);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), colMat);
        cap.position.set(colX, H - 0.25, D / 2 + 1.6);
        cap.castShadow = true;
        group.add(cap);

        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), colMat);
        base.position.set(colX, 0.25, D / 2 + 1.6);
        group.add(base);
    }

    const entab = new THREE.Mesh(new THREE.BoxGeometry(W + 1, 1.2, 2.4), colMat);
    entab.position.set(0, H - 0.05, D / 2 + 0.5);
    entab.castShadow = true;
    group.add(entab);

    const stepMat = new THREE.MeshLambertMaterial({ color: 0xbfb8a8 });
    for (let i = 0; i < 3; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(W + 2 - i * 0.8, 0.4, 1.2),
            stepMat
        );
        step.position.set(0, 0.2 + i * 0.4, D / 2 + 2.6 - i * 0.55);
        step.receiveShadow = true;
        step.castShadow = true;
        group.add(step);
    }

    addDoorAndSign(group, W, H, D, 'LIBRARY');

    scene.add(group);
    colliders.push({ x, z, r: Math.max(W, D) / 2 + 2 });
}

function makeCinema(x, z, ry) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = ry;

    const W = 18, H = 9, D = 14;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x6e1010 });

    const walls = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat);
    walls.position.y = H / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(W + 1, 0.6, D + 1),
        new THREE.MeshLambertMaterial({ color: 0x2a0808 })
    );
    roof.position.y = H + 0.3;
    roof.castShadow = true;
    group.add(roof);

    const marqueeCanvas = document.createElement('canvas');
    marqueeCanvas.width = 1024;
    marqueeCanvas.height = 256;
    const mctx = marqueeCanvas.getContext('2d');
    mctx.fillStyle = '#1a0505';
    mctx.fillRect(0, 0, 1024, 256);
    for (let i = 0; i < 18; i++) {
        for (let j = 0; j < 2; j++) {
            mctx.beginPath();
            mctx.arc(30 + i * 55, 50 + j * 160, 9, 0, Math.PI * 2);
            mctx.fillStyle = '#ffe680';
            mctx.fill();
        }
    }
    mctx.fillStyle = '#ff5555';
    mctx.font = 'bold 86px Georgia, serif';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.fillText('NOW SHOWING', 512, 128);
    const mTex = new THREE.CanvasTexture(marqueeCanvas);

    const marquee = new THREE.Mesh(
        new THREE.BoxGeometry(W - 2, 3, 0.6),
        new THREE.MeshBasicMaterial({ map: mTex })
    );
    marquee.position.set(0, 7.5, D / 2 + 0.4);
    group.add(marquee);

    const marqueeFrame = new THREE.Mesh(
        new THREE.BoxGeometry(W - 1.6, 3.4, 0.2),
        new THREE.MeshLambertMaterial({ color: 0xffd966 })
    );
    marqueeFrame.position.set(0, 7.5, D / 2 + 0.18);
    group.add(marqueeFrame);

    const posterMat1 = new THREE.MeshBasicMaterial({ color: 0x2244aa });
    const poster1 = new THREE.Mesh(new THREE.BoxGeometry(3, 4.5, 0.12), posterMat1);
    poster1.position.set(-W / 2 + 3, 3.5, D / 2 + 0.05);
    group.add(poster1);

    const posterMat2 = new THREE.MeshBasicMaterial({ color: 0xaa2299 });
    const poster2 = new THREE.Mesh(new THREE.BoxGeometry(3, 4.5, 0.12), posterMat2);
    poster2.position.set(W / 2 - 3, 3.5, D / 2 + 0.05);
    group.add(poster2);

    addDoorAndSign(group, W, H, D, 'CINEMA');

    scene.add(group);
    colliders.push({ x, z, r: Math.max(W, D) / 2 + 1.5 });
}

function makeHQ(x, z, ry) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = ry;

    const W = 14, H = 30, D = 14;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x223038 });

    const walls = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat);
    walls.position.y = H / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    const glassMat = new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.55 });
    for (let i = 1; i <= 5; i++) {
        const glass = new THREE.Mesh(new THREE.BoxGeometry(W - 1.5, 2.5, D - 1.5), glassMat);
        glass.position.y = i * 5;
        group.add(glass);
    }

    const bandMat = new THREE.MeshLambertMaterial({ color: 0x101820 });
    for (let i = 1; i <= 5; i++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.5, D + 0.3), bandMat);
        band.position.y = i * 5 + 1.5;
        group.add(band);
    }

    const antennaMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 8), antennaMat);
    antenna.position.y = H + 4;
    group.add(antenna);

    const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff3030 })
    );
    beacon.position.y = H + 8;
    group.add(beacon);

    const topSign = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 2),
        new THREE.MeshBasicMaterial({ map: makeSignTexture('SUSFEED HQ') })
    );
    topSign.position.set(0, H - 2.5, D / 2 + 0.06);
    group.add(topSign);

    addDoorAndSign(group, W, H, D, 'SUSFEED HQ');

    scene.add(group);
    colliders.push({ x, z, r: Math.max(W, D) / 2 + 2 });
}

function setupBuildings() {
    makeHouse(0, 50, Math.PI);
    makeBookstore(15, -12, 0);
    makeLibrary(-20, 7, Math.PI / 2);
    makeCinema(20, 7, -Math.PI / 2);
    makeHQ(0, -35, 0);
}

function createTree(x, z, scale = 1) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4 * scale, 0.55 * scale, 3.5 * scale, 8),
        new THREE.MeshLambertMaterial({ color: 0x6b4423 })
    );
    trunk.position.y = 1.75 * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d6a3e });
    const l1 = new THREE.Mesh(new THREE.ConeGeometry(2.6 * scale, 3.4 * scale, 8), leavesMat);
    l1.position.y = 4.4 * scale;
    l1.castShadow = true;
    l1.receiveShadow = true;
    group.add(l1);

    const l2 = new THREE.Mesh(new THREE.ConeGeometry(2.1 * scale, 2.6 * scale, 8), leavesMat);
    l2.position.y = 6 * scale;
    l2.castShadow = true;
    l2.receiveShadow = true;
    group.add(l2);

    group.position.set(x, 0, z);
    scene.add(group);
}

function createBush(x, z) {
    const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.8 + Math.random() * 0.4, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0x2e5e32 })
    );
    bush.position.set(x, 0.6, z);
    bush.castShadow = true;
    bush.receiveShadow = true;
    scene.add(bush);
}

function createRock(x, z) {
    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5),
        new THREE.MeshLambertMaterial({ color: 0x777777 })
    );
    rock.position.set(x, 0.3, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
}

function createBench(x, z, ry) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 0.6), woodMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.1), woodMat);
    back.position.set(0, 0.8, -0.25);
    back.castShadow = true;
    group.add(back);

    for (let i = -1; i <= 1; i += 2) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), metalMat);
        leg.position.set(i * 0.85, 0.25, 0);
        leg.castShadow = true;
        group.add(leg);
    }

    group.position.set(x, 0, z);
    group.rotation.y = ry;
    scene.add(group);
}

function createStreetLamp(x, z, ry) {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5, 8), poleMat);
    pole.position.y = 2.5;
    pole.castShadow = true;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), poleMat);
    arm.position.set(0.5, 5, 0);
    group.add(arm);

    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), lampMat);
    lamp.position.set(1, 4.9, 0);
    group.add(lamp);

    group.position.set(x, 0, z);
    group.rotation.y = ry;
    scene.add(group);
}

function isOnRoad(x, z) {
    return (Math.abs(x) < ROAD_WIDTH / 2 + 1.5) || (Math.abs(z) < ROAD_WIDTH / 2 + 1.5);
}

function setupWorld() {
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300),
        new THREE.MeshLambertMaterial({ color: 0x4d7a3e })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, 100), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    scene.add(road);

    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(160, ROAD_WIDTH), roadMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(0, 0.02, 0);
    crossRoad.receiveShadow = true;
    scene.add(crossRoad);

    const centerLineMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4), centerLineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.03, i * 10);
        line.receiveShadow = true;
        scene.add(line);
    }
    for (let i = -6; i <= 6; i++) {
        if (i === 0) continue;
        const line = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.3), centerLineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(i * 10, 0.03, 0);
        line.receiveShadow = true;
        scene.add(line);
    }

    const curbMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const curb1 = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH + 2, 0.3, 100), curbMat);
    curb1.position.set(0, 0.15, 0);
    curb1.receiveShadow = true;
    scene.add(curb1);

    const curb2 = new THREE.Mesh(new THREE.BoxGeometry(160, 0.3, ROAD_WIDTH + 2), curbMat);
    curb2.position.set(0, 0.15, 0);
    curb2.receiveShadow = true;
    scene.add(curb2);

    const plaza = new THREE.Mesh(
        new THREE.CircleGeometry(8, 32),
        new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.04, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    const fountainBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.2, 0.6, 16),
        new THREE.MeshLambertMaterial({ color: 0x999999 })
    );
    fountainBase.position.set(0, 0.3, 0);
    fountainBase.castShadow = true;
    fountainBase.receiveShadow = true;
    scene.add(fountainBase);

    const fountainWater = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 1.7, 0.1, 16),
        new THREE.MeshLambertMaterial({ color: 0x44aaff, transparent: true, opacity: 0.7 })
    );
    fountainWater.position.set(0, 0.65, 0);
    scene.add(fountainWater);

    const fountainCenter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 1.5, 12),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    fountainCenter.position.set(0, 1.35, 0);
    fountainCenter.castShadow = true;
    scene.add(fountainCenter);

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        createBench(Math.cos(angle) * 6, Math.sin(angle) * 6, -angle + Math.PI / 2);
    }

    const lampPositions = [
        [-8, -8], [8, -8], [-8, 8], [8, 8],
        [-20, -8], [20, -8], [-20, 8], [20, 8],
        [-8, -25], [8, -25], [-8, 25], [8, 25],
        [-35, -8], [35, -8], [-35, 8], [35, 8]
    ];
    lampPositions.forEach(pos => {
        const dx = pos[0];
        const dz = pos[1];
        const distFromCenter = Math.sqrt(dx * dx + dz * dz);
        if (distFromCenter > 10 && distFromCenter < 50) {
            const ry = Math.atan2(-dx, -dz);
            createStreetLamp(pos[0], pos[1], ry);
        }
    });

    const treePositions = [
        [-30, -25], [30, -25], [-32, 18], [32, 18],
        [-15, -28], [15, -28], [-30, 0], [30, 0],
        [-8, 22], [8, 22], [-22, -15], [22, -15],
        [-38, -8], [38, -8], [-25, 30], [25, 30]
    ];
    treePositions.forEach(p => {
        if (!isOnRoad(p[0], p[1])) createTree(p[0], p[1]);
    });

    for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 42 + Math.random() * 25;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        createTree(x, z, 0.8 + Math.random() * 0.5);
    }

    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        if (!isOnRoad(x, z) && Math.abs(x) > 12 && Math.abs(z) > 12) {
            createBush(x, z);
        }
    }

    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 25 + Math.random() * 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        if (!isOnRoad(x, z) && Math.abs(x) > 12 && Math.abs(z) > 12) {
            createRock(x, z);
        }
    }

    const hillMat = new THREE.MeshLambertMaterial({ color: 0x3a6b3a });
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + 0.3;
        const dist = 75 + Math.random() * 20;
        const hill = new THREE.Mesh(
            new THREE.SphereGeometry(15 + Math.random() * 10, 12, 8),
            hillMat
        );
        hill.position.set(Math.cos(angle) * dist, -5, Math.sin(angle) * dist);
        hill.scale.y = 0.4;
        scene.add(hill);
    }
}

function setupCar() {
    const carGroup = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 4.5), bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    body.userData = { isCar: true };
    carGroup.add(body);

    const cabinMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2), cabinMat);
    cabin.position.set(0, 1.7, -0.3);
    cabin.castShadow = true;
    cabin.userData = { isCar: true };
    carGroup.add(cabin);

    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    const wheelPositions = [
        [-1.1, 0.4, 1.4], [1.1, 0.4, 1.4],
        [-1.1, 0.4, -1.4], [1.1, 0.4, -1.4]
    ];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheel.userData = { isCar: true };
        carGroup.add(wheel);
    });

    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const light1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), lightMat);
    light1.position.set(-0.7, 0.9, 2.25);
    light1.userData = { isCar: true };
    carGroup.add(light1);
    const light2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), lightMat);
    light2.position.set(0.7, 0.9, 2.25);
    light2.userData = { isCar: true };
    carGroup.add(light2);

    carGroup.position.set(8, 0, 0);
    carGroup.rotation.y = Math.PI / 2;

    scene.add(carGroup);
    car = carGroup;
    carMesh = carGroup;
    colliders.push({ x: 8, z: 0, r: 3 });
}

function setupNPCs() {
    const loader = new THREE.TextureLoader();

    SPRITE_NAMES.forEach((name) => {
        allNpcData.push({
            name: name,
            texture: null,
            loaded: false,
            inUse: false,
            sprite: null
        });
    });

    allNpcData.forEach((data) => {
        loader.load(`img/${data.name}`, (texture) => {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearFilter;
            data.texture = texture;
            data.loaded = true;
        });
    });
}

function spawnNPC() {
    if (npcs.length >= 6) return;

    const available = allNpcData.filter(d => d.loaded && !d.inUse);
    if (available.length === 0) return;

    const data = available[Math.floor(Math.random() * available.length)];
    data.inUse = true;

    const material = new THREE.SpriteMaterial({
        map: data.texture,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.2, 3.2, 1);

    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 22;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    sprite.position.set(x, 1.6, z);

    const speed = 0.025 + Math.random() * 0.04;
    const dir = Math.random() * Math.PI * 2;

    sprite.userData = {
        data: data,
        speedX: Math.cos(dir) * speed,
        speedZ: Math.sin(dir) * speed,
        changeTimer: 4 + Math.random() * 6
    };

    data.sprite = sprite;

    scene.add(sprite);
    npcs.push(sprite);
}

function despawnNPC(npc) {
    const idx = npcs.indexOf(npc);
    if (idx > -1) {
        npcs.splice(idx, 1);
        scene.remove(npc);
        npc.material.dispose();
        if (npc.userData.data) {
            npc.userData.data.inUse = false;
            npc.userData.data.sprite = null;
        }
    }
}

function enterCar() {
    window.location.href = 'susfeed-university.html';
}

function setupControls() {
    const overlay = document.getElementById('overlay');

    overlay.addEventListener('click', () => controls.lock());

    controls.addEventListener('lock', () => {
        overlay.style.display = 'none';
    });

    controls.addEventListener('unlock', () => {
        overlay.style.display = 'flex';
    });

    document.addEventListener('keydown', (event) => {
        if (!controls.isLocked) return;
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': moveForward = true; break;
            case 'KeyS': case 'ArrowDown': moveBackward = true; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
            case 'KeyD': case 'ArrowRight': moveRight = true; break;
            case 'ShiftLeft': case 'ShiftRight': sprinting = true; break;
            case 'Space':
                if (canJump) {
                    velocityY = JUMP_FORCE;
                    canJump = false;
                }
                event.preventDefault();
                break;
            case 'KeyE':
                if (inCarRange) enterCar();
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': moveForward = false; break;
            case 'KeyS': case 'ArrowDown': moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': moveRight = false; break;
            case 'ShiftLeft': case 'ShiftRight': sprinting = false; break;
        }
    });

    document.addEventListener('mousedown', (event) => {
        if (event.button !== 0 || !controls.isLocked) return;

        raycaster.setFromCamera(mouse, camera);

        const doorHits = raycaster.intersectObjects(doors);
        if (doorHits.length > 0 && doorHits[0].distance < 10) {
            const doorObj = doorHits[0].object;
            const buildingName = doorObj.userData.name;
            const path = doorObj.userData.path;
            if (path) {
                sessionStorage.setItem('spawnOutside', buildingName);
                window.location.href = path;
            }
            return;
        }

        if (carMesh) {
            const carHits = raycaster.intersectObjects(carMesh.children, true);
            if (carHits.length > 0 && carHits[0].distance < 15) {
                enterCar();
            }
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1);

    if (controls.isLocked) {
        const player = controls.getObject();

        velocity.x -= velocity.x * 10 * delta;
        velocity.z -= velocity.z * 10 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const currentSpeed = sprinting ? WALK_SPEED * SPRINT_MULT : WALK_SPEED;

        if (moveForward || moveBackward) velocity.z -= direction.z * currentSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * currentSpeed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        velocityY -= GRAVITY * delta;
        player.position.y += velocityY * delta;
        if (player.position.y < PLAYER_HEIGHT) {
            player.position.y = PLAYER_HEIGHT;
            velocityY = 0;
            canJump = true;
        }

        colliders.forEach(c => {
            const dx = player.position.x - c.x;
            const dz = player.position.z - c.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = c.r - 0.5;
            if (dist < minDist && dist > 0) {
                const nx = dx / dist;
                const nz = dz / dist;
                player.position.x = c.x + nx * minDist;
                player.position.z = c.z + nz * minDist;
            }
        });

        const boundaryDist = Math.sqrt(player.position.x * player.position.x + player.position.z * player.position.z);
        if (boundaryDist > 55) {
            const nx = player.position.x / boundaryDist;
            const nz = player.position.z / boundaryDist;
            player.position.x = nx * 55;
            player.position.z = nz * 55;
        }

        raycaster.setFromCamera(mouse, camera);
        const doorHits = raycaster.intersectObjects(doors);
        let lookingAtInteractable = false;
        if (doorHits.length > 0 && doorHits[0].distance < 10) lookingAtInteractable = true;

        if (carMesh) {
            const carHits = raycaster.intersectObjects(carMesh.children, true);
            if (carHits.length > 0 && carHits[0].distance < 15) lookingAtInteractable = true;
        }

        if (lookingAtInteractable) {
            crosshair.classList.add('active');
        } else {
            crosshair.classList.remove('active');
        }

        const carDist = player.position.distanceTo(car.position);
        if (carDist < 6) {
            inCarRange = true;
            if (carPrompt) carPrompt.style.display = 'block';
        } else {
            inCarRange = false;
            if (carPrompt) carPrompt.style.display = 'none';
        }
    }

    if (Math.random() < 0.01) spawnNPC();

    npcs.forEach((npc) => {
        const ud = npc.userData;
        ud.changeTimer -= delta;

        if (ud.changeTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.02 + Math.random() * 0.04;
            ud.speedX = Math.cos(angle) * speed;
            ud.speedZ = Math.sin(angle) * speed;
            ud.changeTimer = 4 + Math.random() * 6;
        }

        npc.position.x += ud.speedX;
        npc.position.z += ud.speedZ;

        const npcDistFromCenter = Math.sqrt(npc.position.x * npc.position.x + npc.position.z * npc.position.z);
        if (npcDistFromCenter > TOWN_RADIUS) {
            const nx = npc.position.x / npcDistFromCenter;
            const nz = npc.position.z / npcDistFromCenter;
            npc.position.x = nx * TOWN_RADIUS;
            npc.position.z = nz * TOWN_RADIUS;
            const dot = ud.speedX * nx + ud.speedZ * nz;
            ud.speedX -= 2 * dot * nx;
            ud.speedZ -= 2 * dot * nz;
        }

        colliders.forEach(c => {
            const dx = npc.position.x - c.x;
            const dz = npc.position.z - c.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < c.r + 0.8 && dist > 0) {
                const nx = dx / dist;
                const nz = dz / dist;
                npc.position.x = c.x + nx * (c.r + 0.8);
                npc.position.z = c.z + nz * (c.r + 0.8);

                const dot = ud.speedX * nx + ud.speedZ * nz;
                ud.speedX -= 2 * dot * nx;
                ud.speedZ -= 2 * dot * nz;
            }
        });

        if (controls.isLocked) {
            const playerDist = npc.position.distanceTo(controls.getObject().position);
            if (playerDist > 60) {
                despawnNPC(npc);
            }
        }
    });

    prevTime = time;
    renderer.render(scene, camera);
}

init();
animate();