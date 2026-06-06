/* ============================================
   VendorBridge — Canvas Chart Library
   Simple, dependency-free charts for dashboard
   ============================================ */

const Charts = {
  /**
   * Draw a bar chart on a canvas element
   */
  drawBarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 55 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const { labels, datasets } = data;
    const allValues = datasets.flatMap(d => d.data);
    const maxVal = Math.ceil(Math.max(...allValues) / 5) * 5;
    const barGroupW = chartW / labels.length;
    const barW = Math.min(24, (barGroupW - 12) / datasets.length);
    const colors = ['#2563eb', '#0ea5e9', '#16a34a', '#d97706'];

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Y labels
      const val = (maxVal - (maxVal / 5) * i).toFixed(1);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, padding.left - 8, y + 4);
    }

    // Bars
    datasets.forEach((dataset, di) => {
      dataset.data.forEach((val, i) => {
        const barH = (val / maxVal) * chartH;
        const x = padding.left + barGroupW * i + (barGroupW - barW * datasets.length - 4 * (datasets.length - 1)) / 2 + di * (barW + 4);
        const y = padding.top + chartH - barH;

        // Gradient bar
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, colors[di]);
        grad.addColorStop(1, colors[di] + '88');
        ctx.fillStyle = grad;

        // Rounded top
        const r = Math.min(4, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
      });
    });

    // X labels
    labels.forEach((label, i) => {
      const x = padding.left + barGroupW * i + barGroupW / 2;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, h - padding.bottom + 20);
    });

    // Legend
    datasets.forEach((dataset, di) => {
      const x = padding.left + di * 140;
      ctx.fillStyle = colors[di];
      ctx.fillRect(x, 6, 12, 12);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(dataset.label, x + 18, 16);
    });
  },

  /**
   * Draw a donut chart on a canvas element
   */
  drawDonutChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w * 0.35;
    const cy = h / 2;
    const outerR = Math.min(cx, cy) - 10;
    const innerR = outerR * 0.62;
    const colors = ['#2563eb', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

    const total = data.data.reduce((s, v) => s + v, 0);
    let startAngle = -Math.PI / 2;

    data.data.forEach((val, i) => {
      const sliceAngle = (val / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      startAngle = endAngle;
    });

    // Center text
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total + '%', cx, cy + 3);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Total', cx, cy + 20);

    // Legend (right side)
    const legendX = w * 0.6;
    const legendStartY = 20;
    data.labels.forEach((label, i) => {
      const y = legendStartY + i * 30;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(legendX, y + 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, legendX + 14, y + 10);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(data.data[i] + '%', legendX + 14 + ctx.measureText(label).width + 8, y + 10);
    });
  },

  /**
   * Draw a sparkline mini chart
   */
  drawSparkline(canvasId, dataPoints, color = '#2563eb') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const range = max - min || 1;
    const pad = 2;

    ctx.beginPath();
    dataPoints.forEach((val, i) => {
      const x = pad + (i / (dataPoints.length - 1)) * (w - pad * 2);
      const y = pad + ((max - val) / range) * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill gradient under the line
    const lastX = pad + (w - pad * 2);
    ctx.lineTo(lastX, h);
    ctx.lineTo(pad, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.fill();
  }
};
