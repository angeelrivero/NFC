// --- LÓGICA DE PRESENTACIÓN ---
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('slide-dots');

// Crear indicadores (puntos)
slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-cyan-600 ${i === 0 ? 'bg-cyan-400 w-4' : 'bg-slate-600'}`;
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

    // Gestionar la simulación en la diapositiva 4
    if (currentSlide === 4) {
        setTimeout(initSimulation, 100);
    } else {
        stopSimulation();
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

// --- LÓGICA SIMULADOR DRAG & DROP (Slide 4) ---
let animationId;
let simCanvas, simCtx;
let waves = [];
let isConnected = false;

// Variables para Drag & Drop
let isDragging = false;
let startX, startY, initialLeft, initialTop;
const card = document.getElementById('draggable-card');

function initSimulation() {
    simCanvas = document.getElementById('magneticCanvas');
    if (!simCanvas) return;
    
    // Configuración Canvas
    const parent = document.getElementById('sim-container');
    simCanvas.width = parent.clientWidth;
    simCanvas.height = parent.clientHeight;
    simCtx = simCanvas.getContext('2d');
    
    // Resetear Posición Tarjeta
    resetCardPosition();
    
    // Iniciar bucle animación
    if(!animationId) animateWaves();

    // Listeners del ratón
    const cardEl = document.getElementById('draggable-card');
    cardEl.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', dragCard);
}

function stopSimulation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    const cardEl = document.getElementById('draggable-card');
    if(cardEl) cardEl.removeEventListener('mousedown', startDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('mousemove', dragCard);
}

// --- LÓGICA DE ARRASTRE ---
function startDrag(e) {
    const cardEl = document.getElementById('draggable-card');
    isDragging = true;
    
    // Guardamos posición inicial del ratón
    startX = e.clientX;
    startY = e.clientY;
    
    // Guardamos posición inicial del elemento
    initialLeft = cardEl.offsetLeft;
    initialTop = cardEl.offsetTop;

    cardEl.style.cursor = 'grabbing';
    cardEl.style.transition = 'none'; // Quitar transición para evitar lag
    cardEl.style.transform = 'none';  // Quitar transform CSS para usar left/top puros
}

function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    
    const cardEl = document.getElementById('draggable-card');
    cardEl.style.cursor = 'grab';
    cardEl.style.transition = 'all 0.3s ease-out'; // Suavizar al soltar

    // Si no está conectado, volver al sitio
    if (!isConnected) {
        resetCardPosition();
    }
}

function dragCard(e) {
    if (!isDragging) return;
    e.preventDefault();
    const cardEl = document.getElementById('draggable-card');
    const container = document.getElementById('sim-container');

    // Calcular desplazamiento
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Calcular nueva posición
    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;

    // Límites para no sacar la tarjeta del cuadro
    const maxX = container.clientWidth - cardEl.offsetWidth;
    const maxY = container.clientHeight - cardEl.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    // Aplicar
    cardEl.style.left = `${newLeft}px`;
    cardEl.style.top = `${newTop}px`;

    checkOverlap();
}

function resetCardPosition() {
    const cardEl = document.getElementById('draggable-card');
    // Volver a la posición CSS original (usando clases o style inline inicial)
    cardEl.style.left = ''; 
    cardEl.style.top = '50%';
    cardEl.style.right = '4rem';
    cardEl.style.transform = 'translateY(-50%)';
    updateConnectionState(false);
}

// --- DETECCIÓN DE COLISIÓN (SUPERPOSICIÓN DE RECTÁNGULOS) ---
function checkOverlap() {
    const reader = document.getElementById('reader-device');
    const cardEl = document.getElementById('draggable-card');
    
    const r1 = reader.getBoundingClientRect();
    const r2 = cardEl.getBoundingClientRect();

    // Lógica simple: ¿Se tocan los rectángulos?
    // Añadimos un pequeño margen de tolerancia (padding) para que sea más fácil
    const tolerance = 20; 

    const overlap = !(
        r2.left > r1.right - tolerance ||
        r2.right < r1.left + tolerance ||
        r2.top > r1.bottom - tolerance ||
        r2.bottom < r1.top + tolerance
    );

    if (overlap) {
        if (!isConnected) updateConnectionState(true);
    } else {
        if (isConnected) updateConnectionState(false);
    }
}

function updateConnectionState(connected) {
    isConnected = connected;
    
    const status = document.getElementById('reader-status');
    const successOverlay = document.getElementById('success-overlay');
    const cardBody = document.getElementById('card-body');
    const cardIcon = document.getElementById('card-icon');
    const chip = document.getElementById('chip-visual');
    const wifi = document.getElementById('wifi-icon');
    const reader = document.getElementById('reader-device');

    if (connected) {
        // ESTADO: CONECTADO
        status.innerText = "LEYENDO DATOS...";
        status.className = "mt-4 text-xs font-mono font-bold text-green-400 animate-pulse";
        
        successOverlay.style.opacity = '1';
        
        cardBody.classList.add('shadow-[0_0_50px_rgba(34,197,94,0.6)]', 'border-green-400'); // Brillo Verde
        cardIcon.className = "fa-solid fa-nfc-symbol text-5xl text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]";
        chip.classList.add('bg-green-400', 'border-green-600');
        
        wifi.className = "fa-solid fa-wifi text-6xl text-green-500 scale-110";
        reader.classList.add('border-green-500', 'shadow-[0_0_30px_rgba(34,197,94,0.4)]');

    } else {
        // ESTADO: DESCONECTADO
        status.innerText = "ESPERANDO TARJETA...";
        status.className = "mt-4 text-xs font-mono font-bold text-slate-500";
        
        successOverlay.style.opacity = '0';
        
        cardBody.classList.remove('shadow-[0_0_50px_rgba(34,197,94,0.6)]', 'border-green-400');
        cardIcon.className = "fa-solid fa-nfc-symbol text-5xl text-slate-400 transition-colors duration-300";
        chip.classList.remove('bg-green-400', 'border-green-600');
        
        wifi.className = "fa-solid fa-wifi text-6xl text-slate-600";
        reader.classList.remove('border-green-500', 'shadow-[0_0_30px_rgba(34,197,94,0.4)]');
    }
}

// --- ANIMACIÓN ONDAS (CANVAS) ---
function animateWaves() {
    if (!simCtx || currentSlide !== 4) return;

    simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
    
    // Obtener centro del lector dinámicamente
    const reader = document.getElementById('reader-device');
    const container = document.getElementById('sim-container');
    
    if(reader && container) {
        const rRect = reader.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const centerX = rRect.left - cRect.left + (rRect.width/2);
        const centerY = rRect.top - cRect.top + (rRect.height/2);

        // Crear ondas
        // Si está conectado, generamos más ondas (más rápido)
        const frequency = isConnected ? 0.8 : 0.92;
        if (Math.random() > frequency) {
            waves.push({ r: 40, op: 1, color: isConnected ? '34, 197, 94' : '6, 182, 212' }); // Verde si conectado, Azul si no
        }

        simCtx.lineWidth = isConnected ? 4 : 2;

        waves.forEach((w, i) => {
            w.r += isConnected ? 4 : 2; // Más rápido si conecta
            w.op -= 0.015;
            
            // Color dinámico
            const targetColor = isConnected ? '34, 197, 94' : '6, 182, 212'; 
            w.color = targetColor;

            if (w.op > 0) {
                simCtx.beginPath();
                simCtx.arc(centerX, centerY, w.r, 0, Math.PI * 2);
                simCtx.strokeStyle = `rgba(${w.color}, ${w.op})`;
                simCtx.stroke();
            } else {
                waves.splice(i, 1);
            }
        });
    }
    animationId = requestAnimationFrame(animateWaves);
}

// --- LÓGICA DE ARQUITECTURA (Slide 5) ---
function highlightHw(id) {
    // 1. Apagar todos (Grayscale y opacidad baja)
    const ids = ['hw-host', 'hw-nfcc', 'hw-se', 'hw-ant'];
    ids.forEach(elId => {
        const el = document.getElementById(elId);
        if(el) {
            el.classList.add('opacity-30', 'grayscale', 'scale-95');
            el.classList.remove('opacity-100', 'grayscale-0', 'scale-105', 'shadow-[0_0_30px_rgba(255,255,255,0.3)]', 'bg-slate-700');
            // Quitar bordes de colores específicos para resetear
            el.style.borderColor = ""; 
        }
    });

    // 2. Encender el seleccionado
    const target = document.getElementById(id);
    if(target) {
        target.classList.remove('opacity-30', 'grayscale', 'scale-95');
        target.classList.add('opacity-100', 'grayscale-0', 'scale-105', 'transition-all');
        
        // Efectos específicos por color
        if(id === 'hw-se') {
            target.classList.add('shadow-[0_0_30px_rgba(239,68,68,0.5)]'); // Rojo
        } else if (id === 'hw-nfcc') {
            target.classList.add('shadow-[0_0_30px_rgba(6,182,212,0.5)]'); // Cyan
        } else if (id === 'hw-ant') {
            target.classList.add('shadow-[0_0_30px_rgba(255,255,255,0.3)]'); // Blanco
            target.querySelector('i').classList.add('text-white');
            target.style.borderColor = "#fff";
        }
    }
}

function resetHw() {
    // Volver al estado "normal" (Host y SE apagados, NFCC encendido suave)
    const ids = ['hw-host', 'hw-nfcc', 'hw-se', 'hw-ant'];
    ids.forEach(elId => {
        const el = document.getElementById(elId);
        if(el) {
            // Reset general
            el.classList.remove('opacity-30', 'opacity-100', 'grayscale-0', 'scale-105', 'scale-95', 'shadow-[0_0_30px_rgba(239,68,68,0.5)]', 'shadow-[0_0_30px_rgba(6,182,212,0.5)]', 'shadow-[0_0_30px_rgba(255,255,255,0.3)]');
            el.style.borderColor = "";
            
            // Estado por defecto
            if(elId === 'hw-nfcc') {
                el.classList.add('opacity-100', 'grayscale-0'); // NFCC siempre visible
            } else {
                el.classList.add('opacity-50', 'grayscale'); // Resto semi-apagados
            }
        }
    });
}


// --- INSPECTOR APDU (Slide 6) ---
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

// --- MODO CLARO / OSCURO ---
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const isLight = html.getAttribute('data-theme') === 'light';

    if (isLight) {
        html.setAttribute('data-theme', 'dark');
        icon.className = 'fa-solid fa-sun text-yellow-400 transition-transform group-hover:rotate-90';
        localStorage.setItem('theme', 'dark');
    } else {
        html.setAttribute('data-theme', 'light');
        icon.className = 'fa-solid fa-moon text-slate-600 transition-transform group-hover:-rotate-12';
        localStorage.setItem('theme', 'light');
    }
}

(function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = 'fa-solid fa-moon text-slate-600 transition-transform group-hover:-rotate-12';
    }
})();

window.onload = function () {
    updateDisplay();
};