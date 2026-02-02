// ===============================================
// REPORTES FOTOGRÁFICOS PRO - v2.0
// ===============================================

// Configuración global
const CONFIG = {
    maxPhotosPerPage: 4,
    compressionQuality: 0.8,
    maxImageSize: 1920,
    autoSave: true,
    pdfTemplate: 'default',
    darkMode: false
};

// Variables globales
let currentReport = {
    id: null,
    title: 'Reporte 1',
    pages: [{ photos: [] }],
    createdAt: new Date()
};

let reports = [];
let currentPhotoIndex = null;
let currentPageIndex = 0;
let isZoomed = false;
let pdfInstance = null;

// ===============================================
// INICIALIZACIÓN
// ===============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Cargar configuración guardada
        loadSettings();
        
        // Cargar reportes
        await loadReports();
        
        // Actualizar UI
        updateStats();
        renderReports();
        
        // Aplicar tema guardado
        if (CONFIG.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').checked = true;
        }
        
        // Configurar drag & drop
        setupDragAndDrop();
        
        // Registrar Service Worker
        registerServiceWorker();
        
        console.log('✅ App inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showToast('⚠️ Error al cargar la aplicación');
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('✅ Service Worker registrado'))
            .catch(err => console.error('❌ Error al registrar SW:', err));
    }
}

// ===============================================
// COMPRESIÓN DE IMÁGENES
// ===============================================

