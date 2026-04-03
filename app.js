/* ============================================================
   BlogForge AI — Main Application Controller
   Navigation, state management, event handlers, and UI rendering
   ============================================================ */

(function () {
    'use strict';

    // ========== APPLICATION STATE ==========

    const state = {
        keywords: [],
        clusters: [],
        serpResults: [],
        generatedBlogs: [],
        currentBlog: null,
        activeSection: 'dashboard',
        isGenerating: false,
        batchQueue: [],
        stats: {
            blogsGenerated: 0,
            avgSEO: 0,
            keywordsTracked: 0,
            estTraffic: 0,
            totalGenTime: 0
        }
    };

    // Load state from localStorage
    function loadState() {
        try {
            const saved = localStorage.getItem('blogforge_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(state, parsed);
            }
        } catch (e) {
            console.warn('Could not load saved state:', e);
        }
    }

    function saveState() {
        try {
            const data = JSON.stringify({
                keywords: state.keywords,
                generatedBlogs: state.generatedBlogs,
                stats: state.stats
            });
            // Guard: prevent localStorage quota overflow (max ~500KB)
            if (data.length > 500000 && state.generatedBlogs.length > 5) {
                // Prune oldest blogs to fit
                const prunedBlogs = state.generatedBlogs.slice(-20);
                const pruned = JSON.stringify({
                    keywords: state.keywords,
                    generatedBlogs: prunedBlogs,
                    stats: state.stats
                });
                localStorage.setItem('blogforge_state', pruned);
                console.warn('BlogForge: Pruned old blogs to stay within storage limits');
            } else {
                localStorage.setItem('blogforge_state', data);
            }
        } catch (e) {
            console.warn('Could not save state:', e);
            if (e.name === 'QuotaExceededError') {
                showToast('Storage full — oldest blogs pruned automatically', 'warning');
                state.generatedBlogs = state.generatedBlogs.slice(-10);
                try {
                    localStorage.setItem('blogforge_state', JSON.stringify({
                        keywords: state.keywords,
                        generatedBlogs: state.generatedBlogs,
                        stats: state.stats
                    }));
                } catch (e2) { /* give up */ }
            }
        }
    }

    // ========== NAVIGATION ==========

    function initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const section = link.dataset.section;
                navigateTo(section);
            });
        });
    }

    function navigateTo(section) {
        state.activeSection = section;

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('section' + capitalize(section))?.classList.add('active');

        // Section-specific init
        if (section === 'dashboard') refreshDashboard();
        if (section === 'analytics') refreshAnalytics();
    }

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // ========== DASHBOARD ==========

    function refreshDashboard() {
        // Update stats
        Analytics.animateCounter('valBlogsGenerated', state.stats.blogsGenerated);
        Analytics.animateCounter('valAvgSEO', Math.round(state.stats.avgSEO), '%');
        Analytics.animateCounter('valKeywords', state.keywords.length);
        Analytics.animateCounter('valTraffic', state.stats.estTraffic);

        // Update dynamic trends (real values from state)
        updateDynamicTrends();

        // Update pipeline visual
        updatePipelineVisual();

        // Update recent list
        renderRecentList();

        // Update metric rings
        updateDashboardMetrics();
    }

    function updateDynamicTrends() {
        const t1 = document.getElementById('trendBlogsGenerated');
        const t2 = document.getElementById('trendAvgSEO');
        const t3 = document.getElementById('trendKeywords');
        const t4 = document.getElementById('trendTraffic');

        if (state.stats.blogsGenerated > 0) {
            t1.textContent = '+' + state.stats.blogsGenerated;
            t1.className = 'stat-trend stat-trend-up';
        } else {
            t1.textContent = '\u2014';
            t1.className = 'stat-trend';
        }

        if (state.stats.avgSEO > 0) {
            t2.textContent = state.stats.avgSEO + '%';
            t2.className = 'stat-trend ' + (state.stats.avgSEO >= 60 ? 'stat-trend-up' : 'stat-trend-down');
        } else {
            t2.textContent = '\u2014';
            t2.className = 'stat-trend';
        }

        if (state.keywords.length > 0) {
            t3.textContent = '+' + state.keywords.length;
            t3.className = 'stat-trend stat-trend-up';
        } else {
            t3.textContent = '\u2014';
            t3.className = 'stat-trend';
        }

        if (state.stats.estTraffic > 0) {
            t4.textContent = '+' + Analytics.formatNumber(state.stats.estTraffic);
            t4.className = 'stat-trend stat-trend-up';
        } else {
            t4.textContent = '\u2014';
            t4.className = 'stat-trend';
        }
    }

    function updatePipelineVisual() {
        const steps = document.querySelectorAll('#pipelineVisual .pipe-step');
        if (!state.currentBlog) {
            steps.forEach((s, i) => {
                s.className = 'pipe-step';
                if (i === 0 && state.keywords.length > 0) s.classList.add('completed');
            });
            return;
        }

        steps.forEach((s, i) => {
            s.className = 'pipe-step completed';
        });
    }

    function renderRecentList() {
        const container = document.getElementById('recentList');
        if (state.generatedBlogs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
                        <rect x="8" y="8" width="48" height="48" rx="8" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                        <path d="M24 32h16M32 24v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
                    </svg>
                    <p>No blogs generated yet</p>
                    <span>Start by adding keywords</span>
                </div>`;
            return;
        }

        container.innerHTML = state.generatedBlogs.slice(-5).reverse().map(blog => {
            const scoreClass = blog.seoScore.overall >= 80 ? 'score-high' :
                              blog.seoScore.overall >= 60 ? 'score-mid' : 'score-low';
            return `
                <div class="recent-item" data-blog-id="${blog.id}">
                    <div class="recent-item-info">
                        <span class="recent-item-title">${escapeHtml(blog.title)}</span>
                        <span class="recent-item-meta">${blog.wordCount} words · ${new Date(blog.generatedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="recent-item-score">
                        <span class="score-badge ${scoreClass}">${blog.seoScore.overall}%</span>
                    </div>
                </div>`;
        }).join('');

        // Click to view
        container.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const blogId = item.dataset.blogId;
                const blog = state.generatedBlogs.find(b => b.id === blogId);
                if (blog) {
                    state.currentBlog = blog;
                    navigateTo('generator');
                    renderBlogOutput(blog);
                    renderSEOScorecard(blog.seoScore);
                }
            });
        });
    }

    function updateDashboardMetrics() {
        const rings = document.querySelectorAll('.metric-ring');
        if (!state.currentBlog) {
            rings.forEach(ring => Analytics.animateMetricRing(ring, 0));
            return;
        }

        const seo = state.currentBlog.seoScore;
        const ai = state.currentBlog.aiDetection;
        const values = [
            seo.overall,
            seo.readability.score,
            ai.naturalness,
            seo.snippetReadiness.score,
            Math.min(100, Math.round(parseFloat(seo.keywordDensity.value) * 50)),
            seo.internalLinks.score
        ];

        rings.forEach((ring, i) => {
            setTimeout(() => Analytics.animateMetricRing(ring, values[i] || 0), i * 100);
        });
    }

    // ========== KEYWORDS SECTION ==========

    function initKeywords() {
        // Add keyword
        document.getElementById('btnAddKeyword').addEventListener('click', addKeyword);
        document.getElementById('keywordInput').addEventListener('keypress', e => {
            if (e.key === 'Enter') addKeyword();
        });

        // Bulk toggle
        document.getElementById('btnBulkToggle').addEventListener('click', () => {
            document.getElementById('bulkInputArea').classList.toggle('hidden');
        });

        // Bulk add
        document.getElementById('btnBulkAdd').addEventListener('click', bulkAddKeywords);

        // Filter
        document.getElementById('keywordFilter').addEventListener('change', renderKeywordTable);

        // Select all
        document.getElementById('selectAllKeywords').addEventListener('change', (e) => {
            state.keywords.forEach(kw => kw.selected = e.target.checked);
            renderKeywordTable();
        });

        // Auto-cluster
        document.getElementById('btnClusterAll').addEventListener('click', runClustering);

        // SERP analysis
        document.getElementById('btnRunSERPAnalysis').addEventListener('click', runSERPAnalysis);
    }

    function addKeyword() {
        const input = document.getElementById('keywordInput');
        const value = input.value.trim();
        if (!value) return;

        // Check duplicate
        if (state.keywords.some(kw => kw.keyword.toLowerCase() === value.toLowerCase())) {
            showToast('Keyword already exists', 'error');
            return;
        }

        const analyzed = BlogEngine.analyzeKeyword(value);
        state.keywords.push(analyzed);
        input.value = '';

        renderKeywordTable();
        renderClusters();
        updateStats();
        saveState();
        showToast(`Keyword "${value}" added`, 'success');
    }

    function bulkAddKeywords() {
        const textarea = document.getElementById('bulkKeywords');
        const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length === 0) {
            showToast('No keywords to import', 'error');
            return;
        }

        let added = 0;
        lines.forEach(line => {
            if (!state.keywords.some(kw => kw.keyword.toLowerCase() === line.toLowerCase())) {
                state.keywords.push(BlogEngine.analyzeKeyword(line));
                added++;
            }
        });

        textarea.value = '';
        document.getElementById('bulkInputArea').classList.add('hidden');
        
        renderKeywordTable();
        renderClusters();
        updateStats();
        saveState();
        showToast(`${added} keywords imported`, 'success');
    }

    function renderKeywordTable() {
        const filter = document.getElementById('keywordFilter').value;
        const filtered = filter === 'all' ? state.keywords : state.keywords.filter(kw => kw.intent === filter);
        
        const tbody = document.getElementById('keywordTableBody');
        const empty = document.getElementById('keywordsEmpty');

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');
        tbody.innerHTML = filtered.map(kw => {
            const diffColor = kw.difficulty > 70 ? '#ef4444' : kw.difficulty > 40 ? '#f59e0b' : '#10b981';
            const clusterColor = kw.cluster ? (state.clusters.find(c => c.id === kw.cluster)?.color || '#6366f1') : '#64748b';
            const clusterName = kw.cluster ? (state.clusters.find(c => c.id === kw.cluster)?.name || 'Unclustered') : '—';

            return `
                <tr>
                    <td><input type="checkbox" ${kw.selected ? 'checked' : ''} data-kw-id="${kw.id}" class="kw-checkbox"></td>
                    <td><strong>${escapeHtml(kw.keyword)}</strong></td>
                    <td><span class="intent-badge intent-${kw.intent}">${kw.intent}</span></td>
                    <td>${Analytics.formatNumber(kw.volume)}</td>
                    <td>
                        <div class="difficulty-bar">
                            <div class="difficulty-track">
                                <div class="difficulty-fill" style="width: ${kw.difficulty}%; background: ${diffColor};"></div>
                            </div>
                            <span class="difficulty-val">${kw.difficulty}</span>
                        </div>
                    </td>
                    <td><span class="cluster-badge" style="border-color: ${clusterColor}; color: ${clusterColor}">${escapeHtml(clusterName)}</span></td>
                    <td>
                        <div class="kw-actions">
                            <button class="kw-action-btn" title="Use in Generator" data-action="generate" data-kw="${escapeHtml(kw.keyword)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></button>
                             <button class="kw-action-btn delete" title="Remove" data-action="delete" data-kw-id="${kw.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        // Event listeners
        tbody.querySelectorAll('.kw-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const kw = state.keywords.find(k => k.id === e.target.dataset.kwId);
                if (kw) kw.selected = e.target.checked;
            });
        });

        tbody.querySelectorAll('.kw-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                if (action === 'delete') {
                    const id = btn.dataset.kwId;
                    state.keywords = state.keywords.filter(k => k.id !== id);
                    renderKeywordTable();
                    renderClusters();
                    updateStats();
                    saveState();
                    showToast('Keyword removed', 'info');
                } else if (action === 'generate') {
                    document.getElementById('genPrimaryKeyword').value = btn.dataset.kw;
                    navigateTo('generator');
                }
            });
        });
    }

    function runClustering() {
        if (state.keywords.length < 2) {
            showToast('Need at least 2 keywords to cluster', 'error');
            return;
        }

        state.clusters = BlogEngine.clusterKeywords(state.keywords);
        
        // Assign cluster IDs to keywords
        state.clusters.forEach(cluster => {
            cluster.keywords.forEach(ckw => {
                const kw = state.keywords.find(k => k.id === ckw.id);
                if (kw) kw.cluster = cluster.id;
            });
        });

        renderKeywordTable();
        renderClusters();
        saveState();
        showToast(`${state.clusters.length} clusters identified`, 'success');
    }

    function renderClusters() {
        const container = document.getElementById('clustersView');

        if (state.clusters.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <p>Clusters will appear after analysis</p>
                </div>`;
            return;
        }

        container.innerHTML = state.clusters.map(cluster => `
            <div class="cluster-group" style="border-left-color: ${cluster.color};">
                <div class="cluster-name" style="color: ${cluster.color};">${escapeHtml(cluster.name)} (${cluster.keywords.length})</div>
                <div class="cluster-keywords">
                    ${cluster.keywords.map(kw => `<span class="cluster-kw">${escapeHtml(kw.keyword)}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    function runSERPAnalysis() {
        const selected = state.keywords.filter(kw => kw.selected);
        const toAnalyze = selected.length > 0 ? selected : state.keywords.slice(0, 5);

        if (toAnalyze.length === 0) {
            showToast('Add keywords first', 'error');
            return;
        }

        state.serpResults = toAnalyze.map(kw => BlogEngine.analyzeSERPGaps(kw.keyword));
        renderSERPResults();
        showToast(`SERP analysis complete for ${toAnalyze.length} keywords`, 'success');
    }

    function renderSERPResults() {
        const container = document.getElementById('serpResults');

        if (state.serpResults.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Select keywords and run SERP analysis to identify content gaps</p>
                </div>`;
            return;
        }

        container.innerHTML = state.serpResults.map(result => `
            <div class="serp-card">
                <div class="serp-card-header">
                    <span class="serp-keyword">${escapeHtml(result.keyword)}</span>
                    <span class="serp-opportunity opp-${result.opportunity}">${result.opportunity.toUpperCase()} Opportunity</span>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                    <span class="intent-badge intent-${result.intent}">${result.intent}</span>
                    <span class="meta-tag" style="font-size: 0.72rem; padding: 2px 8px; background: rgba(99,102,241,0.1); border-radius: 999px; color: #94a3b8;">Snippet: ${result.snippetOpportunity}</span>
                </div>
                <div class="serp-gaps">
                    <strong style="font-size: 0.8rem; color: #f8fafc;">Content Gaps Identified:</strong>
                    ${result.gaps.map(gap => `
                        <div class="serp-gap-item">
                            <span class="serp-gap-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="#F97316" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg></span>
                            <span>${escapeHtml(gap)}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 12px;">
                    <strong style="font-size: 0.8rem; color: #f8fafc;">People Also Ask:</strong>
                    <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
                        ${result.paaQuestions.map(q => `
                             <span style="font-size: 0.8rem; color: #64748b; padding-left: 12px; display: flex; align-items: center; gap: 4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>${escapeHtml(q)}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ========== PIPELINE SECTION ==========

    function initPipeline() {
        // Temperature sliders
        document.querySelectorAll('.range').forEach(range => {
            range.addEventListener('input', (e) => {
                const val = (e.target.value / 100).toFixed(2);
                e.target.nextElementSibling.textContent = val;
            });
        });
    }

    // ========== GENERATOR SECTION ==========

    function initGenerator() {
        document.getElementById('btnGenerate').addEventListener('click', startGeneration);
        document.getElementById('btnCopyContent').addEventListener('click', copyContent);
        document.getElementById('btnExportHTML').addEventListener('click', exportHTML);
        document.getElementById('btnExportMD').addEventListener('click', exportMarkdown);
    }

    async function startGeneration() {
        const primaryKeyword = document.getElementById('genPrimaryKeyword').value.trim();
        if (!primaryKeyword) {
            showToast('Please enter a primary keyword', 'error');
            return;
        }

        if (state.isGenerating) return;
        state.isGenerating = true;

        // Disable generate button with loading state
        const genBtn = document.getElementById('btnGenerate');
        genBtn.disabled = true;
        genBtn.innerHTML = `<svg class="spin" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="40" stroke-dashoffset="10" opacity="0.5"/></svg> Generating...`;

        try {
            const config = {
                primaryKeyword,
                secondaryKeywords: document.getElementById('genSecondaryKeywords').value.split(',').map(s => s.trim()).filter(s => s),
                niche: document.getElementById('genNiche').value.trim() || 'general',
                geo: document.getElementById('genGeo').value,
                wordCount: parseInt(document.getElementById('genWordCount').value),
                tone: document.getElementById('genTone').value,
                cta: document.getElementById('genCTA').value.trim(),
                internalPages: document.getElementById('genInternalPages').value.split('\n').map(s => s.trim()).filter(s => s),
                includeSchema: document.getElementById('genSchemaMarkup').checked,
                includeFAQ: document.getElementById('genFAQ').checked,
                snippetOptimize: document.getElementById('genSnippetOptimize').checked,
                humanize: document.getElementById('genHumanize').checked
            };

            // Show progress
            const progress = document.getElementById('generationProgress');
            progress.classList.remove('hidden');
            document.getElementById('outputContent').innerHTML = '';
            document.getElementById('seoScorecard').classList.add('hidden');

            const steps = [
                'Analyzing keyword intent...',
                'Generating titles & meta...',
                'Building content outline...',
                'Generating section content...',
                'Adding CTAs & internal links...',
                'Running SEO optimization pass...'
            ];

            const pSteps = document.querySelectorAll('#progressSteps .p-step');

            // Simulate pipeline steps
            for (let i = 0; i < steps.length; i++) {
                document.getElementById('progressLabel').textContent = steps[i];
                document.getElementById('progressPercent').textContent = Math.round(((i + 1) / steps.length) * 100) + '%';
                document.getElementById('progressFill').style.width = ((i + 1) / steps.length * 100) + '%';
                
                pSteps.forEach((s, j) => {
                    s.className = 'p-step';
                    if (j < i) s.classList.add('completed');
                    if (j === i) s.classList.add('active');
                });

                await delay(600 + Math.random() * 400);
            }

            // Generate blog
            const startTime = performance.now();
            const blog = BlogEngine.generateBlog(config);
            const genTime = ((performance.now() - startTime) / 1000).toFixed(1);

            // Store
            state.currentBlog = blog;
            state.generatedBlogs.push(blog);
            state.stats.blogsGenerated++;
            state.stats.estTraffic += blog.traffic.monthlyTraffic;
            state.stats.totalGenTime += parseFloat(genTime);

            // Recalculate avg SEO
            const allScores = state.generatedBlogs.map(b => b.seoScore.overall);
            state.stats.avgSEO = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

            // Complete progress
            pSteps.forEach(s => { s.className = 'p-step completed'; });
            document.getElementById('progressLabel').textContent = `Generation complete (${genTime}s)`;
            document.getElementById('progressPercent').textContent = '100%';
            document.getElementById('progressFill').style.width = '100%';

            await delay(500);
            progress.classList.add('hidden');

            // Render output
            renderBlogOutput(blog);
            renderSEOScorecard(blog.seoScore);

            // Enable export buttons
            document.getElementById('btnCopyContent').disabled = false;
            document.getElementById('btnExportHTML').disabled = false;
            document.getElementById('btnExportMD').disabled = false;

            saveState();
            showToast('Blog generated successfully!', 'success');
        } catch (err) {
            console.error('Generation failed:', err);
            showToast('Generation failed: ' + err.message, 'error');
            document.getElementById('generationProgress').classList.add('hidden');
        } finally {
            // Always re-enable button and reset state
            state.isGenerating = false;
            genBtn.disabled = false;
            genBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg> Generate Blog`;
        }
    }

    function renderBlogOutput(blog) {
        const container = document.getElementById('outputContent');
        
        let html = `<div class="blog-output">`;
        
        // Title
        html += `<h1>${escapeHtml(blog.title)}</h1>`;
        
        // Meta info
        html += `<div class="meta-info">
            <span class="meta-tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>${blog.wordCount} words</span>
            <span class="meta-tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>${blog.config.primaryKeyword}</span>
            <span class="meta-tag">${blog.config.geo.toUpperCase()}</span>
            <span class="meta-tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>SEO: ${blog.seoScore.overall}%</span>
        </div>`;

        // Meta description
        html += `<blockquote><strong>Meta Description:</strong> ${escapeHtml(blog.meta.description)}</blockquote>`;

        // Sections
        blog.sections.forEach(section => {
            html += `<h2>${escapeHtml(section.h2)}</h2>`;
            
            section.paragraphs.forEach(p => {
                html += `<p>${escapeHtml(p)}</p>`;
            });

            section.h3s.forEach(h3 => {
                html += `<h3>${escapeHtml(h3.heading)}</h3>`;
                html += `<p>${escapeHtml(h3.text)}</p>`;
                
                if (h3.list) {
                    html += `<ul>${h3.list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
                }
            });

            if (section.closer) {
                html += `<p><em>${escapeHtml(section.closer)}</em></p>`;
            }

            // CTA block
            if (section.cta) {
                html += `<div class="cta-block">
                    <p>${escapeHtml(section.cta.text)}</p>
                    <button class="btn btn-primary" style="margin-top: 8px; pointer-events: none;">${escapeHtml(section.cta.button)}</button>
                </div>`;
            }

            // Internal link
            if (section.internalLink) {
                html += `<p><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><a class="internal-link" href="${escapeHtml(section.internalLink.url)}" target="_blank">Read our ${escapeHtml(section.internalLink.anchor)}</a></p>`;
            }
        });

        // FAQ
        if (blog.faq) {
            html += `<div class="faq-section">
                <h2>Frequently Asked Questions</h2>
                ${blog.faq.map(f => `
                    <div class="faq-item">
                        <div class="faq-q"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>${escapeHtml(f.q)}</div>
                        <div class="faq-a">${escapeHtml(f.a)}</div>
                    </div>
                `).join('')}
            </div>`;
        }

        // Schema
        if (blog.schema) {
            html += `<div class="schema-block">
                <strong><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>Schema Markup (JSON-LD)</strong>
                <pre>${escapeHtml(JSON.stringify(blog.schema, null, 2))}</pre>
            </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    function renderSEOScorecard(seo) {
        const scorecard = document.getElementById('seoScorecard');
        scorecard.classList.remove('hidden');

        const grid = document.getElementById('scorecardGrid');
        const items = [
            { label: 'Overall SEO Score', value: seo.overall + '%', status: seo.overall >= 70 ? 'pass' : 'warn' },
            { label: 'Keyword Density', value: seo.keywordDensity.value + '%', status: seo.keywordDensity.status },
            { label: 'Readability (Flesch)', value: seo.readability.fleschScore, status: seo.readability.status },
            { label: 'Header Optimization', value: seo.headerOptimization.score + '%', status: seo.headerOptimization.status },
            { label: 'Internal Links', value: seo.internalLinks.count + ' links', status: seo.internalLinks.status },
            { label: 'Snippet Readiness', value: seo.snippetReadiness.score + '%', status: seo.snippetReadiness.status },
            { label: 'Content Length', value: seo.contentLength.wordCount + ' words', status: seo.contentLength.status },
            { label: 'Meta Optimization', value: seo.metaOptimization.score + '%', status: seo.metaOptimization.status },
            { label: 'Avg Words/Sentence', value: seo.readability.avgWordsPerSentence, status: seo.readability.avgWordsPerSentence <= 25 ? 'pass' : 'warn' },
            { label: 'Primary KW Count', value: seo.keywordDensity.count + ' uses', status: seo.keywordDensity.status }
        ];

        grid.innerHTML = items.map(item => `
            <div class="scorecard-item">
                <span class="scorecard-label">${item.label}</span>
                <span class="scorecard-value scorecard-${item.status}">${item.value}</span>
            </div>
        `).join('');
    }

    // ========== EXPORT FUNCTIONS ==========

    function copyContent() {
        if (!state.currentBlog) return;
        
        const text = generatePlainText(state.currentBlog);
        navigator.clipboard.writeText(text).then(() => {
            showToast('Content copied to clipboard', 'success');
        }).catch(() => {
            showToast('Could not copy to clipboard', 'error');
        });
    }

    function exportHTML() {
        if (!state.currentBlog) return;
        const blog = state.currentBlog;

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(blog.meta.title)}</title>
    <meta name="description" content="${escapeHtml(blog.meta.description)}">
    <link rel="canonical" href="${escapeHtml(blog.meta.canonical)}">
    <meta property="og:title" content="${escapeHtml(blog.meta.ogTitle)}">
    <meta property="og:description" content="${escapeHtml(blog.meta.ogDescription)}">
    ${blog.schema ? `<script type="application/ld+json">${JSON.stringify(blog.schema.article)}</script>` : ''}
    ${blog.schema?.faq ? `<script type="application/ld+json">${JSON.stringify(blog.schema.faq)}</script>` : ''}
</head>
<body>
    <article>
        <h1>${escapeHtml(blog.title)}</h1>
`;
        blog.sections.forEach(section => {
            html += `        <h2>${escapeHtml(section.h2)}</h2>\n`;
            section.paragraphs.forEach(p => html += `        <p>${escapeHtml(p)}</p>\n`);
            section.h3s.forEach(h3 => {
                html += `        <h3>${escapeHtml(h3.heading)}</h3>\n`;
                html += `        <p>${escapeHtml(h3.text)}</p>\n`;
                if (h3.list) {
                    html += `        <ul>\n${h3.list.map(i => `            <li>${escapeHtml(i)}</li>`).join('\n')}\n        </ul>\n`;
                }
            });
        });

        if (blog.faq) {
            html += `        <section>\n            <h2>FAQ</h2>\n`;
            blog.faq.forEach(f => {
                html += `            <h3>${escapeHtml(f.q)}</h3>\n            <p>${escapeHtml(f.a)}</p>\n`;
            });
            html += `        </section>\n`;
        }

        html += `    </article>\n</body>\n</html>`;

        downloadFile(html, `${blog.meta.slug}.html`, 'text/html');
        showToast('HTML exported', 'success');
    }

    function exportMarkdown() {
        if (!state.currentBlog) return;
        const blog = state.currentBlog;

        let md = `# ${blog.title}\n\n`;
        md += `> **Meta Description:** ${blog.meta.description}\n\n`;
        md += `**Keywords:** ${blog.config.primaryKeyword}`;
        if (blog.config.secondaryKeywords.length > 0) {
            md += `, ${blog.config.secondaryKeywords.join(', ')}`;
        }
        md += `\n\n---\n\n`;

        blog.sections.forEach(section => {
            md += `## ${section.h2}\n\n`;
            section.paragraphs.forEach(p => md += `${p}\n\n`);
            section.h3s.forEach(h3 => {
                md += `### ${h3.heading}\n\n`;
                md += `${h3.text}\n\n`;
                if (h3.list) {
                    h3.list.forEach(item => md += `- ${item}\n`);
                    md += '\n';
                }
            });
        });

        if (blog.faq) {
            md += `## FAQ\n\n`;
            blog.faq.forEach(f => {
                md += `### ${f.q}\n\n${f.a}\n\n`;
            });
        }

        downloadFile(md, `${blog.meta.slug}.md`, 'text/markdown');
        showToast('Markdown exported', 'success');
    }

    function generatePlainText(blog) {
        let text = blog.title + '\n\n';
        blog.sections.forEach(section => {
            text += section.h2 + '\n\n';
            section.paragraphs.forEach(p => text += p + '\n\n');
            section.h3s.forEach(h3 => {
                text += h3.heading + '\n\n';
                text += h3.text + '\n\n';
                if (h3.list) {
                    h3.list.forEach(item => text += '• ' + item + '\n');
                    text += '\n';
                }
            });
        });
        if (blog.faq) {
            text += 'FAQ\n\n';
            blog.faq.forEach(f => text += 'Q: ' + f.q + '\nA: ' + f.a + '\n\n');
        }
        return text;
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ========== ANALYTICS SECTION ==========

    function refreshAnalytics() {
        if (!state.currentBlog) {
            Analytics.drawTrafficChart('trafficCanvas', [], []);
            // Show helpful prompt
            const qualityBars = document.getElementById('qualityBars');
            if (qualityBars && !qualityBars.querySelector('.empty-state-inline')) {
                const notice = document.createElement('div');
                notice.className = 'empty-state-inline';
                notice.innerHTML = '<p style="text-align:center;color:#64748b;padding:16px;font-size:0.85rem;">Generate your first blog to see analytics data here</p>';
                qualityBars.prepend(notice);
            }
            return;
        }

        // Remove any inline empty state
        document.querySelectorAll('.empty-state-inline').forEach(el => el.remove());

        const blog = state.currentBlog;
        const seo = blog.seoScore;
        const ai = blog.aiDetection;

        // Quality bars
        Analytics.animateQualityBars('qualityBars', [
            seo.overall,
            seo.readability.score,
            ai.naturalness,
            seo.snippetReadiness.score,
            seo.internalLinks.score,
            seo.headerOptimization.score
        ]);

        // Traffic chart
        Analytics.drawTrafficChart('trafficCanvas', blog.traffic.projection);

        // Traffic stats
        Analytics.animateCounter('estMonthly', blog.traffic.monthlyTraffic);
        document.getElementById('estCTR').textContent = blog.traffic.ctr + '%';
        document.getElementById('estPosition').textContent = '#' + blog.traffic.estPosition;

        // AI Detection gauge
        Analytics.animateGauge('gaugeArc', ai.aiDetectionProbability);
        document.getElementById('gaugeValue').textContent = ai.aiDetectionProbability + '%';

        // Detection metrics
        document.getElementById('detPerplexity').textContent = ai.perplexity;
        document.getElementById('detBurstiness').textContent = ai.burstiness;
        document.getElementById('detVocab').textContent = ai.vocabDiversity + '%';
        document.getElementById('detSentence').textContent = ai.sentenceVariation + '%';

        // Scalability metrics
        const avgTime = state.stats.blogsGenerated > 0 ? 
            (state.stats.totalGenTime / state.stats.blogsGenerated).toFixed(1) : '0';
        document.getElementById('scaleBlogs').textContent = Math.round(3600 / Math.max(parseFloat(avgTime), 0.5));
        document.getElementById('scaleConsistency').textContent = 
            state.generatedBlogs.length > 1 ? calculateConsistency() + '%' : '—';
        document.getElementById('scaleKeywords').textContent = state.keywords.length;
        document.getElementById('scaleAvgTime').textContent = avgTime + 's';

        // History
        renderHistory();
    }

    function calculateConsistency() {
        if (state.generatedBlogs.length < 2) return 100;
        const scores = state.generatedBlogs.map(b => b.seoScore.overall);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        return Math.max(60, Math.round(100 - stdDev * 2));
    }

    function renderHistory() {
        const container = document.getElementById('historyList');

        if (state.generatedBlogs.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No generation history yet</p></div>';
            return;
        }

        container.innerHTML = state.generatedBlogs.slice().reverse().map(blog => {
            const scoreClass = blog.seoScore.overall >= 80 ? 'score-high' :
                              blog.seoScore.overall >= 60 ? 'score-mid' : 'score-low';
            return `
                <div class="history-item" data-blog-id="${blog.id}">
                    <div class="history-info">
                        <span class="history-title">${escapeHtml(blog.title)}</span>
                        <span class="history-meta">${blog.wordCount} words · ${blog.config.primaryKeyword} · ${new Date(blog.generatedAt).toLocaleString()}</span>
                    </div>
                    <div class="history-scores">
                        <span class="score-badge ${scoreClass}">SEO ${blog.seoScore.overall}%</span>
                        <span class="score-badge score-high">AI ${blog.aiDetection.naturalness}%</span>
                    </div>
                </div>`;
        }).join('');

        container.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const blog = state.generatedBlogs.find(b => b.id === item.dataset.blogId);
                if (blog) {
                    state.currentBlog = blog;
                    navigateTo('generator');
                    renderBlogOutput(blog);
                    renderSEOScorecard(blog.seoScore);
                }
            });
        });
    }

    // ========== BATCH MODE ==========

    function initBatchMode() {
        document.getElementById('btnBatchMode').addEventListener('click', () => {
            document.getElementById('batchModal').classList.remove('hidden');
        });

        document.getElementById('btnCloseBatch').addEventListener('click', closeBatchModal);
        document.getElementById('btnCancelBatch').addEventListener('click', closeBatchModal);

        document.getElementById('batchKeywords').addEventListener('input', (e) => {
            const count = e.target.value.split('\n').filter(l => l.trim()).length;
            document.getElementById('batchPreview').querySelector('.batch-count').textContent = count + ' blogs queued';
        });

        document.getElementById('btnStartBatch').addEventListener('click', startBatchGeneration);
    }

    function closeBatchModal() {
        document.getElementById('batchModal').classList.add('hidden');
    }

    async function startBatchGeneration() {
        const keywords = document.getElementById('batchKeywords').value
            .split('\n').map(l => l.trim()).filter(l => l);
        
        if (keywords.length === 0) {
            showToast('No keywords to process', 'error');
            return;
        }

        // Apply batch-specific settings to the main form
        const batchWordCount = document.getElementById('batchWordCount').value;
        const batchTone = document.getElementById('batchTone').value;
        document.getElementById('genWordCount').value = batchWordCount;
        document.getElementById('genTone').value = batchTone;

        closeBatchModal();
        navigateTo('generator');

        for (let i = 0; i < keywords.length; i++) {
            document.getElementById('genPrimaryKeyword').value = keywords[i];
            showToast(`Generating blog ${i + 1}/${keywords.length}: "${keywords[i]}"`, 'info');
            
            await delay(300);
            await startGeneration();
            await delay(500);
        }

        showToast(`Batch complete! ${keywords.length} blogs generated.`, 'success');
    }

    // ========== MISC ==========

    function initExport() {
        document.getElementById('btnExport').addEventListener('click', () => {
            if (state.generatedBlogs.length === 0) {
                showToast('No blogs to export', 'error');
                return;
            }

            const data = {
                exportDate: new Date().toISOString(),
                totalBlogs: state.generatedBlogs.length,
                keywords: state.keywords,
                blogs: state.generatedBlogs,
                stats: state.stats
            };

            downloadFile(JSON.stringify(data, null, 2), 'blogforge-export.json', 'application/json');
            showToast('All data exported', 'success');
        });
    }

    function initQuickGenerate() {
        document.getElementById('btnQuickGenerate').addEventListener('click', () => {
            navigateTo('generator');
            document.getElementById('genPrimaryKeyword').focus();
        });

        document.getElementById('btnViewAll').addEventListener('click', () => {
            navigateTo('analytics');
        });

        document.getElementById('btnClearHistory').addEventListener('click', () => {
            if (confirm('Clear all generation history?')) {
                state.generatedBlogs = [];
                state.currentBlog = null;
                state.stats = { blogsGenerated: 0, avgSEO: 0, keywordsTracked: 0, estTraffic: 0, totalGenTime: 0 };
                saveState();
                refreshAnalytics();
                showToast('History cleared', 'info');
            }
        });
    }

    function updateStats() {
        state.stats.keywordsTracked = state.keywords.length;
    }

    // ========== UTILITIES ==========

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        
        // Limit max toasts to 5
        while (container.children.length >= 5) {
            container.removeChild(container.firstChild);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 3000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== INITIALIZATION ==========

    function init() {
        loadState();
        initNavigation();
        initKeywords();
        initPipeline();
        initGenerator();
        initBatchMode();
        initExport();
        initQuickGenerate();

        // Initial render
        renderKeywordTable();
        renderClusters();
        refreshDashboard();

        // Draw initial chart
        Analytics.drawTrafficChart('trafficCanvas', [], []);

        // Handle window resize for chart
        window.addEventListener('resize', () => {
            if (state.activeSection === 'analytics' && state.currentBlog) {
                Analytics.drawTrafficChart('trafficCanvas', state.currentBlog.traffic.projection);
            }
        });

        console.log('%cBlogForge AI Initialized', 'color: #F97316; font-size: 14px; font-weight: bold;');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
