const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Sizes needed for PWA icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate a simple colored square icon for each size
sizes.forEach(size => {
  // Create canvas with the desired dimensions
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = '#4DBA87'; // Vue green color
  ctx.fillRect(0, 0, size, size);

  // Draw a simple drone icon
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size / 20;
  
  // Body (circle)
  const centerX = size / 2;
  const centerY = size / 2;
  const bodyRadius = size / 5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, bodyRadius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Arms and propellers
  const armLength = size / 4;
  const propRadius = size / 10;
  
  // Top left arm and propeller
  ctx.beginPath();
  ctx.moveTo(centerX - bodyRadius * 0.7, centerY - bodyRadius * 0.7);
  ctx.lineTo(centerX - armLength, centerY - armLength);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX - armLength, centerY - armLength, propRadius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Top right arm and propeller
  ctx.beginPath();
  ctx.moveTo(centerX + bodyRadius * 0.7, centerY - bodyRadius * 0.7);
  ctx.lineTo(centerX + armLength, centerY - armLength);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX + armLength, centerY - armLength, propRadius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Bottom left arm and propeller
  ctx.beginPath();
  ctx.moveTo(centerX - bodyRadius * 0.7, centerY + bodyRadius * 0.7);
  ctx.lineTo(centerX - armLength, centerY + armLength);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX - armLength, centerY + armLength, propRadius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Bottom right arm and propeller
  ctx.beginPath();
  ctx.moveTo(centerX + bodyRadius * 0.7, centerY + bodyRadius * 0.7);
  ctx.lineTo(centerX + armLength, centerY + armLength);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX + armLength, centerY + armLength, propRadius, 0, 2 * Math.PI);
  ctx.stroke();

  // Save as PNG
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(iconPath, buffer);
  
  console.log(`Created icon: ${iconPath}`);
});

console.log('All icons generated successfully!'); 