async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                try {
                    // Calcular nuevas dimensiones
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > CONFIG.maxImageSize || height > CONFIG.maxImageSize) {
                        if (width > height) {
                            height = (height / width) * CONFIG.maxImageSize;
                            width = CONFIG.maxImageSize;
                        } else {
                            width = (width / height) * CONFIG.maxImageSize;
                            height = CONFIG.maxImageSize;
                        }
                    }
                    
                    // Crear canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Comprimir y convertir a base64
                    const compressedData = canvas.toDataURL('image/jpeg', CONFIG.compressionQuality);
                    
                    resolve({
                        data: compressedData,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        compressedWidth: width,
                        compressedHeight: height
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===============================================
// NAVEGACIÓN
// ===============================================

function showHome() {
    document.getElementById('homeScreen').classList.add('active');
    document.getElementById('newReportScreen').classList.remove('active');
    updateStats();
    renderReports();
}

function showNewReport() {
    currentReport = {
        id: Date.now(),
        title: `Reporte ${reports.length + 1}`,
        pages: [{ photos: [] }],
        createdAt: new Date()
    };
    
    currentPageIndex = 0;
    document.getElementById('reportTitle').textContent = currentReport.title;
    document.getElementById('homeScreen').classList.remove('active');
    document.getElementById('newReportScreen').classList.add('active');
    
    renderPhotos();
}

function loadReport(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (report) {
        currentReport = JSON.parse(JSON.stringify(report));
        currentPageIndex = 0;
        document.getElementById('reportTitle').textContent = currentReport.title;
        document.getElementById('homeScreen').classList.remove('active');
        document.getElementById('newReportScreen').classList.add('active');
        renderPhotos();
    }
}

// ===============================================
// MANEJO DE IMÁGENES
// ===============================================

async function handleImageUpload(event) {
    const files = event.target.files;
    
    if (files.length === 0) return;
    
    const currentPage = currentReport.pages[currentPageIndex];
    
    if (currentPage.photos.length >= CONFIG.maxPhotosPerPage) {
        showToast('⚠️ Esta página ya tiene 4 fotos. Ve a otra página.');
        event.target.value = '';
        return;
    }
    
    showLoading('Comprimiendo imágenes...');
    
    try {
        const processFiles = Array.from(files).slice(0, CONFIG.maxPhotosPerPage - currentPage.photos.length);
        
        for (const file of processFiles) {
            if (file.type.startsWith('image/')) {
                try {
                    const compressed = await compressImage(file);
                    
                    currentPage.photos.push({
                        id: Date.now() + Math.random(),
                        data: compressed.data,
                        note: '',
                        timestamp: new Date(),
                        originalWidth: compressed.originalWidth,
                        originalHeight: compressed.originalHeight
                    });
                    
                    await sleep(100); // Pequeña pausa para no bloquear UI
                } catch (error) {
                    console.error('Error al procesar imagen:', error);
                }
            }
        }
        
        renderPhotos();
        saveCurrentReport();
        hideLoading();
        showToast(`✅ ${processFiles.length} foto(s) agregada(s)`);
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showToast('❌ Error al procesar imágenes');
    }
    
    event.target.value = '';
}

// ===============================================
// DRAG & DROP
// ===============================================

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
    if (!dropZone) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
}

async function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length === 0) return;
    
    const currentPage = currentReport.pages[currentPageIndex];
    
    if (currentPage.photos.length >= CONFIG.maxPhotosPerPage) {
        showToast('⚠️ Esta página ya tiene 4 fotos');
        return;
    }
    
    showLoading('Procesando imágenes...');
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const toProcess = imageFiles.slice(0, CONFIG.maxPhotosPerPage - currentPage.photos.length);
    
    for (const file of toProcess) {
        try {
            const compressed = await compressImage(file);
            
            currentPage.photos.push({
                id: Date.now() + Math.random(),
                data: compressed.data,
                note: '',
                timestamp: new Date(),
                originalWidth: compressed.originalWidth,
                originalHeight: compressed.originalHeight
            });
            
            await sleep(100);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    renderPhotos();
    saveCurrentReport();
    hideLoading();
    showToast(`✅ ${toProcess.length} foto(s) agregada(s)`);
}

// ===============================================
// RENDERIZADO DE FOTOS
// ===============================================

function renderPhotos() {
    const grid = document.getElementById('photosGrid');
    const currentPage = currentReport.pages[currentPageIndex];
    
    if (currentPage.photos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📸</div>
                <p>No hay fotos en esta página</p>
                <p class="empty-subtitle">Agrega hasta 4 fotos</p>
            </div>
        `;
    } else {
        grid.innerHTML = currentPage.photos.map((photo, index) => `
            <div class="photo-item" onclick="openPhotoModal(${index})" draggable="true" data-index="${index}">
                <img src="${photo.data}" alt="Foto ${index + 1}" loading="lazy">
                <div class="photo-number">${index + 1}</div>
                ${photo.note ? '<div class="photo-note-indicator">📝</div>' : ''}
            </div>
        `).join('');
        
        // Configurar sortable para reordenar
        setupSortable();
    }
    
    // Actualizar contador
    document.getElementById('currentPhoto').textContent = currentPage.photos.length;
    document.getElementById('currentPageNum').textContent = currentPageIndex + 1;
    
    updatePageNavigation();
}

function setupSortable() {
    const grid = document.getElementById('photosGrid');
    
    if (typeof Sortable !== 'undefined') {
        new Sortable(grid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                const currentPage = currentReport.pages[currentPageIndex];
                const item = currentPage.photos.splice(evt.oldIndex, 1)[0];
                currentPage.photos.splice(evt.newIndex, 0, item);
                
                renderPhotos();
                saveCurrentReport();
                showToast('✅ Orden actualizado');
            }
        });
    }
}

function updatePageNavigation() {
    const toolbar = document.querySelector('.toolbar');
    const existingNav = document.querySelector('.page-navigation');
    if (existingNav) existingNav.remove();
    
    const nav = document.createElement('div');
    nav.className = 'page-navigation';
    nav.innerHTML = `
        <button class="page-btn" onclick="previousPage()" ${currentPageIndex === 0 ? 'disabled' : ''}>
            ← Anterior
        </button>
        <span class="page-indicator">
            Página ${currentPageIndex + 1} de ${currentReport.pages.length}
        </span>
        <button class="page-btn" onclick="nextPage()">
            Siguiente →
        </button>
    `;
    
    toolbar.parentNode.insertBefore(nav, toolbar.nextSibling);
}

function previousPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        renderPhotos();
    }
}

function nextPage() {
    if (currentPageIndex === currentReport.pages.length - 1) {
        currentReport.pages.push({ photos: [] });
        saveCurrentReport();
    }
    
    currentPageIndex++;
    renderPhotos();
}

// ===============================================
// MODAL DE FOTO
// ===============================================

function openPhotoModal(index) {
    currentPhotoIndex = index;
    const currentPage = currentReport.pages[currentPageIndex];
    const photo = currentPage.photos[index];
    
    document.getElementById('modalImage').src = photo.data;
    const noteInput = document.getElementById('photoNote');
    noteInput.value = photo.note || '';
    updateNoteCounter();
    
    document.getElementById('photoModal').classList.add('active');
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
    currentPhotoIndex = null;
    isZoomed = false;
    document.getElementById('photoViewer').classList.remove('zoomed');
}

function toggleZoom() {
    isZoomed = !isZoomed;
    const viewer = document.getElementById('photoViewer');
    viewer.classList.toggle('zoomed');
    showToast(isZoomed ? '🔍 Zoom activado' : '🔍 Zoom desactivado');
}

function savePhotoNote() {
    if (currentPhotoIndex !== null) {
        const note = document.getElementById('photoNote').value;
        const currentPage = currentReport.pages[currentPageIndex];
        currentPage.photos[currentPhotoIndex].note = note;
        
        renderPhotos();
        saveCurrentReport();
        closePhotoModal();
        showToast('💾 Nota guardada');
    }
}

function deleteCurrentPhoto() {
    if (currentPhotoIndex !== null && confirm('¿Eliminar esta foto?')) {
        const currentPage = currentReport.pages[currentPageIndex];
        currentPage.photos.splice(currentPhotoIndex, 1);
        renderPhotos();
        saveCurrentReport();
        closePhotoModal();
        showToast('🗑️ Foto eliminada');
    }
}

function updateNoteCounter() {
    const noteInput = document.getElementById('photoNote');
    const counter = document.getElementById('noteLength');
    counter.textContent = noteInput.value.length;
}

// Actualizar contador mientras escribe
document.addEventListener('DOMContentLoaded', () => {
    const noteInput = document.getElementById('photoNote');
    if (noteInput) {
        noteInput.addEventListener('input', updateNoteCounter);
    }
});

// ===============================================
// NOTA DE TEXTO
// ===============================================

async function addTextNote() {
    const currentPage = currentReport.pages[currentPageIndex];
    
    if (currentPage.photos.length >= CONFIG.maxPhotosPerPage) {
        showToast('⚠️ Esta página ya tiene 4 fotos');
        return;
    }
    
    const note = prompt('Escribe una nota:');
    if (!note || !note.trim()) return;
    
    showLoading('Creando nota...');
    
    try {
        // Crear imagen de texto
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Fondo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto
        ctx.fillStyle = '#2C3E50';
        ctx.font = '32px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dividir texto en líneas
        const words = note.trim().split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > canvas.width - 100 && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        });
        lines.push(currentLine);
        
        // Dibujar líneas
        const lineHeight = 45;
        const startY = (canvas.height - (lines.length * lineHeight)) / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line.trim(), canvas.width / 2, startY + (index * lineHeight));
        });
        
        // Icono
        ctx.font = '48px Arial';
        ctx.fillText('📝', canvas.width / 2, 80);
        
        const noteData = canvas.toDataURL('image/jpeg', 0.9);
        
        currentPage.photos.push({
            id: Date.now() + Math.random(),
            data: noteData,
            note: note.trim(),
            timestamp: new Date(),
            originalWidth: canvas.width,
            originalHeight: canvas.height,
            isTextNote: true
        });
        
        renderPhotos();
        saveCurrentReport();
        hideLoading();
        showToast('✅ Nota agregada');
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showToast('❌ Error al crear nota');
    }
}

// ===============================================
// GENERACIÓN DE PDF
// ===============================================

async function generatePDF() {
    const totalPhotos = currentReport.pages.reduce((sum, page) => sum + page.photos.length, 0);
    
    if (totalPhotos === 0) {
        showToast('❌ Agrega fotos antes de generar PDF');
        return;
    }
    
    showLoading('Generando PDF...');
    
    try {
        await sleep(500);
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const usableWidth = pageWidth - (margin * 2);
        
        let isFirstPage = true;
        
        // Aplicar plantilla seleccionada
        const template = CONFIG.pdfTemplate;
        
        for (let pageIndex = 0; pageIndex < currentReport.pages.length; pageIndex++) {
            const page = currentReport.pages[pageIndex];
            
            if (page.photos.length === 0) continue;
            
            if (!isFirstPage) {
                pdf.addPage();
            }
            isFirstPage = false;
            
            // Header según plantilla
            if (template === 'professional') {
                drawProfessionalHeader(pdf, pageWidth, margin, pageIndex);
            } else if (template === 'compact') {
                drawCompactHeader(pdf, pageWidth, margin, pageIndex);
            } else {
                drawDefaultHeader(pdf, pageWidth, margin, pageIndex);
            }
            
            // Organizar fotos
            const photosPerRow = 2;
            const photoSpacing = 5;
            const availableWidthPerPhoto = (usableWidth - photoSpacing) / photosPerRow;
            
            let yPosition = margin + (template === 'compact' ? 15 : 20);
            
            for (let i = 0; i < page.photos.length; i++) {
                const photo = page.photos[i];
                const row = Math.floor(i / photosPerRow);
                const col = i % photosPerRow;
                
                const xPosition = margin + (col * (availableWidthPerPhoto + photoSpacing));
                const yPos = yPosition + (row * (availableWidthPerPhoto + photoSpacing + 15));
                
                let imgWidth = availableWidthPerPhoto;
                let imgHeight = (photo.originalHeight / photo.originalWidth) * imgWidth;
                
                if (imgHeight > availableWidthPerPhoto) {
                    imgHeight = availableWidthPerPhoto;
                    imgWidth = (photo.originalWidth / photo.originalHeight) * imgHeight;
                }
                
                try {
                    // Número de foto
                    pdf.setFontSize(10);
                    pdf.setTextColor(0);
                    pdf.text(`Foto ${i + 1}`, xPosition, yPos);
                    
                    // Imagen
                    pdf.addImage(
                        photo.data,
                        'JPEG',
                        xPosition,
                        yPos + 3,
                        imgWidth,
                        imgHeight
                    );
                    
                    // Nota
                    if (photo.note && photo.note.trim()) {
                        pdf.setFontSize(8);
                        pdf.setTextColor(100);
                        const noteY = yPos + imgHeight + 5;
                        const lines = pdf.splitTextToSize(photo.note, imgWidth);
                        pdf.text(lines.slice(0, 2), xPosition, noteY);
                    }
                } catch (error) {
                    console.error('Error al agregar imagen:', error);
                }
            }
        }
        
        // Footer
        const totalPages = pdf.internal.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.text(
                `Página ${i} de ${totalPages} - ${new Date().toLocaleDateString()}`,
                pageWidth / 2,
                pageHeight - 5,
                { align: 'center' }
            );
        }
        
        pdfInstance = pdf;
        hideLoading();
        
        // Mostrar vista previa
        showPDFPreview(pdf);
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        hideLoading();
        showToast('❌ Error al generar PDF');
    }
}

function drawDefaultHeader(pdf, pageWidth, margin, pageIndex) {
    pdf.setFontSize(16);
    pdf.setTextColor(255, 107, 53);
    pdf.text(`${currentReport.title} - Página ${pageIndex + 1}`, pageWidth / 2, margin, { align: 'center' });
}

function drawProfessionalHeader(pdf, pageWidth, margin, pageIndex) {
    pdf.setFillColor(255, 107, 53);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text(currentReport.title, pageWidth / 2, 12, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`Página ${pageIndex + 1}`, pageWidth / 2, 18, { align: 'center' });
}

function drawCompactHeader(pdf, pageWidth, margin, pageIndex) {
    pdf.setFontSize(12);
    pdf.setTextColor(255, 107, 53);
    pdf.text(`${currentReport.title} - P.${pageIndex + 1}`, margin, margin - 3);
}

function showPDFPreview(pdf) {
    const modal = document.getElementById('pdfPreviewModal');
    const container = document.getElementById('pdfPreviewContainer');
    
    container.innerHTML = `
        <div class="pdf-preview-info">
            <p>✅ PDF generado exitosamente</p>
            <p>📄 ${pdf.internal.getNumberOfPages()} página(s)</p>
            <p>📊 ${currentReport.pages.reduce((sum, p) => sum + p.photos.length, 0)} foto(s)</p>
        </div>
    `;
    
    modal.classList.add('active');
}

function closePDFPreview() {
    document.getElementById('pdfPreviewModal').classList.remove('active');
}

function downloadPDFFromPreview() {
    if (pdfInstance) {
        const fileName = `${currentReport.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        pdfInstance.save(fileName);
        closePDFPreview();
        showToast('📥 PDF descargado');
    }
}

// ===============================================
// MENÚ Y CONFIGURACIÓN
// ===============================================

function showMenu() {
    document.getElementById('menuModal').classList.add('active');
}

function closeMenu() {
    document.getElementById('menuModal').classList.remove('active');
}

function showSettings() {
    document.getElementById('settingsModal').classList.add('active');
    updateStorageInfo();
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function editReportTitle() {
    const newTitle = prompt('Nuevo nombre del reporte:', currentReport.title);
    if (newTitle && newTitle.trim()) {
        currentReport.title = newTitle.trim();
        document.getElementById('reportTitle').textContent = currentReport.title;
        saveCurrentReport();
        showToast('✏️ Nombre actualizado');
    }
    closeMenu();
}

function duplicateReport() {
    const duplicate = JSON.parse(JSON.stringify(currentReport));
    duplicate.id = Date.now();
    duplicate.title = `${duplicate.title} (Copia)`;
    duplicate.createdAt = new Date();
    
    reports.push(duplicate);
    localStorage.setItem('photoReports', JSON.stringify(reports));
    
    closeMenu();
    showToast('📋 Reporte duplicado');
    updateStats();
}

function exportReport() {
    const dataStr = JSON.stringify(currentReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentReport.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    link.click();
    
    closeMenu();
    showToast('💾 Datos exportados');
}

function clearAllPhotos() {
    if (confirm('¿Eliminar todas las fotos del reporte?')) {
        currentReport.pages = [{ photos: [] }];
        currentPageIndex = 0;
        renderPhotos();
        saveCurrentReport();
        showToast('🗑️ Fotos eliminadas');
    }
    closeMenu();
}

async function shareReport() {
    const totalPhotos = currentReport.pages.reduce((sum, page) => sum + page.photos.length, 0);
    
    if (totalPhotos === 0) {
        showToast('❌ Agrega fotos antes de compartir');
        closeMenu();
        return;
    }
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: currentReport.title,
                text: `Reporte: ${currentReport.title} - ${totalPhotos} fotos`
            });
            showToast('📤 Compartido');
        } catch (error) {
            console.log('Compartir cancelado');
        }
    } else {
        showToast('⚠️ Genera un PDF para compartir');
    }
    closeMenu();
}

