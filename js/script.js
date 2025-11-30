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
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = cardEl.offsetLeft;
    initialTop = cardEl.offsetTop;

    cardEl.style.cursor = 'grabbing';
    cardEl.style.transition = 'none'; 
    cardEl.style.transform = 'none';  
}

function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    const cardEl = document.getElementById('draggable-card');
    cardEl.style.cursor = 'grab';
    cardEl.style.transition = 'all 0.3s ease-out'; 
    if (!isConnected) resetCardPosition();
}

function dragCard(e) {
    if (!isDragging) return;
    e.preventDefault();
    const cardEl = document.getElementById('draggable-card');
    const container = document.getElementById('sim-container');

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;

    const maxX = container.clientWidth - cardEl.offsetWidth;
    const maxY = container.clientHeight - cardEl.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    cardEl.style.left = `${newLeft}px`;
    cardEl.style.top = `${newTop}px`;

    checkOverlap();
}

function resetCardPosition() {
    const cardEl = document.getElementById('draggable-card');
    cardEl.style.left = ''; 
    cardEl.style.top = '50%';
    cardEl.style.right = '4rem';
    cardEl.style.transform = 'translateY(-50%)';
    updateConnectionState(false);
}

function checkOverlap() {
    const reader = document.getElementById('reader-device');
    const cardEl = document.getElementById('draggable-card');
    
    const r1 = reader.getBoundingClientRect();
    const r2 = cardEl.getBoundingClientRect();
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
        status.innerText = "LEYENDO DATOS...";
        status.className = "mt-4 text-xs font-mono font-bold text-green-400 animate-pulse";
        successOverlay.style.opacity = '1';
        cardBody.classList.add('shadow-[0_0_50px_rgba(34,197,94,0.6)]', 'border-green-400'); 
        cardIcon.className = "fa-solid fa-nfc-symbol text-5xl text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]";
        chip.classList.add('bg-green-400', 'border-green-600');
        wifi.className = "fa-solid fa-wifi text-6xl text-green-500 scale-110";
        reader.classList.add('border-green-500', 'shadow-[0_0_30px_rgba(34,197,94,0.4)]');
    } else {
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

function animateWaves() {
    if (!simCtx || currentSlide !== 4) return;
    simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
    
    const reader = document.getElementById('reader-device');
    const container = document.getElementById('sim-container');
    
    if(reader && container) {
        const rRect = reader.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const centerX = rRect.left - cRect.left + (rRect.width/2);
        const centerY = rRect.top - cRect.top + (rRect.height/2);

        const frequency = isConnected ? 0.8 : 0.92;
        if (Math.random() > frequency) {
            waves.push({ r: 40, op: 1, color: isConnected ? '34, 197, 94' : '6, 182, 212' });
        }

        simCtx.lineWidth = isConnected ? 4 : 2;

        waves.forEach((w, i) => {
            w.r += isConnected ? 4 : 2; 
            w.op -= 0.015;
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
    const ids = ['hw-host', 'hw-nfcc', 'hw-se', 'hw-ant'];
    ids.forEach(elId => {
        const el = document.getElementById(elId);
        if(el) {
            el.classList.add('opacity-30', 'grayscale', 'scale-95');
            el.classList.remove('opacity-100', 'grayscale-0', 'scale-105', 'shadow-[0_0_30px_rgba(255,255,255,0.3)]', 'bg-slate-700');
            el.style.borderColor = ""; 
        }
    });
    const target = document.getElementById(id);
    if(target) {
        target.classList.remove('opacity-30', 'grayscale', 'scale-95');
        target.classList.add('opacity-100', 'grayscale-0', 'scale-105', 'transition-all');
        if(id === 'hw-se') target.classList.add('shadow-[0_0_30px_rgba(239,68,68,0.5)]'); 
        else if (id === 'hw-nfcc') target.classList.add('shadow-[0_0_30px_rgba(6,182,212,0.5)]'); 
        else if (id === 'hw-ant') {
            target.classList.add('shadow-[0_0_30px_rgba(255,255,255,0.3)]');
            target.querySelector('i').classList.add('text-white');
            target.style.borderColor = "#fff";
        }
    }
}

function resetHw() {
    const ids = ['hw-host', 'hw-nfcc', 'hw-se', 'hw-ant'];
    ids.forEach(elId => {
        const el = document.getElementById(elId);
        if(el) {
            el.classList.remove('opacity-30', 'opacity-100', 'grayscale-0', 'scale-105', 'scale-95', 'shadow-[0_0_30px_rgba(239,68,68,0.5)]', 'shadow-[0_0_30px_rgba(6,182,212,0.5)]', 'shadow-[0_0_30px_rgba(255,255,255,0.3)]');
            el.style.borderColor = "";
            if(elId === 'hw-nfcc') el.classList.add('opacity-100', 'grayscale-0');
            else el.classList.add('opacity-50', 'grayscale');
        }
    });
}

// --- ANIMACIONES MODOS DE OPERACIÓN (NUEVO) ---

// MODO 1: LECTOR (DOMÓTICA)
function triggerHomeAutomation(el) {
    el.classList.add('scale-95', 'bg-accent', 'border-white'); // Feedback click
    
    // Simular escaneo
    setTimeout(() => {
        el.classList.remove('scale-95', 'bg-accent', 'border-white');
        const actions = document.getElementById('home-actions');
        actions.style.opacity = '1';
        actions.classList.add('animate-pulse');
        
        // Reset despues de unos segundos
        setTimeout(() => {
            actions.style.opacity = '0';
            actions.classList.remove('animate-pulse');
        }, 3000);
    }, 200);
}

// MODO 2: P2P
function triggerP2P() {
    const wave = document.getElementById('p2p-wave');
    const icon = document.getElementById('p2p-icon');
    const phone2Screen = document.getElementById('contact-received');
    
    // 1. Reset
    wave.style.width = '0';
    icon.style.opacity = '0';
    icon.style.left = '0';
    phone2Screen.style.transform = 'translateY(100%)';
    
    // 2. Animar Onda
    setTimeout(() => { wave.style.width = '100%'; }, 100);
    
    // 3. Animar Icono Viajando
    setTimeout(() => { 
        icon.style.opacity = '1';
        icon.style.left = '100%';
    }, 300);
    
    // 4. Recibir en movil 2
    setTimeout(() => {
        phone2Screen.style.transform = 'translateY(0)';
    }, 1100);
    
    // 5. Auto Reset
    setTimeout(() => {
        wave.style.width = '0';
        icon.style.opacity = '0';
        icon.style.left = '0';
        phone2Screen.style.transform = 'translateY(100%)';
    }, 4000);
}

// MODO 3: PAGO
function triggerPayment() {
    const phone = document.getElementById('pay-phone');
    const screen = document.getElementById('tpv-screen');
    
    // 1. Subir movil
    phone.style.bottom = '-40px'; // Sube
    
    // 2. Procesando
    setTimeout(() => {
        screen.innerText = "PROCESANDO...";
        screen.className = "w-32 h-16 bg-black border border-yellow-500 rounded flex items-center justify-center text-yellow-500 font-mono text-xs animate-pulse";
    }, 800);
    
    // 3. Aceptado
    setTimeout(() => {
        screen.innerHTML = '<i class="fa-solid fa-check text-2xl"></i> OK';
        screen.className = "w-32 h-16 bg-green-900 border border-green-500 rounded flex items-center justify-center text-green-400 font-mono text-xl font-bold";
        // Sonido visual (borde verde en todo)
    }, 2000);
    
    // 4. Bajar movil y reset
    setTimeout(() => {
        phone.style.bottom = '-150px';
        setTimeout(() => {
            screen.innerText = "ESPERANDO...";
            screen.className = "w-32 h-16 bg-black border border-slate-700 rounded flex items-center justify-center text-green-500 font-mono text-xs";
        }, 500);
    }, 3500);
}


// --- INSPECTOR APDU (Slide 10) ---
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

// --- LÓGICA ESPECÍFICA PARA READER/WRITER (SLIDE FIESTA) ---

let isDraggingRW = false;
let rwStartX, rwStartY, rwInitialLeft, rwInitialTop;
let rwConnected = false;

function startRWDrag(e) {
    const phone = document.getElementById('rw-phone');
    isDraggingRW = true;
    rwStartX = e.clientX;
    rwStartY = e.clientY;
    
    // Obtener valores computados actuales para evitar saltos
    const rect = phone.getBoundingClientRect();
    const parent = document.getElementById('rw-sim-container').getBoundingClientRect();
    
    // Calcular posición relativa al contenedor
    rwInitialLeft = phone.offsetLeft;
    rwInitialTop = phone.offsetTop;

    phone.style.cursor = 'grabbing';
    phone.style.transition = 'none';
    
    // Listeners globales temporales
    window.addEventListener('mousemove', dragRWPhone);
    window.addEventListener('mouseup', stopRWDrag);
}

function dragRWPhone(e) {
    if (!isDraggingRW) return;
    e.preventDefault();
    
    const phone = document.getElementById('rw-phone');
    const container = document.getElementById('rw-sim-container');

    const deltaX = e.clientX - rwStartX;
    const deltaY = e.clientY - rwStartY;

    let newLeft = rwInitialLeft + deltaX;
    let newTop = rwInitialTop + deltaY;

    // Límites
    const maxX = container.clientWidth - phone.offsetWidth;
    const maxY = container.clientHeight - phone.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    phone.style.left = `${newLeft}px`;
    phone.style.top = `${newTop}px`;

    checkRWCollision();
}

function stopRWDrag() {
    isDraggingRW = false;
    const phone = document.getElementById('rw-phone');
    phone.style.cursor = 'grab';
    phone.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Rebote suave

    window.removeEventListener('mousemove', dragRWPhone);
    window.removeEventListener('mouseup', stopRWDrag);

    if (!rwConnected) {
        // Volver a posición original si no conectó
        phone.style.left = ''; 
        phone.style.right = '2.5rem';
        phone.style.bottom = '2.5rem'; 
        phone.style.top = '';
    }
}

function checkRWCollision() {
    if (rwConnected) return; // Si ya está la fiesta montada, no hacer nada

    const phone = document.getElementById('rw-phone');
    const tag = document.getElementById('rw-tag');
    const overlay = document.getElementById('scan-overlay');

    const pRect = phone.getBoundingClientRect();
    const tRect = tag.getBoundingClientRect();

    // Detectar si el centro del móvil está cerca del centro del tag
    const pCenterX = pRect.left + pRect.width / 2;
    const pCenterY = pRect.top + pRect.height / 2;
    const tCenterX = tRect.left + tRect.width / 2;
    const tCenterY = tRect.top + tRect.height / 2;

    const distance = Math.hypot(pCenterX - tCenterX, pCenterY - tCenterY);

    // Umbral de distancia (cerca)
    if (distance < 60) {
        triggerPartyRoutine();
    }
}

function triggerPartyRoutine() {
    if (rwConnected) return;
    rwConnected = true;
    isDraggingRW = false; // Soltar el drag forzosamente para la animación
    window.removeEventListener('mousemove', dragRWPhone);
    window.removeEventListener('mouseup', stopRWDrag);

    const phone = document.getElementById('rw-phone');
    const tag = document.getElementById('rw-tag');
    const overlay = document.getElementById('scan-overlay');
    const btIcon = document.getElementById('bt-icon');
    const spotifyWidget = document.getElementById('spotify-widget');
    const speakers = document.querySelectorAll('.speaker-box').parentNode; // Parent para buscar speakers
    const statusText = document.getElementById('party-status');

    // 1. Snap al tag (animación magnética)
    // Calcular posición relativa dentro del contenedor
    const container = document.getElementById('rw-sim-container');
    const tagLeft = tag.offsetLeft + (tag.offsetWidth / 2) - (phone.offsetWidth / 2);
    const tagTop = tag.offsetTop + (tag.offsetHeight / 2) - (phone.offsetHeight / 2);

    phone.style.transition = 'all 0.3s ease-out';
    phone.style.left = `${tagLeft}px`;
    phone.style.top = `${tagTop}px`;

    // 2. Feedback Visual de Escaneo
    overlay.style.opacity = '1';

    // 3. Secuencia de la Rutina
    setTimeout(() => {
        // Paso A: Escaneo completado
        overlay.style.opacity = '0';
        
        // Paso B: Encender Bluetooth
        btIcon.className = "fa-brands fa-bluetooth text-blue-500 animate-pulse scale-125";
        
        setTimeout(() => {
             // Paso C: Conectar Altavoces (Efecto visual en altavoces)
            const speakerDivs = document.querySelectorAll('.relative.group');
            speakerDivs.forEach(div => div.classList.add('speaker-active'));
            
            // Paso D: Mostrar notificación Spotify
            spotifyWidget.style.transform = 'translateY(0)';
            
            // Paso E: Mensaje flotante en la sala
            statusText.style.opacity = '1';
            statusText.style.transform = 'translateY(0)';
            
        }, 800);

    }, 1000);
}

// Resetear la simulación al cambiar de slide
function resetPartySim() {
    rwConnected = false;
    const phone = document.getElementById('rw-phone');
    const overlay = document.getElementById('scan-overlay');
    const btIcon = document.getElementById('bt-icon');
    const spotifyWidget = document.getElementById('spotify-widget');
    const statusText = document.getElementById('party-status');
    const speakerDivs = document.querySelectorAll('.relative.group');

    // Reset estilos
    phone.style.left = ''; 
    phone.style.right = '2.5rem';
    phone.style.bottom = '2.5rem'; 
    phone.style.top = '';
    phone.style.transform = 'none';
    
    overlay.style.opacity = '0';
    btIcon.className = "fa-brands fa-bluetooth text-slate-500";
    spotifyWidget.style.transform = 'translateY(150px)'; // Ocultar abajo
    statusText.style.opacity = '0';
    statusText.style.transform = 'translateY(20px)';
    
    speakerDivs.forEach(div => div.classList.remove('speaker-active'));
}

// INTEGRAR RESET EN LA FUNCIÓN PRINCIPAL updateDisplay
// Busca tu función updateDisplay() existente y añade esto dentro del bucle o lógica:
const originalUpdateDisplay = updateDisplay;
updateDisplay = function() {
    originalUpdateDisplay();
    // Si NO estamos en el slide 7 (índice 7 basado en tu estructura actual, ajústalo si es necesario), reseteamos
    // En tu código original parecía ser slide 6 o 7. Ajusta el índice según corresponda al slide "Reader/Writer"
    // Asumiré que si NO es el slide activo, reseteamos.
    if (currentSlide !== 7) { 
        resetPartySim();
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