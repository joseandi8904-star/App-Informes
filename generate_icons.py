#!/usr/bin/env python3
"""
Script para generar iconos de diferentes tamaños para la PWA
Reportes Fotográficos Pro v2.0
Requiere: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

# Tamaños de iconos necesarios para PWA
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_gradient_icon(size):
    """Crea un icono con gradiente y diseño profesional"""
    
    # Crear imagen
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Dibujar fondo con gradiente naranja a amarillo
    for i in range(size):
        # Gradiente de arriba a abajo
        r = int(255 - (i / size) * 8)
        g = int(107 + (i / size) * 114)
        b = int(53 - (i / size) * 23)
        draw.rectangle([(0, i), (size, i+1)], fill=(r, g, b))
    
    # Dibujar círculo blanco en el centro
    circle_size = int(size * 0.75)
    margin = (size - circle_size) // 2
    draw.ellipse(
        [(margin, margin), (size - margin, size - margin)],
        fill='white',
        outline=None
    )
    
    # Dibujar cámara simplificada
    camera_size = int(size * 0.45)
    camera_x = (size - camera_size) // 2
    camera_y = (size - camera_size) // 2
    
    # Cuerpo de cámara
    body_height = int(camera_size * 0.7)
    body_y = camera_y + int(camera_size * 0.3)
    
    draw.rounded_rectangle(
        [(camera_x, body_y), 
         (camera_x + camera_size, body_y + body_height)],
        radius=int(camera_size * 0.1),
        fill=(255, 107, 53)
    )
    
    # Lente central
    lens_size = int(camera_size * 0.4)
    lens_x = camera_x + (camera_size - lens_size) // 2
    lens_y = body_y + (body_height - lens_size) // 2
    
    draw.ellipse(
        [(lens_x, lens_y), (lens_x + lens_size, lens_y + lens_size)],
        fill='white',
        outline=(255, 107, 53),
        width=max(1, int(size * 0.02))
    )
    
    # Círculo interior del lente
    inner_lens = int(lens_size * 0.5)
    inner_x = lens_x + (lens_size - inner_lens) // 2
    inner_y = lens_y + (lens_size - inner_lens) // 2
    
    draw.ellipse(
        [(inner_x, inner_y), (inner_x + inner_lens, inner_y + inner_lens)],
        fill=(255, 107, 53)
    )
    
    # Flash
    flash_size = int(camera_size * 0.18)
    flash_x = camera_x + int(camera_size * 0.72)
    flash_y = body_y + int(body_height * 0.2)
    
    draw.ellipse(
        [(flash_x, flash_y), (flash_x + flash_size, flash_y + flash_size)],
        fill=(247, 193, 30)
    )
    
    # Visor (rectángulo pequeño arriba)
    visor_width = int(camera_size * 0.15)
    visor_height = int(camera_size * 0.1)
    visor_x = camera_x + int(camera_size * 0.15)
    visor_y = body_y + int(body_height * 0.15)
    
    draw.rounded_rectangle(
        [(visor_x, visor_y), (visor_x + visor_width, visor_y + visor_height)],
        radius=int(visor_width * 0.2),
        fill=(220, 220, 220)
    )
    
    return img

def create_maskable_icon(size):
    """Crea un icono maskable con espacio de seguridad"""
    
    # Crear imagen más grande para el espacio de seguridad
    safe_size = int(size * 1.2)
    img = Image.new('RGB', (safe_size, safe_size), color=(255, 107, 53))
    
    # Crear el icono normal
    icon = create_gradient_icon(size)
    
    # Centrar el icono en la imagen más grande
    offset = (safe_size - size) // 2
    img.paste(icon, (offset, offset))
    
    # Redimensionar de vuelta al tamaño original
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    return img

def generate_all_icons():
    """Genera todos los iconos necesarios"""
    
    print("🎨 Generando iconos para Reportes Fotográficos Pro v2.0...")
    print("=" * 60)
    
    success_count = 0
    
    for size in ICON_SIZES:
        try:
            # Generar icono normal
            icon = create_gradient_icon(size)
            filename = f'icon-{size}.png'
            icon.save(filename, 'PNG', optimize=True)
            print(f"✅ Generado: {filename} ({size}x{size}px)")
            success_count += 1
            
            # Generar icono maskable para 192 y 512
            if size in [192, 512]:
                maskable = create_maskable_icon(size)
                maskable_filename = f'icon-{size}-maskable.png'
                maskable.save(maskable_filename, 'PNG', optimize=True)
                print(f"✅ Generado: {maskable_filename} (maskable)")
                success_count += 1
                
        except Exception as e:
            print(f"❌ Error generando icon-{size}.png: {e}")
    
    print("=" * 60)
    print(f"\n✨ ¡Proceso completado!")
    print(f"📊 {success_count} archivos generados exitosamente")
    print(f"\n📋 Próximos pasos:")
    print("1. Sube estos archivos .png al mismo directorio que tu app")
    print("2. Asegúrate que manifest.json esté en el mismo directorio")
    print("3. Usa PWABuilder.com para generar el APK/AAB para Google Play")
    print("4. O instala directamente desde el navegador (Chrome/Edge)")
    print("\n💡 Tip: Para instalar en Android, abre la app en Chrome")
    print("   y selecciona 'Agregar a pantalla de inicio' o 'Instalar app'")

def create_screenshot():
    """Crea una captura de pantalla de ejemplo"""
    
    try:
        width, height = 540, 720
        img = Image.new('RGB', (width, height), color=(245, 245, 245))
        draw = ImageDraw.Draw(img)
        
        # Header
        draw.rectangle([(0, 0), (width, 80)], fill=(255, 107, 53))
        
        # Simular contenido
        draw.rectangle([(20, 100), (width-20, 200)], fill='white', outline=(224, 224, 224))
        draw.rectangle([(20, 220), (width-20, 320)], fill='white', outline=(224, 224, 224))
        
        img.save('screenshot1.png', 'PNG', optimize=True)
        print("✅ Generado: screenshot1.png (540x720px)")
        
    except Exception as e:
        print(f"⚠️  No se pudo generar screenshot: {e}")

if __name__ == '__main__':
    try:
        print("\n" + "🚀" * 30)
        print("   GENERADOR DE ICONOS PARA PWA")
        print("🚀" * 30 + "\n")
        
        # Verificar que PIL/Pillow está instalado
        generate_all_icons()
        
        # Generar screenshot opcional
        print("\n📸 Generando screenshot de ejemplo...")
        create_screenshot()
        
        print("\n" + "=" * 60)
        print("✅ TODO LISTO PARA PUBLICAR TU PWA")
        print("=" * 60 + "\n")
        
    except ImportError:
        print("❌ Error: Necesitas instalar Pillow")
        print("Ejecuta: pip install Pillow")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)