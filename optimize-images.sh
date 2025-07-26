#!/bin/bash

# Comprehensive Image Optimization Script
# Converts images to WebP, creates responsive sizes, and compresses existing formats

set -e

echo "🖼️  Starting comprehensive image optimization..."

# Configuration
QUALITY_WEBP=80
QUALITY_JPG=85
MAX_WIDTH_DESKTOP=1200
MAX_WIDTH_TABLET=768
MAX_WIDTH_MOBILE=480
UPLOADS_DIR="./wp-content/uploads"

# Create backup directory
BACKUP_DIR="./image-backups-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Statistics counters
ORIGINAL_SIZE=0
OPTIMIZED_SIZE=0
FILES_PROCESSED=0
WEBP_CREATED=0

# Function to get file size in bytes
get_file_size() {
    if [[ -f "$1" ]]; then
        stat -c%s "$1" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

# Function to convert bytes to human readable format
human_readable_size() {
    local bytes=$1
    if [[ $bytes -gt 1073741824 ]]; then
        echo "$(( bytes / 1073741824 ))GB"
    elif [[ $bytes -gt 1048576 ]]; then
        echo "$(( bytes / 1048576 ))MB"
    elif [[ $bytes -gt 1024 ]]; then
        echo "$(( bytes / 1024 ))KB"
    else
        echo "${bytes}B"
    fi
}

# Function to optimize a single image
optimize_image() {
    local filepath="$1"
    local filename=$(basename "$filepath")
    local dir=$(dirname "$filepath")
    local extension="${filename##*.}"
    local name="${filename%.*}"
    
    echo "📸 Processing: $filename"
    
    # Backup original
    cp "$filepath" "$BACKUP_DIR/"
    
    # Get original size
    local original_size=$(get_file_size "$filepath")
    ORIGINAL_SIZE=$((ORIGINAL_SIZE + original_size))
    
    # Get image dimensions
    local dimensions=$(identify -format "%wx%h" "$filepath" 2>/dev/null || echo "0x0")
    local width=$(echo $dimensions | cut -d'x' -f1)
    local height=$(echo $dimensions | cut -d'x' -f2)
    
    echo "  📏 Original: ${width}x${height} ($(human_readable_size $original_size))"
    
    # Resize if too large
    if [[ $width -gt $MAX_WIDTH_DESKTOP ]]; then
        echo "  🔄 Resizing from ${width}px to ${MAX_WIDTH_DESKTOP}px width"
        convert "$filepath" -resize "${MAX_WIDTH_DESKTOP}x>" "$filepath"
    fi
    
    # Create responsive WebP versions
    local webp_base="$dir/$name"
    
    # Desktop WebP (1200px max)
    if [[ $width -gt 800 ]]; then
        cwebp -q $QUALITY_WEBP "$filepath" -resize $MAX_WIDTH_DESKTOP 0 -o "${webp_base}-desktop.webp" 2>/dev/null
        echo "  ✅ Created: ${name}-desktop.webp"
        WEBP_CREATED=$((WEBP_CREATED + 1))
    fi
    
    # Tablet WebP (768px max)
    if [[ $width -gt 600 ]]; then
        cwebp -q $QUALITY_WEBP "$filepath" -resize $MAX_WIDTH_TABLET 0 -o "${webp_base}-tablet.webp" 2>/dev/null
        echo "  ✅ Created: ${name}-tablet.webp"
        WEBP_CREATED=$((WEBP_CREATED + 1))
    fi
    
    # Mobile WebP (480px max)
    cwebp -q $QUALITY_WEBP "$filepath" -resize $MAX_WIDTH_MOBILE 0 -o "${webp_base}-mobile.webp" 2>/dev/null
    echo "  ✅ Created: ${name}-mobile.webp"
    WEBP_CREATED=$((WEBP_CREATED + 1))
    
    # Create main WebP version
    cwebp -q $QUALITY_WEBP "$filepath" -o "${webp_base}.webp" 2>/dev/null
    echo "  ✅ Created: ${name}.webp"
    WEBP_CREATED=$((WEBP_CREATED + 1))
    
    # Optimize original format
    case "${extension,,}" in
        jpg|jpeg)
            jpegoptim --size=200k --strip-all "$filepath" >/dev/null 2>&1
            echo "  🗜️  Compressed JPEG"
            ;;
        png)
            optipng -o2 -strip all "$filepath" >/dev/null 2>&1
            echo "  🗜️  Compressed PNG"
            ;;
    esac
    
    # Calculate savings
    local optimized_size=$(get_file_size "$filepath")
    OPTIMIZED_SIZE=$((OPTIMIZED_SIZE + optimized_size))
    local savings=$((original_size - optimized_size))
    local savings_percent=0
    
    if [[ $original_size -gt 0 ]]; then
        savings_percent=$(( (savings * 100) / original_size ))
    fi
    
    echo "  💾 Saved: $(human_readable_size $savings) (${savings_percent}%)"
    echo ""
    
    FILES_PROCESSED=$((FILES_PROCESSED + 1))
}

# Main optimization process
echo "🔍 Finding images in $UPLOADS_DIR..."

# Find and process all images
find "$UPLOADS_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
    optimize_image "$file"
done

# Generate final statistics
echo "📊 OPTIMIZATION COMPLETE!"
echo "================================"
echo "Files processed: $FILES_PROCESSED"
echo "WebP images created: $WEBP_CREATED"
echo "Original total size: $(human_readable_size $ORIGINAL_SIZE)"
echo "Optimized total size: $(human_readable_size $OPTIMIZED_SIZE)"

if [[ $ORIGINAL_SIZE -gt 0 ]]; then
    local total_savings=$((ORIGINAL_SIZE - OPTIMIZED_SIZE))
    local total_savings_percent=$(( (total_savings * 100) / ORIGINAL_SIZE ))
    echo "Total savings: $(human_readable_size $total_savings) (${total_savings_percent}%)"
fi

echo ""
echo "💾 Original images backed up to: $BACKUP_DIR"
echo "🎉 Image optimization complete!"

# Check final size
echo ""
echo "📊 Final image directory size:"
du -sh "$UPLOADS_DIR"