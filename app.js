
// Variables globales
let currentReport = {
    id: null,
    title: 'Reporte 1',
    pages: [{ photos: [] }], // Ahora usamos páginas
    createdAt: new Date()
};

let reports = [];
let currentPhotoIndex = null;
let currentPageIndex = 0; // Página actual

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadReports();
    updateStats();
    renderReports();
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Error al registrar Service Worker:', err));
    }
});

// Navegación entre pantallas
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

// Manejo de imágenes
function handleImageUpload(event) {
    const files = event.target.files;
    
    if (files.length === 0) return;
    
    const currentPage = currentReport.pages[currentPageIndex];
    
    // Verificar límite de 4 fotos por página
    if (currentPage.photos.length >= 4) {
        alert('⚠️ Esta página ya tiene 4 fotos (máximo permitido). Ve a otra página para agregar más.');
        event.target.value = '';
        return;
    }
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            // Verificar de nuevo el límite antes de cada foto
            if (currentPage.photos.length >= 4) {
                alert('⚠️ Límite de 4 fotos alcanzado en esta página.');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Crear una imagen para obtener dimensiones originales
                const img = new Image();
                img.onload = function() {
                    currentPage.photos.push({
                        id: Date.now() + Math.random(),
                        data: e.target.result,
                        note: '',
                        timestamp: new Date(),
                        originalWidth: img.width,
                        originalHeight: img.height
                    });
                    
                    renderPhotos();
                    saveCurrentReport();
                    showToast('✅ Foto agregada');
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Limpiar input
    event.target.value = '';
}

// Renderizar fotos
function renderPhotos() {
    const grid = document.getElementById('photosGrid');
    const currentPage = currentReport.pages[currentPageIndex];
    
    if (currentPage.photos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📸</div>
                <p>No hay fotos en esta página</p>
                <p class="empty-subtitle">Agrega hasta 4 fotos en esta página</p>
            </div>
        `;
    } else {
        grid.innerHTML = currentPage.photos.map((photo, index) => `
            <div class="photo-item" onclick="openPhotoModal(${index})">
                <img src="${photo.data}" alt="Foto ${index + 1}" style="width: 100%; height: auto; object-fit: contain;">
                <div class="photo-number">${index + 1}</div>
                ${photo.note ? '<div class="photo-note-indicator">📝</div>' : ''}
            </div>
        `).join('');
    }
    
    // Actualizar contador
    const totalPhotos = currentReport.pages.reduce((sum, page) => sum + page.photos.length, 0);
    document.getElementById('currentPhoto').textContent = currentPage.photos.length;
    document.getElementById('totalPhotosCount').textContent = `${currentPage.photos.length}/4 en página ${currentPageIndex + 1}`;
    
    // Actualizar navegación de páginas
    updatePageNavigation();
}

function updatePageNavigation() {
    const toolbar = document.querySelector('.toolbar');
    
    // Remover navegación existente si hay
    const existingNav = document.querySelector('.page-navigation');
    if (existingNav) existingNav.remove();
    
    // Crear navegación de páginas
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
    // Si estamos en la última página, crear una nueva
    if (currentPageIndex === currentReport.pages.length - 1) {
        currentReport.pages.push({ photos: [] });
        saveCurrentReport();
    }
    
    currentPageIndex++;
    renderPhotos();
}

// Modal de foto
function openPhotoModal(index) {
    currentPhotoIndex = index;
    const currentPage = currentReport.pages[currentPageIndex];
    const photo = currentPage.photos[index];
    
    document.getElementById('modalImage').src = photo.data;
    document.getElementById('photoNote').value = photo.note || '';
    document.getElementById('photoModal').classList.add('active');
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
    currentPhotoIndex = null;
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

// Agregar nota de texto
function addTextNote() {
    const currentPage = currentReport.pages[currentPageIndex];
    
    if (currentPage.photos.length >= 4) {
        alert('⚠️ Esta página ya tiene 4 fotos (máximo permitido).');
        return;
    }
    
    const note = prompt('Escribe una nota:');
    if (note && note.trim()) {
        // Crear una imagen con el texto
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto
        ctx.fillStyle = '#2C3E50';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Dividir texto en líneas
        const words = note.split(' ');
        let line = '';
        let y = 50;
        const maxWidth = 700;
        const lineHeight = 40;
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, canvas.width / 2, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, canvas.width / 2, y);
        
        // Agregar como foto
        currentPage.photos.push({
            id: Date.now(),
            data: canvas.toDataURL('image/png'),
            note: 'Nota de texto',
            timestamp: new Date(),
            originalWidth: 800,
            originalHeight: 600
        });
        
        renderPhotos();
        saveCurrentReport();
        showToast('📝 Nota agregada');
    }
}

// Generar PDF
async function generatePDF() {
    const totalPhotos = currentReport.pages.reduce((sum, page) => sum + page.photos.length, 0);
    
    if (totalPhotos === 0) {
        alert('❌ Agrega al menos una foto para generar el PDF');
        return;
    }
    
    showToast('⏳ Generando PDF...');
    
    // Usar jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);
    
    let isFirstPage = true;
    
    // Recorrer cada página del reporte
    for (let pageIndex = 0; pageIndex < currentReport.pages.length; pageIndex++) {
        const page = currentReport.pages[pageIndex];
        
        if (page.photos.length === 0) continue;
        
        // Agregar nueva página si no es la primera
        if (!isFirstPage) {
            pdf.addPage();
        }
        isFirstPage = false;
        
        // Título de la página
        pdf.setFontSize(16);
        pdf.setTextColor(255, 107, 53);
        pdf.text(`${currentReport.title} - Página ${pageIndex + 1}`, pageWidth / 2, margin, { align: 'center' });
        
        // Organizar fotos en grid 2x2 (máximo 4 fotos)
        const photosPerRow = 2;
        const photoSpacing = 5;
        const availableWidthPerPhoto = (usableWidth - photoSpacing) / photosPerRow;
        
        let yPosition = margin + 10;
        
        for (let i = 0; i < page.photos.length; i++) {
            const photo = page.photos[i];
            const row = Math.floor(i / photosPerRow);
            const col = i % photosPerRow;
            
            // Calcular posición X e Y
            const xPosition = margin + (col * (availableWidthPerPhoto + photoSpacing));
            const yPos = yPosition + (row * (availableWidthPerPhoto + photoSpacing + 15));
            
            // Calcular dimensiones manteniendo aspecto original
            let imgWidth = availableWidthPerPhoto;
            let imgHeight = (photo.originalHeight / photo.originalWidth) * imgWidth;
            
            // Si la altura excede el espacio disponible, ajustar por altura
            if (imgHeight > availableWidthPerPhoto) {
                imgHeight = availableWidthPerPhoto;
                imgWidth = (photo.originalWidth / photo.originalHeight) * imgHeight;
            }
            
            try {
                // Agregar número de foto
                pdf.setFontSize(10);
                pdf.setTextColor(0);
                pdf.text(`Foto ${i + 1}`, xPosition, yPos);
                
                // Agregar imagen manteniendo tamaño original proporcional
                pdf.addImage(
                    photo.data, 
                    'JPEG', 
                    xPosition, 
                    yPos + 3, 
                    imgWidth, 
                    imgHeight
                );
                
                // Agregar nota si existe
                if (photo.note && photo.note.trim()) {
                    pdf.setFontSize(8);
                    pdf.setTextColor(100);
                    const noteY = yPos + imgHeight + 5;
                    const lines = pdf.splitTextToSize(photo.note, imgWidth);
                    pdf.text(lines.slice(0, 2), xPosition, noteY); // Máximo 2 líneas de nota
                }
            } catch (error) {
                console.error('Error al agregar imagen:', error);
            }
        }
    }
    
    // Agregar pie de página en todas las páginas
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
    
    // Guardar PDF
    const fileName = `${currentReport.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    pdf.save(fileName);
    
    showToast('✅ PDF generado exitosamente');
}

// Menú
function showMenu() {
    document.getElementById('menuModal').classList.add('active');
}

function closeMenu() {
    document.getElementById('menuModal').classList.remove('active');
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

function clearAllPhotos() {
    if (confirm('¿Eliminar todas las fotos del reporte?')) {
        currentReport.pages = [{ photos: [] }];
        currentPageIndex = 0;
        renderPhotos();
        saveCurrentReport();
        showToast('🗑️ Todas las fotos eliminadas');
    }
    closeMenu();
}

async function shareReport() {
    const totalPhotos = currentReport.pages.reduce((sum, page) => sum + page.photos.length, 0);
    
    if (totalPhotos === 0) {
        alert('❌ Agrega fotos antes de compartir');
        closeMenu();
        return;
    }
    
    // Si el navegador soporta Web Share API
    if (navigator.share) {
        try {
            await navigator.share({
                title: currentReport.title,
                text: `Reporte fotográfico: ${currentReport.title} - ${totalPhotos} fotos en ${currentReport.pages.length} páginas`
            });
            showToast('📤 Compartido');
        } catch (error) {
            console.log('Error al compartir:', error);
        }
    } else {
        alert('Tu navegador no soporta compartir. Genera un PDF para compartir.');
    }
    closeMenu();
}

// Gestión de reportes
function saveCurrentReport() {
    const existingIndex = reports.findIndex(r => r.id === currentReport.id);
    
    if (existingIndex >= 0) {
        reports[existingIndex] = JSON.parse(JSON.stringify(currentReport));
    } else {
        reports.push(JSON.parse(JSON.stringify(currentReport)));
    }
    
    localStorage.setItem('photoReports', JSON.stringify(reports));
}

function loadReports() {
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
                        📸 ${totalPhotos} fotos • 📄 ${report.pages.length} páginas • 
                        📅 ${new Date(report.createdAt).toLocaleDateString()}
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

function updateStats() {
    const totalPhotos = reports.reduce((sum, report) => {
        return sum + report.pages.reduce((pageSum, page) => pageSum + page.photos.length, 0);
    }, 0);
    document.getElementById('totalReports').textContent = reports.length;
    document.getElementById('totalPhotos').textContent = totalPhotos;
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Cerrar modales al hacer clic fuera
document.getElementById('photoModal').addEventListener('click', function(e) {
    if (e.target === this) closePhotoModal();
});

document.getElementById('menuModal').addEventListener('click', function(e) {
    if (e.target === this) closeMenu();
});

