// --- LÓGICA DE PRESENTACIÓN ---
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('slide-dots');

// Crear indicadores (puntos)
slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-cyan-600 ${i === 0 ? 'bg-cyan-400 w-4' : 'bg-slate-600'}`;
    // Permitir clic en los puntos
    dot.onclick = () => changeSlideTo(i);
    dotsContainer.appendChild(dot);
});

const dots = dotsContainer.children;

function updateDisplay() {
    // Manejo del Header Global
    if (currentSlide === 0) {
        document.body.classList.add('on-cover');
    } else {
        document.body.classList.remove('on-cover');
    }

    slides.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
            slide.style.opacity = '1';
            slide.style.transform = 'scale(1)';
        } else {
            slide.classList.remove('active');
            slide.style.opacity = '0';
            slide.style.transform = index < currentSlide ? 'scale(0.9) translateX(-50px)' : 'scale(1.1) translateX(50px)';
        }
    });

    // Actualizar puntos
    Array.from(dots).forEach((dot, i) => {
        dot.className = i === currentSlide
            ? 'w-4 h-2 rounded-full bg-cyan-400 transition-all duration-300 cursor-pointer'
            : 'w-2 h-2 rounded-full bg-slate-600 transition-all duration-300 cursor-pointer hover:bg-cyan-600';
    });

    // Iniciar animaciones específicas si estamos en la diapositiva correcta
    // Diapositiva 3 es índice 3 (empezando en 0 es la 4ta slide) -> Funcionamiento
    if (currentSlide === 3) {
        setTimeout(resizeFieldCanvas, 100);
    }
}

function changeSlide(dir) {
    const next = currentSlide + dir;
    if (next >= 0 && next < slides.length) {
        currentSlide = next;
        updateDisplay();
    }
}

function changeSlideTo(index) {
    if (index >= 0 && index < slides.length) {
        currentSlide = index;
        updateDisplay();
    }
}

// Teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') changeSlide(1);
    if (e.key === 'ArrowLeft') changeSlide(-1);
});

// --- LÓGICA SIMULADOR (DIAPOSITIVA 4 / Índice 3) ---
function runSimulation() {
    const packet = document.getElementById('flying-packet');
    const dev1 = document.getElementById('dev1-body');
    const dev2 = document.getElementById('dev2-body');

    // Reset
    dev1.classList.remove('neon-border'); dev2.classList.remove('neon-border');

    // Active State
    dev1.classList.add('neon-border');

    // Animacion paquete
    packet.style.transition = 'none';
    packet.style.left = '25%';
    packet.style.opacity = '1';

    // Forzar reflow
    packet.offsetHeight;

    setTimeout(() => {
        packet.style.transition = 'left 1s cubic-bezier(0.4, 0, 0.2, 1)';
        packet.style.left = '65%';
    }, 50);

    setTimeout(() => {
        dev2.classList.add('neon-border');
        packet.style.opacity = '0';
    }, 1050);
}

// --- LÓGICA INSPECTOR APDU (DIAPOSITIVA 6 / Índice 5) ---
const apduInfo = {
    'CLA': { t: 'Class Byte', d: 'Define la clase de instrucción. (0x00 Estándar, 0x80 Propietario).', c: 'border-cyan-500' },
    'INS': { t: 'Instruction Byte', d: 'Código de la operación. (Ej: 0xA4 = SELECT FILE).', c: 'border-cyan-500' },
    'P1P2': { t: 'Parameters', d: 'Parámetros de la instrucción (ej. offset de memoria).', c: 'border-cyan-500' },
    'Data': { t: 'Payload / Data', d: 'Información real (NDEF, claves, etc). Variable longitud (Lc).', c: 'border-slate-400' },
    'SW': { t: 'Status Word', d: 'Estado final. 0x9000 = OK. Cualquier otra cosa = Error.', c: 'border-green-500' }
};

function setInfo(key) {
    const data = apduInfo[key];
    const box = document.getElementById('apdu-box');
    document.getElementById('apdu-title').innerText = data.t;
    document.getElementById('apdu-desc').innerText = data.d;
    box.className = `bg-slate-800 p-4 border-l-4 min-h-[100px] rounded-r transition-colors ${data.c}`;
}

function clearInfo() {
    document.getElementById('apdu-title').innerText = "Estructura APDU";
    document.getElementById('apdu-desc').innerText = "Pasa el ratón por los bloques de arriba para ver su función.";
    document.getElementById('apdu-box').className = "bg-slate-800 p-4 border-l-4 border-slate-500 min-h-[100px] rounded-r transition-colors";
}

// --- FONDO ANIMADO CANVAS ---
const canvas = document.getElementById('fieldCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let waves = [];

function resizeFieldCanvas() {
    const parent = document.getElementById('simulation-container');
    if (parent && canvas) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }
}
window.addEventListener('resize', resizeFieldCanvas);

function animateField() {
    if (!ctx || currentSlide !== 3) {
        requestAnimationFrame(animateField);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Generar ondas aleatorias
    if (Math.random() > 0.95) waves.push({ x: canvas.width * 0.3, y: canvas.height / 2, r: 10, op: 1 });

    ctx.lineWidth = 2;
    waves.forEach((w, i) => {
        w.r += 2; w.op -= 0.02;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${w.op})`;
        ctx.stroke();
        if (w.op <= 0) waves.splice(i, 1);
    });
    requestAnimationFrame(animateField);
}

// Init
window.onload = function () {
    updateDisplay();
    if (canvas) {
        resizeFieldCanvas();
        animateField();
    }
};