// ===============================================
// CONFIGURACIÓN
// ===============================================

function toggleDarkMode() {
    CONFIG.darkMode = !CONFIG.darkMode;
    document.body.classList.toggle('dark-mode');
    saveSettings();
    showToast(CONFIG.darkMode ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado');
}

function updateQuality() {
    CONFIG.compressionQuality = parseFloat(document.getElementById('qualitySelect').value);
    saveSettings();
    showToast('✅ Calidad actualizada');
}

function toggleAutoSave() {
    CONFIG.autoSave = document.getElementById('autoSaveToggle').checked;
    saveSettings();
    showToast(CONFIG.autoSave ? '✅ Auto-guardar activado' : '⚠️ Auto-guardar desactivado');
}

function updatePDFTemplate() {
    CONFIG.pdfTemplate = document.getElementById('pdfTemplateSelect').value;
    saveSettings();
    showToast('📄 Plantilla PDF actualizada');
}

function saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(CONFIG));
}

function loadSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        Object.assign(CONFIG, settings);
        
        // Aplicar a UI
        document.getElementById('qualitySelect').value = CONFIG.compressionQuality;
        document.getElementById('autoSaveToggle').checked = CONFIG.autoSave;
        document.getElementById('pdfTemplateSelect').value = CONFIG.pdfTemplate;
    }
}

