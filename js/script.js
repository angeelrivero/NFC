// --- VARIABLES GLOBALES DE PRESENTACIÓN ---
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('slide-dots');

// --- INICIALIZACIÓN DE PUNTOS (DOTS) ---
slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:bg-cyan-600 ${i === 0 ? 'bg-cyan-400 w-4' : 'bg-slate-600'}`;
    dot.onclick = () => changeSlideTo(i);
    dotsContainer.appendChild(dot);
});

const dots = dotsContainer.children;

// --- GESTIÓN DE DIAPOSITIVAS ---
function updateDisplay() {
    // 1. Manejo del Header Global
    if (currentSlide === 0) {
        document.body.classList.add('on-cover');
    } else {
        document.body.classList.remove('on-cover');
    }

    // 2. Transiciones de Slides
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

    // 3. Actualizar puntos
    Array.from(dots).forEach((dot, i) => {
        dot.className = i === currentSlide
            ? 'w-4 h-2 rounded-full bg-cyan-400 transition-all duration-300 cursor-pointer'
            : 'w-2 h-2 rounded-full bg-slate-600 transition-all duration-300 cursor-pointer hover:bg-cyan-600';
    });

    // 4. GESTIÓN DE SIMULACIONES SEGÚN EL SLIDE
    
    // Slide 4: Simulación Magnética Básica
    if (currentSlide === 4) {
        setTimeout(initSimulation, 100);
    } else {
        stopSimulation();
    }

    // Slide 7: Reader/Writer (Fiesta) - Reset si salimos
    if (currentSlide !== 7) {
        resetPartySim();
    }

    // Slide 8: P2P (NameDrop) - Reset si salimos
    if (currentSlide !== 8) {
        resetP2PSim();
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

// Navegación por teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') changeSlide(1);
    if (e.key === 'ArrowLeft') changeSlide(-1);
});


// ==========================================
//  SLIDE 4: SIMULADOR CAMPO MAGNÉTICO (CANVAS)
// ==========================================
let animationId;
let simCanvas, simCtx;
let waves = [];
let isConnected = false;
let isDragging = false;
let startX, startY, initialLeft, initialTop;

function initSimulation() {
    simCanvas = document.getElementById('magneticCanvas');
    if (!simCanvas) return;
    
    const parent = document.getElementById('sim-container');
    simCanvas.width = parent.clientWidth;
    simCanvas.height = parent.clientHeight;
    simCtx = simCanvas.getContext('2d');
    
    resetCardPosition();
    if(!animationId) animateWaves();

    const cardEl = document.getElementById('draggable-card');
    if(cardEl) {
        cardEl.addEventListener('mousedown', startDrag);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('mousemove', dragCard);
    }
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

function startDrag(e) {
    const cardEl = document.getElementById('draggable-card');
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = cardEl.offsetLeft;
    initialTop = cardEl.offsetTop;
    cardEl.style.cursor = 'grabbing';
    cardEl.style.transition = 'none'; 
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
    if(!cardEl) return;
    cardEl.style.left = ''; 
    cardEl.style.top = '50%';
    cardEl.style.right = '4rem';
    cardEl.style.transform = 'translateY(-50%)';
    updateConnectionState(false);
}

function checkOverlap() {
    const reader = document.getElementById('reader-device');
    const cardEl = document.getElementById('draggable-card');
    if(!reader || !cardEl) return;

    const r1 = reader.getBoundingClientRect();
    const r2 = cardEl.getBoundingClientRect();
    const tolerance = 20; 

    const overlap = !(r2.left > r1.right - tolerance || r2.right < r1.left + tolerance || r2.top > r1.bottom - tolerance || r2.bottom < r1.top + tolerance);

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


// ==========================================
//  SLIDE 5: HARDWARE (HOVER EFFECTS)
// ==========================================
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


// ==========================================
//  SLIDE 7: READER/WRITER (FIESTA MODE)
// ==========================================
let isDraggingRW = false;
let rwStartX, rwStartY, rwInitialLeft, rwInitialTop;
let rwConnected = false;

function startRWDrag(e) {
    const phone = document.getElementById('rw-phone');
    if(!phone) return;
    
    isDraggingRW = true;
    rwStartX = e.clientX;
    rwStartY = e.clientY;
    
    const rect = phone.getBoundingClientRect();
    rwInitialLeft = phone.offsetLeft;
    rwInitialTop = phone.offsetTop;

    phone.style.cursor = 'grabbing';
    phone.style.transition = 'none';
    
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
    if(phone) {
        phone.style.cursor = 'grab';
        phone.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    window.removeEventListener('mousemove', dragRWPhone);
    window.removeEventListener('mouseup', stopRWDrag);

    if (!rwConnected && phone) {
        phone.style.left = ''; 
        phone.style.right = '2.5rem';
        phone.style.bottom = '2.5rem'; 
        phone.style.top = '';
    }
}

function checkRWCollision() {
    if (rwConnected) return;

    const phone = document.getElementById('rw-phone');
    const tag = document.getElementById('rw-tag');
    if(!phone || !tag) return;

    const pRect = phone.getBoundingClientRect();
    const tRect = tag.getBoundingClientRect();

    const pCenterX = pRect.left + pRect.width / 2;
    const pCenterY = pRect.top + pRect.height / 2;
    const tCenterX = tRect.left + tRect.width / 2;
    const tCenterY = tRect.top + tRect.height / 2;

    const distance = Math.hypot(pCenterX - tCenterX, pCenterY - tCenterY);

    if (distance < 60) {
        triggerPartyRoutine();
    }
}

function triggerPartyRoutine() {
    if (rwConnected) return;
    rwConnected = true;
    isDraggingRW = false;
    window.removeEventListener('mousemove', dragRWPhone);
    window.removeEventListener('mouseup', stopRWDrag);

    const phone = document.getElementById('rw-phone');
    const tag = document.getElementById('rw-tag');
    const overlay = document.getElementById('scan-overlay');
    const btIcon = document.getElementById('bt-icon');
    const spotifyWidget = document.getElementById('spotify-widget');
    const statusText = document.getElementById('party-status');

    // Snap al tag
    const tagLeft = tag.offsetLeft + (tag.offsetWidth / 2) - (phone.offsetWidth / 2);
    const tagTop = tag.offsetTop + (tag.offsetHeight / 2) - (phone.offsetHeight / 2);

    phone.style.transition = 'all 0.3s ease-out';
    phone.style.left = `${tagLeft}px`;
    phone.style.top = `${tagTop}px`;

    overlay.style.opacity = '1';

    setTimeout(() => {
        overlay.style.opacity = '0';
        btIcon.className = "fa-brands fa-bluetooth text-blue-500 animate-pulse scale-125";
        
        setTimeout(() => {
            const speakerDivs = document.querySelectorAll('.speaker-box');
            speakerDivs.forEach(div => div.parentNode.classList.add('speaker-active'));
            spotifyWidget.style.transform = 'translateY(0)';
            statusText.style.opacity = '1';
            statusText.style.transform = 'translateY(0)';
        }, 800);
    }, 1000);
}

function resetPartySim() {
    rwConnected = false;
    const phone = document.getElementById('rw-phone');
    const overlay = document.getElementById('scan-overlay');
    const btIcon = document.getElementById('bt-icon');
    const spotifyWidget = document.getElementById('spotify-widget');
    const statusText = document.getElementById('party-status');
    const speakerDivs = document.querySelectorAll('.speaker-active');

    if(!phone) return;

    phone.style.left = ''; 
    phone.style.right = '2.5rem';
    phone.style.bottom = '2.5rem'; 
    phone.style.top = '';
    phone.style.transform = 'none';
    
    if(overlay) overlay.style.opacity = '0';
    if(btIcon) btIcon.className = "fa-brands fa-bluetooth text-slate-500";
    if(spotifyWidget) spotifyWidget.style.transform = 'translateY(150px)';
    if(statusText) { statusText.style.opacity = '0'; statusText.style.transform = 'translateY(20px)'; }
    
    speakerDivs.forEach(div => div.classList.remove('speaker-active'));
}


// ==========================================
//  SLIDE 8: P2P (NAMEDROP - CORREGIDO)
// ==========================================
let activeP2PPhone = null; 
let p2pShiftX = 0;
let p2pShiftY = 0;
let p2pConnected = false;

function startP2PDrag(e, phoneId) {
    if (p2pConnected) return;

    activeP2PPhone = document.getElementById(phoneId);
    if (!activeP2PPhone) return;

    const rect = activeP2PPhone.getBoundingClientRect();
    
    // Calcular shift (offset) para evitar saltos
    p2pShiftX = e.clientX - rect.left;
    p2pShiftY = e.clientY - rect.top;

    activeP2PPhone.style.cursor = 'grabbing';
    activeP2PPhone.style.transition = 'none';
    activeP2PPhone.style.zIndex = 100;

    window.addEventListener('mousemove', dragP2PPhone);
    window.addEventListener('mouseup', stopP2PDrag);
}

function dragP2PPhone(e) {
    if (!activeP2PPhone) return;
    e.preventDefault();
    
    const container = document.getElementById('p2p-sim-container');
    const containerRect = container.getBoundingClientRect();

    // Nueva posición relativa al contenedor, restando el shift inicial
    let newLeft = e.clientX - containerRect.left - p2pShiftX;
    let newTop = e.clientY - containerRect.top - p2pShiftY;

    const maxX = container.clientWidth - activeP2PPhone.offsetWidth;
    const maxY = container.clientHeight - activeP2PPhone.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    // Usar left/top para moverlo (quitando transforms previos)
    activeP2PPhone.style.transform = 'none'; 
    activeP2PPhone.style.left = `${newLeft}px`;
    activeP2PPhone.style.top = `${newTop}px`;

    checkP2PCollision();
}

function stopP2PDrag() {
    if (!activeP2PPhone) return;

    activeP2PPhone.style.cursor = 'grab';
    activeP2PPhone.style.zIndex = 40;
    activeP2PPhone.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    window.removeEventListener('mousemove', dragP2PPhone);
    window.removeEventListener('mouseup', stopP2PDrag);

    if (!p2pConnected) {
        // Regresar a posición original si no hubo conexión
        if (activeP2PPhone.id === 'p2p-phone-1') {
            activeP2PPhone.style.left = '25%';
            activeP2PPhone.style.top = '50%';
        } else {
            activeP2PPhone.style.left = '75%';
            activeP2PPhone.style.top = '50%';
        }
        activeP2PPhone.style.transform = 'translate(-50%, -50%)';
    }
    
    activeP2PPhone = null;
}

function checkP2PCollision() {
    if (p2pConnected) return;

    const p1 = document.getElementById('p2p-phone-1');
    const p2 = document.getElementById('p2p-phone-2');

    const r1 = p1.getBoundingClientRect();
    const r2 = p2.getBoundingClientRect();

    const c1x = r1.left + r1.width / 2;
    const c1y = r1.top + r1.height / 2;
    const c2x = r2.left + r2.width / 2;
    const c2y = r2.top + r2.height / 2;

    const distance = Math.hypot(c1x - c2x, c1y - c2y);

    // Si están cerca (< 160px entre centros)
    if (distance < 160) {
        triggerP2PAction();
    }
}

function triggerP2PAction() {
    if (p2pConnected) return;
    p2pConnected = true;
    
    // Detener drag si estaba activo
    if(activeP2PPhone) {
        window.removeEventListener('mousemove', dragP2PPhone);
        window.removeEventListener('mouseup', stopP2PDrag);
        activeP2PPhone = null;
    }

    const p1 = document.getElementById('p2p-phone-1');
    const p2 = document.getElementById('p2p-phone-2');
    const container = document.getElementById('p2p-sim-container');
    
    // Calcular centro
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    // Animar al centro (Snap)
    p1.style.transition = 'all 0.4s ease-out';
    p2.style.transition = 'all 0.4s ease-out';
    p1.style.transform = 'none';
    p2.style.transform = 'none';

    // Pegados en el centro
    const phoneW = p1.offsetWidth;
    p1.style.left = `${centerX - phoneW + 10}px`;
    p1.style.top = `${centerY - (p1.offsetHeight/2)}px`;
    
    p2.style.left = `${centerX - 10}px`;
    p2.style.top = `${centerY - (p2.offsetHeight/2)}px`;

    setTimeout(() => {
        // Choque
        p1.style.transform = 'rotate(-5deg)';
        p2.style.transform = 'rotate(5deg)';
        
        // Efectos visuales
        const p1Wave = document.getElementById('p1-wave');
        const p2Wave = document.getElementById('p2-wave');
        p1Wave.classList.add('screen-flash');
        p2Wave.classList.add('screen-flash');
        p1.classList.add('ripple-active');
        p2.classList.add('ripple-active');
        
        performDataExchange();
    }, 100);
}

function performDataExchange() {
    setTimeout(() => {
        // Vuelo de Avatares
        const p1Avatar = document.getElementById('p1-avatar');
        const p2Avatar = document.getElementById('p2-avatar');
        p1Avatar.classList.add('contact-fly-out');
        p2Avatar.classList.add('contact-fly-out');

        // Cambio pantallas
        setTimeout(() => {
            document.getElementById('p1-my-card').style.opacity = '0';
            document.getElementById('p2-my-card').style.opacity = '0';

            const p1Rec = document.getElementById('p1-received');
            const p2Rec = document.getElementById('p2-received');

            p1Rec.style.transform = 'translateY(0)';
            p1Rec.style.opacity = '1';
            p2Rec.style.transform = 'translateY(0)';
            p2Rec.style.opacity = '1';
            
            // Reset rotación
            const p1 = document.getElementById('p2p-phone-1');
            const p2 = document.getElementById('p2p-phone-2');
            p1.style.transform = 'rotate(0deg)';
            p2.style.transform = 'rotate(0deg)';
            
            p1.classList.remove('ripple-active');
            p2.classList.remove('ripple-active');

        }, 600);
    }, 400);
}

function resetP2PSim() {
    p2pConnected = false;
    const p1 = document.getElementById('p2p-phone-1');
    const p2 = document.getElementById('p2p-phone-2');
    
    if(!p1 || !p2) return;

    // Reset P1 (Izquierda)
    p1.style.transition = 'all 0.5s ease';
    p1.style.left = '25%';
    p1.style.top = '50%';
    p1.style.transform = 'translate(-50%, -50%)';
    p1.style.cursor = 'grab';

    // Reset P2 (Derecha)
    p2.style.transition = 'all 0.5s ease';
    p2.style.left = '75%';
    p2.style.top = '50%';
    p2.style.transform = 'translate(-50%, -50%)';
    p2.style.cursor = 'grab';

    // Reset UI interna P1
    const p1Card = document.getElementById('p1-my-card');
    if(p1Card) p1Card.style.opacity = '1';
    const p1Av = document.getElementById('p1-avatar');
    if(p1Av) p1Av.classList.remove('contact-fly-out');
    const p1Rec = document.getElementById('p1-received');
    if(p1Rec) { p1Rec.style.transform = 'translateY(100%)'; p1Rec.style.opacity = '0'; }

    // Reset UI interna P2
    const p2Card = document.getElementById('p2-my-card');
    if(p2Card) p2Card.style.opacity = '1';
    const p2Av = document.getElementById('p2-avatar');
    if(p2Av) p2Av.classList.remove('contact-fly-out');
    const p2Rec = document.getElementById('p2-received');
    if(p2Rec) { p2Rec.style.transform = 'translateY(100%)'; p2Rec.style.opacity = '0'; }

    // Classes
    const p1Wave = document.getElementById('p1-wave');
    const p2Wave = document.getElementById('p2-wave');
    if(p1Wave) p1Wave.classList.remove('screen-flash');
    if(p2Wave) p2Wave.classList.remove('screen-flash');
    p1.classList.remove('ripple-active');
    p2.classList.remove('ripple-active');
}


// ==========================================
//  SLIDE 14: PAGOS (TRIGGER)
// ==========================================
function triggerPayment() {
    const phone = document.getElementById('pay-phone');
    const screen = document.getElementById('tpv-screen');
    
    // 1. Subir movil
    phone.style.bottom = '-40px'; 
    
    // 2. Procesando
    setTimeout(() => {
        screen.innerText = "PROCESANDO...";
        screen.className = "w-32 h-16 bg-black border border-yellow-500 rounded flex items-center justify-center text-yellow-500 font-mono text-xs animate-pulse";
    }, 800);
    
    // 3. Aceptado
    setTimeout(() => {
        screen.innerHTML = '<i class="fa-solid fa-check text-2xl"></i> OK';
        screen.className = "w-32 h-16 bg-green-900 border border-green-500 rounded flex items-center justify-center text-green-400 font-mono text-xl font-bold";
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


// ==========================================
//  INSPECTOR APDU
// ==========================================
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


// ==========================================
//  TEMAS Y CARGA
// ==========================================
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