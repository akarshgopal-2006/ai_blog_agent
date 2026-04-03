/* ============================================================
   BlogForge AI — Analytics & Visualization Module
   Charts, gauges, and metric visualizations
   ============================================================ */

const Analytics = (() => {
    
    // ========== TRAFFIC CHART ==========

    function drawTrafficChart(canvasId, data, labels) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual canvas size
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 200 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '200px';
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = 200;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#666666';
            ctx.font = '13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Generate content to see traffic projections', width / 2, height / 2);
            return;
        }

        const maxVal = Math.max(...data) * 1.2;
        const defaultLabels = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
        const chartLabels = labels || defaultLabels;

        // Draw grid lines
        ctx.strokeStyle = 'rgba(192, 192, 192, 0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH * i) / 4;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const val = Math.round(maxVal - (maxVal * i) / 4);
            ctx.fillStyle = '#666666';
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.textAlign = 'right';
            ctx.fillText(formatNumber(val), padding.left - 8, y + 4);
        }

        // Draw X-axis labels
        ctx.fillStyle = '#666666';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        data.forEach((_, i) => {
            const x = padding.left + (chartW * i) / (data.length - 1);
            ctx.fillText(chartLabels[i] || `M${i + 1}`, x, height - 10);
        });

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.01)');

        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        data.forEach((val, i) => {
            const x = padding.left + (chartW * i) / (data.length - 1);
            const y = padding.top + chartH - (val / maxVal) * chartH;
            if (i === 0) ctx.lineTo(x, y);
            else {
                const prevX = padding.left + (chartW * (i - 1)) / (data.length - 1);
                const prevY = padding.top + chartH - (data[i - 1] / maxVal) * chartH;
                const cpx = (prevX + x) / 2;
                ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
            }
        });
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        data.forEach((val, i) => {
            const x = padding.left + (chartW * i) / (data.length - 1);
            const y = padding.top + chartH - (val / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else {
                const prevX = padding.left + (chartW * (i - 1)) / (data.length - 1);
                const prevY = padding.top + chartH - (data[i - 1] / maxVal) * chartH;
                const cpx = (prevX + x) / 2;
                ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
            }
        });
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw dots
        data.forEach((val, i) => {
            const x = padding.left + (chartW * i) / (data.length - 1);
            const y = padding.top + chartH - (val / maxVal) * chartH;
            
            // Glow
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
            ctx.fill();
            
            // Dot
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#F97316';
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }

    // ========== GAUGE ANIMATION ==========

    function animateGauge(elementId, value) {
        const arc = document.getElementById(elementId);
        const valueEl = document.getElementById(elementId.replace('Arc', 'Value'));
        if (!arc) return;

        const maxOffset = 251.2; // Total arc length
        const targetOffset = maxOffset - (maxOffset * (value / 100));

        let currentVal = 0;
        const duration = 1500;
        const startTime = performance.now();

        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            currentVal = Math.round(value * eased);
            const currentOffset = maxOffset - (maxOffset * (currentVal / 100));

            arc.setAttribute('stroke-dashoffset', currentOffset);
            if (valueEl) valueEl.textContent = currentVal + '%';

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }

    // ========== METRIC RING ANIMATION ==========

    function animateMetricRing(ringElement, value) {
        const progress = ringElement.querySelector('.metric-progress');
        const valEl = ringElement.querySelector('.metric-val');
        if (!progress) return;

        const circumference = 213.6; // 2 * PI * 34
        const targetOffset = circumference - (circumference * (value / 100));

        let currentVal = 0;
        const duration = 1200;
        const startTime = performance.now();

        function animate(time) {
            const elapsed = time - startTime;
            const p = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(p);

            currentVal = Math.round(value * eased);
            const currentOffset = circumference - (circumference * (currentVal / 100));

            progress.setAttribute('stroke-dashoffset', currentOffset);
            if (valEl) valEl.textContent = currentVal + '%';

            if (p < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }

    // ========== QUALITY BARS ANIMATION ==========

    function animateQualityBars(containerId, values) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const rows = container.querySelectorAll('.quality-row');
        rows.forEach((row, i) => {
            if (i >= values.length) return;
            const fill = row.querySelector('.quality-bar-fill');
            const valueEl = row.querySelector('.quality-value');
            
            if (fill) {
                setTimeout(() => {
                    fill.style.setProperty('--width', values[i] + '%');
                    if (valueEl) valueEl.textContent = values[i] + '%';
                }, i * 100);
            }
        });
    }

    // ========== COUNTER ANIMATION ==========

    function animateCounter(elementId, targetValue, suffix = '') {
        const el = document.getElementById(elementId);
        if (!el) return;

        const duration = 1000;
        const startTime = performance.now();
        const startValue = parseInt(el.textContent) || 0;

        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            const current = Math.round(startValue + (targetValue - startValue) * eased);
            el.textContent = formatNumber(current) + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }

    // ========== HELPERS ==========

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // ========== PUBLIC API ==========

    return {
        drawTrafficChart,
        animateGauge,
        animateMetricRing,
        animateQualityBars,
        animateCounter,
        formatNumber,
        easeOutCubic
    };
})();