function confirmClearAll() {
    if (confirm('⚠️ ¿Eliminar TODOS los reportes? Esta acción no se puede deshacer.')) {
        if (confirm('¿Estás completamente seguro?')) {
            reports = [];
            localStorage.removeItem('photoReports');
            closeSettings();
            showHome();
            showToast('🗑️ Todos los reportes eliminados');
        }
    }
}

function exportAllData() {
    const dataStr = JSON.stringify(reports, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `reportes_backup_${Date.now()}.json`;
    link.click();
    
    showToast('💾 Backup exportado');
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (Array.isArray(data)) {
            if (confirm(`¿Importar ${data.length} reporte(s)?`)) {
                reports = data;
                localStorage.setItem('photoReports', JSON.stringify(reports));
                updateStats();
                renderReports();
                showToast('✅ Datos importados');
            }
        } else {
            showToast('❌ Formato de archivo inválido');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Error al importar');
    }
    
    event.target.value = '';
}

function updateStorageInfo() {
    const data = JSON.stringify(reports);
    const size = new Blob([data]).size;
    const mb = (size / 1024 / 1024).toFixed(2);
    
    document.getElementById('storageDetails').textContent = `${mb} MB`;
}

// ===============================================
// GESTIÓN DE REPORTES
// ===============================================

function saveCurrentReport() {
    if (!CONFIG.autoSave) return;
    
    const existingIndex = reports.findIndex(r => r.id === currentReport.id);
    
    if (existingIndex >= 0) {
        reports[existingIndex] = JSON.parse(JSON.stringify(currentReport));
    } else {
        reports.push(JSON.parse(JSON.stringify(currentReport)));
    }
    
    localStorage.setItem('photoReports', JSON.stringify(reports));
}

async function loadReports() {
    const saved = localStorage.getItem('photoReports');
    if (saved) {
        reports = JSON.parse(saved);
    }
}

function deleteReport(reportId, event) {
    event.stopPropagation();
    
    if (confirm('¿Eliminar este reporte?')) {
        reports = reports.filter(r => r.id !== reportId);
        localStorage.setItem('photoReports', JSON.stringify(reports));
        renderReports();
        updateStats();
        showToast('🗑️ Reporte eliminado');
    }
}

function renderReports() {
    const container = document.getElementById('reportsContainer');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No hay reportes guardados</p>
                <p class="empty-subtitle">Crea tu primer reporte</p>
            </div>
        `;
    } else {
        container.innerHTML = reports.slice().reverse().map(report => {
            const totalPhotos = report.pages.reduce((sum, page) => sum + page.photos.length, 0);
            return `
            <div class="report-card" onclick="loadReport(${report.id})">
                <div class="report-info">
                    <h4>${report.title}</h4>
                    <div class="report-meta">
                        📸 ${totalPhotos} fotos • 📄 ${report.pages.length} página(s) • 
                        📅 ${new Date(report.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="report-actions">
                    <button class="btn-small" onclick="deleteReport(${report.id}, event)" title="Eliminar">🗑️</button>
                </div>
            </div>
        `;
        }).join('');
    }
}

function searchReports() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = reports.filter(r => r.title.toLowerCase().includes(query));
    
    const container = document.getElementById('reportsContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No se encontraron resultados</p>
            </div>
        `;
    } else {
        container.innerHTML = filtered.slice().reverse().map(report => {
            const totalPhotos = report.pages.reduce((sum, page) => sum + page.photos.length, 0);
            return `
            <div class="report-card" onclick="loadReport(${report.id})">
                <div class="report-info">
                    <h4>${report.title}</h4>
                    <div class="report-meta">
                        📸 ${totalPhotos} fotos • 📄 ${report.pages.length} página(s)
                    </div>
                </div>
                <div class="report-actions">
                    <button class="btn-small" onclick="deleteReport(${report.id}, event)">🗑️</button>
                </div>
            </div>
        `;
        }).join('');
    }
}

function sortReports() {
    const sortBy = document.getElementById('sortSelect').value;
    
    switch(sortBy) {
        case 'newest':
            reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            reports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'name':
            reports.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'photos':
            reports.sort((a, b) => {
                const aPhotos = a.pages.reduce((sum, p) => sum + p.photos.length, 0);
                const bPhotos = b.pages.reduce((sum, p) => sum + p.photos.length, 0);
                return bPhotos - aPhotos;
            });
            break;
    }
    
    renderReports();
}

function updateStats() {
    const totalPhotos = reports.reduce((sum, report) => {
        return sum + report.pages.reduce((pageSum, page) => pageSum + page.photos.length, 0);
    }, 0);
    
    document.getElementById('totalReports').textContent = reports.length;
    document.getElementById('totalPhotos').textContent = totalPhotos;
    
    // Calcular almacenamiento
    const data = JSON.stringify(reports);
    const size = new Blob([data]).size;
    const mb = (size / 1024 / 1024).toFixed(2);
    document.getElementById('storageUsed').textContent = `${mb} MB`;
}

// ===============================================
// UTILIDADES
// ===============================================

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading(text = 'Procesando...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingModal').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingModal').classList.remove('active');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===============================================
// EVENT LISTENERS
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // Cerrar modales al hacer clic fuera
    document.getElementById('photoModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePhotoModal();
    });
    
    document.getElementById('menuModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeMenu();
    });
    
    document.getElementById('settingsModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeSettings();
    });
    
    document.getElementById('pdfPreviewModal')?.addEventListener('click', function(e) {
        if (e.target === this) closePDFPreview();
    });
});

console.log('📸 Reportes Fotográficos Pro v2.0 cargado');