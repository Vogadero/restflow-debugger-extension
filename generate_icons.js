// 生成PNG图标的Node.js脚本
// 需要安装: npm install canvas

const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#007acc');
    gradient.addColorStop(1, '#005a9e');
    
    // 绘制圆形背景
    const center = size / 2;
    const radius = size * 0.45;
    
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制API网络图标
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = Math.max(1, size * 0.02);
    
    // 中心节点
    ctx.beginPath();
    ctx.arc(center, center, size * 0.06, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制连接线和节点
    const nodeRadius = size * 0.04;
    const lineLength = size * 0.25;
    
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = center + Math.cos(angle) * (size * 0.06);
        const y1 = center + Math.sin(angle) * (size * 0.06);
        const x2 = center + Math.cos(angle) * lineLength;
        const y2 = center + Math.sin(angle) * lineLength;
        
        // 绘制连接线
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // 绘制端点
        ctx.beginPath();
        ctx.arc(x2, y2, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 保存为PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icons/icon${size}.png`, buffer);
    console.log(`Generated icon${size}.png`);
}

// 生成所有尺寸的图标
[16, 48, 128].forEach(size => {
    generateIcon(size);
});

console.log('所有图标生成完成！');
