#!/usr/bin/env python3
"""
Script para generar iconos de diferentes tamaños para la app
Requiere: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Tamaños de iconos necesarios para Android
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_icon(size):
    """Crea un icono con el tamaño especificado"""
    
    # Crear imagen con gradiente
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Dibujar fondo con gradiente (simulado)
    for i in range(size):
        # Gradiente naranja a amarillo
        r = int(255 - (i / size) * 8)
        g = int(107 + (i / size) * 114)
        b = int(53 - (i / size) * 23)
        draw.rectangle([(0, i), (size, i+1)], fill=(r, g, b))
    
    # Dibujar círculo blanco en el centro
    circle_size = int(size * 0.7)
    margin = (size - circle_size) // 2
    draw.ellipse(
        [(margin, margin), (size - margin, size - margin)],
        fill='white',
        outline=(255, 107, 53),
        width=int(size * 0.03)
    )
    
    # Dibujar icono de cámara simplificado
    camera_size = int(size * 0.4)
    camera_x = (size - camera_size) // 2
    camera_y = (size - camera_size) // 2
    
    # Cuerpo de cámara
    draw.rounded_rectangle(
        [(camera_x, camera_y + camera_size//4), 
         (camera_x + camera_size, camera_y + camera_size)],
        radius=int(camera_size * 0.1),
        fill=(255, 107, 53)
    )
    
    # Lente
    lens_size = int(camera_size * 0.35)
    lens_x = camera_x + (camera_size - lens_size) // 2
    lens_y = camera_y + camera_size // 2
    draw.ellipse(
        [(lens_x, lens_y), (lens_x + lens_size, lens_y + lens_size)],
        fill='white',
        outline=(255, 107, 53),
        width=int(size * 0.02)
    )
    
    # Flash
    flash_size = int(camera_size * 0.15)
    flash_x = camera_x + int(camera_size * 0.75)
    flash_y = camera_y + int(camera_size * 0.35)
    draw.ellipse(
        [(flash_x, flash_y), (flash_x + flash_size, flash_y + flash_size)],
        fill=(247, 193, 30)
    )
    
    return img

def generate_all_icons():
    """Genera todos los iconos necesarios"""
    
    print("🎨 Generando iconos para la app...")
    
    for size in ICON_SIZES:
        icon = create_icon(size)
        filename = f'icon-{size}.png'
        icon.save(filename, 'PNG')
        print(f"✅ Generado: {filename}")
    
    print("\n✨ ¡Todos los iconos generados exitosamente!")
    print(f"📁 Archivos creados: {len(ICON_SIZES)} iconos")
    print("\n📋 Próximos pasos:")
    print("1. Sube estos archivos junto con tu app")
    print("2. Usa PWABuilder.com para generar el APK")

if __name__ == '__main__':
    try:
        generate_all_icons()
    except ImportError:
        print("❌ Error: Necesitas instalar Pillow")
        print("Ejecuta: pip install Pillow")
    except Exception as e:
        print(f"❌ Error: {e}")
