/* ============================================================
   BlogForge AI — Blog Generation & SEO Engine
   Core engine for keyword analysis, content generation, and SEO scoring
   ============================================================ */

const BlogEngine = (() => {
    // ========== KEYWORD INTELLIGENCE ==========
    
    const INTENT_PATTERNS = {
        transactional: [
            'buy', 'purchase', 'order', 'price', 'cost', 'cheap', 'affordable',
            'deal', 'discount', 'coupon', 'sale', 'shop', 'store', 'subscription',
            'pricing', 'free trial', 'download', 'get', 'sign up', 'register'
        ],
        commercial: [
            'best', 'top', 'review', 'compare', 'comparison', 'vs', 'versus',
            'alternative', 'alternatives', 'recommend', 'rated', 'ranking',
            'leading', 'popular', 'pros and cons', 'which', 'benchmark'
        ],
        navigational: [
            'login', 'sign in', 'website', 'official', 'homepage', 'portal',
            'dashboard', 'account', 'app', 'download', 'contact', 'support'
        ],
        informational: [
            'how', 'what', 'why', 'when', 'where', 'who', 'guide', 'tutorial',
            'learn', 'tips', 'tricks', 'examples', 'definition', 'meaning',
            'explain', 'introduction', 'basics', 'beginner', 'step by step',
            'ways to', 'ideas', 'strategies', 'methods', 'techniques'
        ]
    };

    const NICHE_TOPICS = {
        'technology': ['software', 'hardware', 'AI', 'cloud', 'automation', 'platform', 'tool', 'app'],
        'marketing': ['SEO', 'content', 'social media', 'email', 'analytics', 'campaign', 'brand', 'PPC'],
        'finance': ['investment', 'banking', 'crypto', 'budget', 'savings', 'trading', 'insurance', 'tax'],
        'health': ['fitness', 'nutrition', 'mental health', 'wellness', 'diet', 'exercise', 'medical'],
        'education': ['course', 'learning', 'training', 'certification', 'degree', 'online learning'],
        'ecommerce': ['store', 'product', 'shipping', 'marketplace', 'inventory', 'fulfillment'],
        'saas': ['platform', 'subscription', 'feature', 'integration', 'workflow', 'dashboard']
    };

    function classifyIntent(keyword) {
        const lower = keyword.toLowerCase();
        const scores = {};
        
        for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
            scores[intent] = 0;
            for (const pattern of patterns) {
                if (lower.includes(pattern)) {
                    scores[intent] += pattern.split(' ').length; // weight multi-word matches higher
                }
            }
        }

        const maxScore = Math.max(...Object.values(scores));
        if (maxScore === 0) return 'informational'; // default

        const topIntent = Object.entries(scores)
            .filter(([, s]) => s === maxScore)
            .map(([intent]) => intent)[0];

        return topIntent;
    }

    const NICHE_DATASET = {
        'technology': {
            facts: ['AI-driven content generation can reduce draft time by up to 90%.', 'Modern blog engines use advanced semantic algorithms for SEO.', 'Automation ensures consistent content quality across large-scale portfolios.'],
            terms: ['automation', 'SEO optimization', 'content engine', 'semantic architecture', 'data-driven generation'],
            stats: ['90% of content creators plan to use AI for drafting in 2026.', 'Automated SEO can improve search visibility by over 150%.']
        },
        'saas': {
            facts: ['Cloud-based platforms provide 99.9% uptime for content delivery.', 'Modular SaaS architectures allow for rapid feature scaling.', 'API-first approaches enable seamless integration with existing marketing stacks.'],
            terms: ['scalability', 'automation', 'user experience', 'cloud infrastructure', 'modular systems'],
            stats: ['Companies using automated SaaS tools see a 40% increase in productivity.', 'Scaling content delivery via cloud systems reduces latency by 70%.']
        },
        'travel': {
            facts: ['Eco-tourism is the fastest-growing sector in the travel industry.', 'Over 60% of travelers now prioritize local experiences over luxury stays.', 'The digital nomad lifestyle has increased the demand for monthly rentals by 40%.'],
            terms: ['itinerary', 'destination management', 'sustainable travel', 'off-the-beaten-path', 'cultural immersion'],
            stats: ['72% of people value experiences over material possessions.', 'Direct flights increase tourism in Tier 2 cities by 35%.']
        },
        'food': {
            facts: ['Plant-based protein demand has increased by 700% since 2020.', 'Farm-to-table practices reduce carbon footprint by 30%.', 'Modern culinary trends focus on functional foods and adaptogens.'],
            terms: ['gourmet', 'culinary technique', 'seasonal ingredients', 'flavor profile', 'artisanal production'],
            stats: ['63% of consumers are willing to pay more for organic produce.', 'Food delivery apps have reshaped restaurant revenue models by 45%.']
        },
        'education': {
            facts: ['Online learning increases retention rates by up to 60%.', 'Personalized learning paths improve test scores by 2.5x.', 'Micro-credentials are becoming as valuable as traditional degrees.'],
            terms: ['pedagogy', 'e-learning', 'cognitive development', 'curriculum design', 'skill acquisition'],
            stats: ['The global EdTech market is projected to grow by 15% annually.', 'Gamified learning improves student engagement by 48%.']
        },
        'lifestyle': {
            facts: ['Minimalism has been proven to reduce anxiety in 85% of participants.', 'The wellness industry is now a multi-trillion dollar global market.', 'Hybrid work has redefined home office design principles.'],
            terms: ['aesthetic', 'mindfulness', 'self-improvement', 'sustainability', 'work-life balance'],
            stats: ['55% of people now prefer eco-friendly household products.', 'Daily journaling increases focus and productivity by 20%.']
        },
        'automotive': {
            facts: ['Electric vehicles are expected to make up 50% of new car sales by 2030.', 'Autonomous driving technology reduces accidents by up to 90%.', 'Solid-state batteries are the next frontier in EV range.'],
            terms: ['drivetrain', 'aerodynamics', 'automotive engineering', 'infotainment', 'regenerative braking'],
            stats: ['92% of new car buyers now start their research online.', 'Battery costs have dropped by 89% since 2010.']
        },
        'environment': {
            facts: ['Renewable energy is now the cheapest source of power in most countries.', 'Regenerative agriculture can sequester billions of tons of carbon.', 'Circular economy models reduce waste by up to 70%.'],
            terms: ['sustainability', 'biodiversity', 'carbon footprint', 'ecosystem restoration', 'green technology'],
            stats: ['80% of global consumers now expect companies to be environmentally responsible.', 'Solar power capacity is doubling every 3 years.']
        },
        'general': {
            facts: ['Continuous adaptation is the key to success in any field.', 'Success is often a combination of strategy, timing, and execution.', 'Modern progress relies on the intersection of diverse ideas.'],
            terms: ['framework', 'optimization', 'strategy', 'innovation', 'implementation'],
            stats: ['Consistency is 5x more effective than intensity in the long run.', '75% of leaders identify "adaptability" as their most valuable trait.']
        },
        'nature': {
            facts: ['Biodiversity is the foundation of ecosystem stability.', 'Conservation efforts have successfully brought multiple species back from the brink of extinction.', 'Protecting natural habitats is the most cost-effective way to combat climate change.'],
            terms: ['ecosystem', 'biodiversity', 'wildlife conservation', 'natural habitat', 'species preservation'],
            stats: ['Nature-based solutions can provide up to 37% of the emission reductions needed.', 'The world has lost 60% of its wildlife populations in the last 50 years.']
        }
    };

    function getNicheData(niche, primaryKeyword = '') {
        const kw = (primaryKeyword || '').toLowerCase();
        let key = (niche || '').toLowerCase().trim();
        
        // Comprehensive trigger map for auto-detection
        const triggers = {
            'technology': ['tech', 'cloud', 'ai', 'digital', 'api', 'system', 'server', 'computing', 'code', 'database', 'automation', 'hardware'],
            'saas': ['software', 'saas', 'app', 'user', 'onboarding', 'platform', 'feature', 'subscription', 'growth', 'product', 'enterprise', 'b2b'],
            'marketing': ['marketing', 'seo', 'conversion', 'ads', 'brand', 'content', 'social media', 'traffic', 'customers', 'sales', 'funnel', 'kpi'],
            'nature': ['tiger', 'lion', 'animal', 'wildlife', 'conservation', 'habitat', 'forest', 'ecosystem', 'nature', 'climate', 'species', 'biology', 'ecological'],
            'travel': ['travel', 'destination', 'itinerary', 'tourism', 'visit', 'hotels', 'flights', 'explore', 'trip', 'vacation', 'resort', 'passport', 'trek'],
            'food': ['food', 'recipe', 'cooking', 'culinary', 'kitchen', 'gourmet', 'restaurant', 'taste', 'nutrition', 'organic', 'vegan', 'chef', 'meal'],
            'finance': ['money', 'finance', 'investing', 'portfolio', 'stock', 'banking', 'wealth', 'fiscal', 'roi', 'liquidity', 'crypto', 'savings', 'loan'],
            'health': ['health', 'wellness', 'fitness', 'medical', 'mental', 'doctor', 'patient', 'exercise', 'diet', 'sleep', 'stress', 'recovery', 'wellness'],
            'education': ['education', 'learning', 'school', 'university', 'student', 'skill', 'course', 'teaching', 'pedagogy', 'academic', 'degree', 'study'],
            'automotive': ['car', 'automotive', 'vehicle', 'driving', 'ev', 'engine', 'transport', 'truck', 'tire', 'brake', 'drivetrain', 'tesla'],
            'science': ['science', 'research', 'physics', 'discovery', 'experiment', 'scientific', 'data', 'theory', 'laboratory', 'analysis', 'molecule', 'space']
        };

        // Auto-detect if niche is generic
        if (!key || key === 'general' || key === 'other') {
            for (const [nicheKey, nicheTerms] of Object.entries(triggers)) {
                // Use word boundaries to prevent accidental matches (like 'ai' in 'plain')
                if (nicheTerms.some(t => new RegExp(`\\b${t.toLowerCase()}\\b`).test(kw))) {
                    key = nicheKey;
                    break;
                }
            }
        }
        
        // Synonyms / Mapping
        const mapping = {
            'it': 'technology',
            'digital marketing': 'marketing',
            'business': 'saas',
            'wellness': 'health',
            'cooking': 'food',
            'learning': 'education',
            'tiger': 'nature',
            'wildlife': 'nature'
        };
        
        if (mapping[key]) key = mapping[key];

        const finalKey = NICHE_DATASET[key] ? key : 'general';
        return {
            key: finalKey,
            data: NICHE_DATASET[finalKey]
        };
    }

    function estimateSearchVolume(keyword) {
        // Simulate search volume estimation based on keyword characteristics
        const wordCount = keyword.split(/\s+/).length;
        const hasNumbers = /\d/.test(keyword);
        const length = keyword.length;
        
        let baseVolume = 5000;
        
        // Longer keywords = lower volume (long-tail)
        if (wordCount >= 5) baseVolume *= 0.15;
        else if (wordCount >= 4) baseVolume *= 0.3;
        else if (wordCount >= 3) baseVolume *= 0.5;
        else if (wordCount >= 2) baseVolume *= 0.8;
        
        // Add variance
        const variance = 0.5 + Math.random();
        baseVolume = Math.round(baseVolume * variance);
        
        // Year-specific queries tend to have higher volume
        if (/202\d/.test(keyword)) baseVolume = Math.round(baseVolume * 1.5);
        
        return Math.max(50, Math.min(50000, baseVolume));
    }

    function estimateDifficulty(keyword, volume) {
        const wordCount = keyword.split(/\s+/).length;
        let difficulty = 50;
        
        // Short keywords = higher difficulty
        if (wordCount <= 2) difficulty += 20;
        else if (wordCount <= 3) difficulty += 5;
        else difficulty -= 15;
        
        // High volume = higher difficulty
        if (volume > 10000) difficulty += 15;
        else if (volume > 5000) difficulty += 10;
        else if (volume < 500) difficulty -= 10;
        
        // Add variance
        difficulty += Math.round((Math.random() - 0.5) * 20);
        
        return Math.max(5, Math.min(95, difficulty));
    }

    function analyzeKeyword(keyword) {
        const intent = classifyIntent(keyword);
        const volume = estimateSearchVolume(keyword);
        const difficulty = estimateDifficulty(keyword, volume);

        return {
            keyword: keyword.trim(),
            intent,
            volume,
            difficulty,
            cluster: null,
            selected: false,
            id: 'kw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
        };
    }

    // ========== KEYWORD CLUSTERING ==========

    function tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !STOP_WORDS.has(w));
    }

    const STOP_WORDS = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
        'was', 'one', 'our', 'out', 'has', 'have', 'had', 'how', 'what', 'when',
        'who', 'will', 'with', 'this', 'that', 'from', 'they', 'been', 'more',
        'its', 'than', 'each', 'which', 'their', 'about', 'into', 'then', 'them',
        'these', 'just', 'also', 'very', 'does', 'most', 'your'
    ]);

    function computeSimilarity(tokens1, tokens2) {
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        if (union.size === 0) return 0;
        return intersection.size / union.size; // Jaccard similarity
    }

    function clusterKeywords(keywords, threshold = 0.25) {
        const tokenized = keywords.map(kw => ({
            ...kw,
            tokens: tokenize(kw.keyword)
        }));

        const clusters = [];
        const assigned = new Set();

        for (let i = 0; i < tokenized.length; i++) {
            if (assigned.has(i)) continue;

            const cluster = {
                id: 'cluster_' + (clusters.length + 1),
                name: '',
                keywords: [tokenized[i]],
                color: CLUSTER_COLORS[clusters.length % CLUSTER_COLORS.length]
            };
            assigned.add(i);

            for (let j = i + 1; j < tokenized.length; j++) {
                if (assigned.has(j)) continue;
                
                const similarity = computeSimilarity(tokenized[i].tokens, tokenized[j].tokens);
                
                // Also check intent match
                const sameIntent = tokenized[i].intent === tokenized[j].intent;
                const adjustedThreshold = sameIntent ? threshold * 0.8 : threshold;
                
                if (similarity >= adjustedThreshold) {
                    cluster.keywords.push(tokenized[j]);
                    assigned.add(j);
                }
            }

            // Name the cluster based on common tokens
            const allTokens = cluster.keywords.flatMap(k => k.tokens);
            const tokenFreq = {};
            allTokens.forEach(t => { tokenFreq[t] = (tokenFreq[t] || 0) + 1; });
            const topTokens = Object.entries(tokenFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([token]) => token);
            
            cluster.name = topTokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' + ');
            if (!cluster.name) cluster.name = 'Cluster ' + (clusters.length + 1);

            clusters.push(cluster);
        }

        return clusters;
    }

    const CLUSTER_COLORS = [
        '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981',
        '#3b82f6', '#ef4444', '#14b8a6', '#8b5cf6', '#f97316'
    ];

    // ========== SERP GAP ANALYSIS ==========

    function analyzeSERPGaps(keyword) {
        const intent = classifyIntent(keyword);
        const gaps = [];
        const opportunities = [];

        // Simulate SERP analysis
        const gapTemplates = {
            informational: [
                'Missing comprehensive step-by-step guide',
                'No visual infographic content in top results',
                'Lack of updated 2026 statistics and data',
                'Missing expert quotes and E-E-A-T signals',
                'No FAQ section targeting "People Also Ask"',
                'Thin content in top 5 (avg < 1500 words)',
                'Missing comparison tables for easy scanning',
                'No video content complement'
            ],
            commercial: [
                'No side-by-side feature comparison table',
                'Missing pricing transparency in reviews',
                'Lack of real user testimonials/case studies',
                'No clear winner recommendation',
                'Missing pros/cons breakdown',
                'Outdated alternatives listed',
                'No integration compatibility info'
            ],
            transactional: [
                'Missing trust signals (reviews, ratings)',
                'No clear pricing breakdown',
                'Lack of urgency/scarcity elements',
                'Missing free trial/demo CTA',
                'No ROI calculator or value proposition',
                'Missing shipping/delivery information',
                'No money-back guarantee mention'
            ],
            navigational: [
                'Outdated contact information',
                'Missing direct action links',
                'No quick-start guide',
                'Lack of platform screenshots',
                'Missing troubleshooting FAQ'
            ]
        };

        const allGaps = gapTemplates[intent] || gapTemplates.informational;
        const numGaps = 3 + Math.floor(Math.random() * 3);
        
        const selectedIndices = new Set();
        while (selectedIndices.size < Math.min(numGaps, allGaps.length)) {
            selectedIndices.add(Math.floor(Math.random() * allGaps.length));
        }
        
        selectedIndices.forEach(i => gaps.push(allGaps[i]));

        // Snippet opportunity
        const snippetTypes = ['paragraph', 'list', 'table', 'video'];
        const snippetType = snippetTypes[Math.floor(Math.random() * snippetTypes.length)];

        // Opportunity level
        const difficultyScore = estimateDifficulty(keyword, estimateSearchVolume(keyword));
        let opportunity;
        if (difficultyScore < 40) opportunity = 'high';
        else if (difficultyScore < 65) opportunity = 'medium';
        else opportunity = 'low';

        return {
            keyword,
            intent,
            gaps,
            snippetOpportunity: snippetType,
            opportunity,
            competitorWeaknesses: [
                `Top results average ${1200 + Math.floor(Math.random() * 800)} words`,
                `Only ${Math.floor(Math.random() * 3)} of top 10 have structured data`,
                `${30 + Math.floor(Math.random() * 40)}% of top results are outdated (>12 months)`
            ],
            paaQuestions: generatePAAQuestions(keyword)
        };
    }

    function generatePAAQuestions(keyword) {
        const templates = [
            `What is ${keyword}?`,
            `How does ${keyword} work?`,
            `Why is ${keyword} important?`,
            `What are the benefits of ${keyword}?`,
            `How to choose the best ${keyword}?`,
            `What are common ${keyword} mistakes?`,
            `Is ${keyword} worth it in 2026?`,
            `What are alternatives to ${keyword}?`
        ];
        
        const num = 3 + Math.floor(Math.random() * 3);
        const shuffled = [...templates].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, num);
    }

    // ========== BLOG CONTENT GENERATION ==========

    function generateBlog(config) {
        const {
            primaryKeyword,
            secondaryKeywords = [],
            niche = 'general',
            geo = 'global',
            wordCount = 1500,
            tone = 'professional',
            cta = '',
            internalPages = [],
            includeSchema = true,
            includeFAQ = true,
            snippetOptimize = true,
            humanize = true
        } = config;

        // Step 1: Generate title options
        const titles = generateTitles(primaryKeyword, secondaryKeywords, tone);
        const selectedTitle = titles[0];

        // Step 2: Generate meta
        const meta = generateMeta(primaryKeyword, selectedTitle, tone);

        // Step 3: Generate outline
        const outline = generateOutline(primaryKeyword, secondaryKeywords, selectedTitle, wordCount, snippetOptimize);

        // Step 4: Generate content sections
        const sections = generateSections(outline, primaryKeyword, secondaryKeywords, tone, humanize, niche);

        // Step 5: Add CTAs and internal links
        const enrichedContent = enrichContent(sections, cta, internalPages, primaryKeyword);

        // Step 6: Generate FAQ
        const faq = includeFAQ ? generateFAQ(primaryKeyword, secondaryKeywords) : null;

        // Step 7: Generate schema
        const schema = includeSchema ? generateSchema(selectedTitle, meta.description, primaryKeyword, faq) : null;

        // Step 8: Analyze SEO metrics
        const fullText = extractPlainText(enrichedContent, faq);
        const seoScore = analyzeSEO(fullText, primaryKeyword, secondaryKeywords, enrichedContent, faq);

        // Step 9: AI detection analysis
        const aiDetection = analyzeAIDetection(fullText);

        // Step 10: Traffic projection
        const traffic = projectTraffic(primaryKeyword, seoScore);

        return {
            title: selectedTitle,
            titles,
            meta,
            outline,
            sections: enrichedContent,
            faq,
            schema,
            seoScore,
            aiDetection,
            traffic,
            config,
            generatedAt: new Date().toISOString(),
            wordCount: countWords(fullText),
            id: 'blog_' + Date.now()
        };
    }

    // ========== TITLE GENERATION ==========

    function generateTitles(primary, secondary, tone) {
        const powerWords = {
            professional: ['Comprehensive', 'Definitive', 'Essential', 'Complete', 'Strategic'],
            conversational: ['Ultimate', 'Amazing', 'Must-Know', 'Game-Changing', 'Insider'],
            authoritative: ['Expert', 'Proven', 'Research-Backed', 'Data-Driven', 'Authoritative'],
            friendly: ['Simple', 'Easy', 'Helpful', 'Friendly', 'Quick'],
            technical: ['Advanced', 'In-Depth', 'Technical', 'Detailed', 'Systematic']
        };

        const words = powerWords[tone] || powerWords.professional;
        const year = new Date().getFullYear();
        const capitalize = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const kw = capitalize(primary);

        return [
            `The ${words[0]} Guide to ${kw} (${year})`,
            `${words[1]} ${kw}: Everything You Need to Know`,
            `${Math.floor(7 + Math.random() * 8)} ${words[2]} ${kw} Strategies That Actually Work`,
            `${kw}: A ${words[3]} Breakdown for ${year}`,
            `How to Master ${kw} — ${words[4]} Tips & Best Practices`
        ];
    }

    // ========== META GENERATION ==========

    function generateMeta(primary, title, tone) {
        const ctaWords = {
            professional: 'Learn more in our comprehensive guide.',
            conversational: 'Discover what you\'ve been missing!',
            authoritative: 'Read the expert analysis now.',
            friendly: 'Find out how — it\'s easier than you think!',
            technical: 'Get the detailed technical breakdown.'
        };

        const description = `Discover the best strategies for ${primary}. ${ctaWords[tone] || ctaWords.professional} Updated for ${new Date().getFullYear()} with actionable insights.`;
        
        const slug = primary.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 60);

        return {
            title: title.substring(0, 60),
            description: description.substring(0, 155),
            slug,
            ogTitle: title.substring(0, 60),
            ogDescription: description.substring(0, 155),
            canonical: `https://example.com/blog/${slug}`
        };
    }

    // ========== OUTLINE GENERATION ==========

    function generateOutline(primary, secondary, title, wordCount, snippetOptimize) {
        const capitalize = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const kw = capitalize(primary);

        return [
            {
                h2: `1. Introduction`,
                h3s: [`Overview of ${kw}`, `The Importance of ${kw} in 2026`],
                snippetType: 'paragraph',
                targetWords: Math.round(wordCount * 0.15)
            },
            {
                h2: `2. Definition`,
                h3s: [`What Exactly is ${kw}?`, `Core Concepts & Principles`],
                snippetType: 'paragraph',
                targetWords: Math.round(wordCount * 0.15)
            },
            {
                h2: `3. Key Features`,
                h3s: [`Advanced Automation`, `Scalability & Performance`, `SEO Optimization Pass`],
                snippetType: 'list',
                targetWords: Math.round(wordCount * 0.25)
            },
            {
                h2: `4. Benefits`,
                h3s: [`Saving Time & Resources`, `Improving Search Rankings`, `Reducing Operational Costs`],
                snippetType: 'list',
                targetWords: Math.round(wordCount * 0.25)
            },
            {
                h2: `5. Implementation`,
                h3s: [`How to Build Your ${kw} Strategy`, `Step-by-Step Execution`, `Measuring Long-Term Success`],
                snippetType: 'list',
                targetWords: Math.round(wordCount * 0.2)
            }
        ];
    }

    // ========== CONTENT SECTION GENERATION ==========

    function generateSections(outline, primary, secondary, tone, humanize, niche) {
        const sections = [];
        const capitalize = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const kw = capitalize(primary);

        const toneStyles = {
            professional: {
                transitions: ['Furthermore,', 'In addition,', 'Moreover,', 'Consequently,', 'As a result,'],
                openers: ['Research indicates that', 'Industry data shows that', 'The current standard suggests that', 'Effective implementation requires that'],
                closers: ['This approach has proven effective.', 'The evidence supports this methodology.', 'This strategy leads to measurable improvements.']
            },
            conversational: {
                transitions: ['Actually,', 'Now,', 'But wait,', 'The real point is:', 'Usually:'],
                openers: ['You might find that', 'Most experts agree that', 'The truth is that', 'Here is what matters:'],
                closers: ['This is why it works.', 'That is the bottom line.', 'It is worth the effort.']
            },
            authoritative: {
                transitions: ['Based on analysis,', 'The data reveals that', 'According to research,', 'The findings indicate that'],
                openers: ['After research,', 'Experience shows that', 'Experts have determined that', 'The latest data confirms that'],
                closers: ['This is supported by studies.', 'The evidence is conclusive.', 'Benchmarks validate this approach.']
            },
            friendly: {
                transitions: ['Also,', 'Additionally,', 'Specifically,', 'One fact is:'],
                openers: ['The system works like this:', 'Consider these factors:', 'Implementation is straightforward:', 'The results are clear:'],
                closers: ['It is a simple process.', 'The logic holds up.', 'Results follow this pattern.']
            },
            technical: {
                transitions: ['Specifically,', 'Technically,', 'Internally,', 'Architecturally,'],
                openers: ['The mechanism involves', 'The system requires', 'The internal logic shows', 'Implementation reveals that'],
                closers: ['The architecture ensures performance.', 'This scales with demand.', 'The overhead is minimal.']
            }
        };

        const style = toneStyles[tone] || toneStyles.professional;

        outline.forEach((section, idx) => {
            const content = {
                h2: section.h2,
                h3s: [],
                paragraphs: [],
                lists: [],
                snippetType: section.snippetType
            };

            // Generate intro paragraph for the section
            const opener = style.openers[idx % style.openers.length];
            const transition = style.transitions[idx % style.transitions.length];
            
            const introText = generateParagraph(primary, section.h2, opener, transition, style, humanize, niche);
            content.paragraphs.push(introText);

            // Generate H3 subsections
            section.h3s.forEach((h3, h3idx) => {
                const subContent = {
                    heading: h3,
                    text: generateParagraph(primary, h3, 
                        style.openers[(idx + h3idx + 1) % style.openers.length],
                        style.transitions[(idx + h3idx + 1) % style.transitions.length],
                        style, humanize, niche)
                };

                // Add a list for variety
                if (h3idx % 2 === 0) {
                    subContent.list = generateBulletList(primary, h3, 4 + Math.floor(Math.random() * 3), niche);
                }

                content.h3s.push(subContent);
            });

            // Add closer
            content.closer = style.closers[idx % style.closers.length];

            sections.push(content);
        });

        return sections;
    }

    function generateParagraph(keyword, topic, opener, transition, style, humanize, niche) {
        const capitalize = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const kw = capitalize(keyword);
        const { data } = getNicheData(niche, keyword);

        const fact = data.facts[Math.floor(Math.random() * data.facts.length)];
        const term = data.terms[Math.floor(Math.random() * data.terms.length)];
        const stat = data.stats[Math.floor(Math.random() * data.stats.length)];

        // Clean topic by removing leading numbers like '1. ', '2. ', etc.
        const cleanTopic = topic.replace(/^\d+\.\s*/, '').toLowerCase();

        const templates = [
            `${opener} ${kw} has become important because it helps generate results automatically and efficiently. ${fact} This is why effective strategies in this area consistently deliver superior performance compared to traditional methods. ${transition} focus on ${term} ensures that the output is both useful and accurate.`,
            
            `When it comes to ${cleanTopic}, using ${kw} is essential for scaling output without losing quality. ${opener} current standards show that ${stat.toLowerCase()}, which proves why this approach works. ${transition} implementing ${term} during the process provides a clear path to success.`,
            
            `${transition} the real value of ${kw} lies in its ability to automate repetitive tasks and optimize for SEO. ${stat} Using a structured framework leads to a ${15 + Math.floor(Math.random() * 35)}% improvement in target outcomes, especially when considering ${term}. ${opener} this data reinforces why a systematic approach is necessary.`,
            
            `The primary goal of ${kw} is to simplify ${cleanTopic} while improving rankings. ${opener} staying focused on these objectives requires a data-driven strategy. ${fact} ${transition} the methods described here represent the most effective ways to manage ${term} in any industry.`,
            
            `${opener} ${kw} saves time and resources by handling complex data points automatically. In a recent analysis, ${stat.toLowerCase()} This trend continues as more people recognize the profound value of ${term}. ${transition} a focus on ${kw} is now essential for long-term growth.`
        ];

        let paragraph = templates[Math.floor(Math.random() * templates.length)];

        if (humanize) {
            const additions = [
                ` The numbers prove the effectiveness.`,
                ` This shift change everything.`,
                ` The logic is simple and clear.`,
                ` This approach is built for results.`
            ];
            if (Math.random() > 0.5) {
                paragraph += additions[Math.floor(Math.random() * additions.length)];
            }
        }

        return paragraph;
    }

    function generateBulletList(keyword, topic, count, niche) {
        const { key, data } = getNicheData(niche, keyword);
        const term = data.terms[0];

        const genericItems = [
            `Full Automation: Saves time and resources by handling tasks automatically.`,
            `SEO Optimization: Improves search rankings through data-driven techniques.`,
            `Scalability: High-performance framework that handles growth efficiently.`,
            `Cost Reduction: Reduces operational costs while maintaining quality.`,
            `Time Savings: Eliminates repetitive manual effort and waste.`,
            `Improved Rankings: Boosts visibility across modern platforms.`,
            `Consistent Output: Professional results with optimized ${term} principles.`,
            `Data Accuracy: Reliable conclusions based on real-time situational data.`,
            `Streamlined Logic: Efficient workflows that ensure measurable ROI.`,
            `Strategic Advantage: Future-proof approach for long-term growth.`
        ];

        const nicheItems = {
            'travel': [
                'Optimized itineraries that balance relaxation and exploration.',
                'Increased focus on sustainable travel practices to protect local ecosystems.',
                'Enhanced cultural immersion through off-the-beaten-path destinations.',
                'Improved travel logistics using modern destination management tools.',
                'Higher traveler satisfaction through personalized experience design.'
            ],
            'food': [
                'Gourmet results using seasonal and artisanal ingredients.',
                'Improved nutritional value through mindful culinary techniques.',
                'Sustainable sourcing that reduces environmental impact.',
                'Enhanced flavor profiles through innovative ingredient pairing.',
                'Streamlined food preparation workflows for home and professional kitchens.'
            ],
            'nature': [
                'Effective habitat restoration strategies for local biodiversity.',
                'Increased public awareness of wildlife conservation priorities.',
                'Data-driven species monitoring for long-term population stability.',
                'Sustainable land management that balances usage and preservation.',
                'Nature-based solutions for urban climate adaptation.'
            ],
            'science': [
                'Rigorous adherence to the scientific method for validated results.',
                'Evidence-based conclusions grounded in reproducible research.',
                'Interdisciplinary collaboration that accelerates discovery cycles.',
                'Advanced data modeling to predict complex system behaviors.',
                'Ethical considerations integrated intoทุก phase of research.'
            ]
        };

        const availableNicheItems = nicheItems[key] || [];
        const items = [...availableNicheItems, ...genericItems];

        const shuffled = [...items].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    // ========== CONTENT ENRICHMENT ==========

    function enrichContent(sections, cta, internalPages, keyword) {
        const enriched = JSON.parse(JSON.stringify(sections));

        // Add CTA blocks
        if (cta) {
            const ctaPositions = [Math.floor(enriched.length / 3), Math.floor(enriched.length * 2 / 3)];
            ctaPositions.forEach(pos => {
                if (enriched[pos]) {
                    enriched[pos].cta = {
                        text: `Ready to transform your ${keyword} strategy?`,
                        button: cta,
                        type: pos === ctaPositions[0] ? 'soft' : 'medium'
                    };
                }
            });
        }

        // Add internal links
        if (internalPages.length > 0) {
            const linkPositions = [0, Math.floor(enriched.length / 2), enriched.length - 2];
            linkPositions.forEach((pos, idx) => {
                if (enriched[pos] && internalPages[idx % internalPages.length]) {
                    enriched[pos].internalLink = {
                        url: internalPages[idx % internalPages.length],
                        anchor: `related guide on ${keyword}`,
                        position: 'contextual'
                    };
                }
            });
        }

        return enriched;
    }

    // ========== FAQ GENERATION ==========

    function generateFAQ(primary, secondary) {
        const capitalize = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const kw = capitalize(primary);

        const faqs = [
            {
                q: `What is ${kw} and why does it matter?`,
                a: `${kw} refers to the strategic approach of leveraging ${primary} to achieve measurable business outcomes. It matters because organizations that implement it effectively see an average ${20 + Math.floor(Math.random() * 30)}% improvement in their key metrics, making it an essential component of any modern strategy.`
            },
            {
                q: `How do I get started with ${kw}?`,
                a: `Start by defining clear objectives and identifying your target metrics. Then, implement the foundational elements outlined in our step-by-step guide above. Most organizations see initial results within ${2 + Math.floor(Math.random() * 4)} weeks of implementation.`
            },
            {
                q: `What are the most common ${kw} mistakes to avoid?`,
                a: `The biggest mistakes include: not having a clear strategy before starting, ignoring data and analytics, trying to implement everything at once instead of phasing your approach, and failing to adapt your strategy based on performance feedback.`
            },
            {
                q: `How much does ${kw} implementation cost?`,
                a: `Costs vary widely based on scope and complexity. Small businesses can start with budgets as low as $${500 + Math.floor(Math.random() * 500)}/month, while enterprise implementations may range from $${5000 + Math.floor(Math.random() * 5000)} to $${15000 + Math.floor(Math.random() * 10000)}/month. The ROI typically justifies the investment within ${3 + Math.floor(Math.random() * 6)} months.`
            },
            {
                q: `Is ${kw} still relevant in ${new Date().getFullYear()}?`,
                a: `Absolutely. In fact, ${kw} has become more important than ever. With the rise of AI-powered search and evolving consumer behavior, the strategies have evolved but the fundamental principles remain critical. Recent industry reports show a ${40 + Math.floor(Math.random() * 30)}% year-over-year increase in adoption rates.`
            }
        ];

        return faqs;
    }

    // ========== SCHEMA GENERATION ==========

    function generateSchema(title, description, keyword, faq) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "author": {
                "@type": "Person",
                "name": "BlogForge AI Expert Team"
            },
            "datePublished": new Date().toISOString().split('T')[0],
            "dateModified": new Date().toISOString().split('T')[0],
            "publisher": {
                "@type": "Organization",
                "name": "BlogForge AI"
            },
            "keywords": keyword
        };

        const result = { article: schema };

        if (faq && faq.length > 0) {
            result.faq = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faq.map(f => ({
                    "@type": "Question",
                    "name": f.q,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": f.a
                    }
                }))
            };
        }

        return result;
    }

    // ========== SEO ANALYSIS ==========

    function analyzeSEO(text, primary, secondary, sections, faq) {
        const lower = text.toLowerCase();
        const words = text.split(/\s+/);
        const wordCount = words.length;

        // 1. Keyword density
        const primaryCount = (lower.match(new RegExp(primary.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        const keywordDensity = (primaryCount / wordCount) * 100;
        const densityScore = keywordDensity >= 0.8 && keywordDensity <= 2.5 ? 100 : 
                            keywordDensity >= 0.5 && keywordDensity <= 3 ? 70 : 40;

        // 2. Readability (Flesch-Kincaid approximation)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
        const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
        const avgSyllablesPerWord = syllables / Math.max(wordCount, 1);
        const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        const readabilityScore = Math.max(0, Math.min(100, fleschScore));

        // 3. Header optimization
        const headerScore = sections.reduce((score, s) => {
            if (s.h2 && s.h2.toLowerCase().includes(primary.toLowerCase().split(' ')[0])) score += 15;
            return score;
        }, 0);
        const headerOptimization = Math.min(100, headerScore + 40);

        // 4. Internal links score
        const internalLinks = sections.filter(s => s.internalLink).length;
        const internalLinkScore = Math.min(100, internalLinks * 25 + 25);

        // 5. Snippet readiness
        const hasSnippetStructure = sections.some(s => s.snippetType);
        const hasFAQ = faq && faq.length > 0;
        const snippetScore = (hasSnippetStructure ? 50 : 0) + (hasFAQ ? 30 : 0) + (wordCount > 1000 ? 20 : 10);

        // 6. Content length score
        const lengthScore = wordCount >= 1500 ? 100 : wordCount >= 1000 ? 80 : wordCount >= 500 ? 50 : 30;

        // 7. Meta optimization
        const metaScore = 85; // Generally well-formed

        // Overall SEO score (weighted)
        const overallSEO = Math.round(
            densityScore * 0.2 +
            readabilityScore * 0.15 +
            headerOptimization * 0.15 +
            internalLinkScore * 0.1 +
            snippetScore * 0.15 +
            lengthScore * 0.1 +
            metaScore * 0.15
        );

        return {
            overall: Math.min(98, Math.max(45, overallSEO)),
            keywordDensity: {
                score: densityScore,
                value: keywordDensity.toFixed(2),
                count: primaryCount,
                status: densityScore >= 70 ? 'pass' : 'warn'
            },
            readability: {
                score: Math.min(100, Math.max(30, Math.round(readabilityScore))),
                fleschScore: Math.round(fleschScore),
                avgWordsPerSentence: Math.round(avgWordsPerSentence),
                status: readabilityScore >= 60 ? 'pass' : 'warn'
            },
            headerOptimization: {
                score: headerOptimization,
                status: headerOptimization >= 60 ? 'pass' : 'warn'
            },
            internalLinks: {
                score: internalLinkScore,
                count: internalLinks,
                status: internalLinks >= 2 ? 'pass' : 'warn'
            },
            snippetReadiness: {
                score: Math.min(100, snippetScore),
                hasSnippetStructure,
                hasFAQ,
                status: snippetScore >= 60 ? 'pass' : 'warn'
            },
            contentLength: {
                score: lengthScore,
                wordCount,
                status: lengthScore >= 80 ? 'pass' : 'warn'
            },
            metaOptimization: {
                score: metaScore,
                status: 'pass'
            }
        };
    }

    function countSyllables(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const syllables = word.match(/[aeiouy]{1,2}/g);
        return syllables ? syllables.length : 1;
    }

    // ========== AI DETECTION ANALYSIS ==========

    function analyzeAIDetection(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/);

        // Perplexity (sentence-level unpredictability) — higher is more human
        const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
        const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
        const lenVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / sentenceLengths.length;
        const perplexity = Math.min(100, Math.round(Math.sqrt(lenVariance) * 5 + 30));

        // Burstiness (variation in sentence complexity) — higher is more human
        const burstiness = Math.min(100, Math.round(Math.sqrt(lenVariance) * 8 + 25));

        // Vocabulary diversity (unique words / total words)
        const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
        const vocabDiversity = Math.round((uniqueWords.size / words.length) * 100);

        // Sentence structure variation
        const starterWords = sentences.map(s => s.trim().split(/\s+/)[0]);
        const uniqueStarters = new Set(starterWords.map(w => w ? w.toLowerCase() : ''));
        const sentenceVariation = Math.round((uniqueStarters.size / Math.max(starterWords.length, 1)) * 100);

        // Overall AI detection probability (lower = more human-like = better)
        const humanScore = Math.round(
            (perplexity * 0.3 + burstiness * 0.3 + vocabDiversity * 0.2 + sentenceVariation * 0.2)
        );
        const aiDetectionProbability = Math.max(5, Math.min(45, 100 - humanScore));

        return {
            aiDetectionProbability,
            perplexity,
            burstiness,
            vocabDiversity,
            sentenceVariation,
            naturalness: Math.max(55, 100 - aiDetectionProbability),
            verdict: aiDetectionProbability < 20 ? 'Very Human-Like' :
                     aiDetectionProbability < 35 ? 'Mostly Human-Like' :
                     aiDetectionProbability < 50 ? 'Mixed Signals' : 'Needs Humanization'
        };
    }

    // ========== TRAFFIC PROJECTION ==========

    function projectTraffic(keyword, seoScore) {
        const volume = estimateSearchVolume(keyword);
        const difficulty = estimateDifficulty(keyword, volume);

        // Estimate SERP position based on SEO score
        let estPosition;
        if (seoScore.overall >= 90) estPosition = 1 + Math.floor(Math.random() * 3);
        else if (seoScore.overall >= 80) estPosition = 2 + Math.floor(Math.random() * 4);
        else if (seoScore.overall >= 70) estPosition = 4 + Math.floor(Math.random() * 5);
        else if (seoScore.overall >= 60) estPosition = 6 + Math.floor(Math.random() * 6);
        else estPosition = 10 + Math.floor(Math.random() * 10);

        // CTR based on position (approximate Click-Through Rates)
        const ctrByPosition = {
            1: 0.316, 2: 0.241, 3: 0.187, 4: 0.131, 5: 0.095,
            6: 0.062, 7: 0.044, 8: 0.033, 9: 0.028, 10: 0.025
        };
        const ctr = ctrByPosition[Math.min(estPosition, 10)] || 0.02;

        const monthlyTraffic = Math.round(volume * ctr);

        // 6-month traffic projection
        const projection = [];
        for (let i = 0; i < 6; i++) {
            const growthFactor = 0.3 + (i / 5) * 0.7; // Gradual ramp-up
            const variance = 0.9 + Math.random() * 0.2;
            projection.push(Math.round(monthlyTraffic * growthFactor * variance));
        }

        return {
            volume,
            estPosition,
            ctr: (ctr * 100).toFixed(1),
            monthlyTraffic,
            projection,
            annualTraffic: monthlyTraffic * 12,
            difficulty
        };
    }

    // ========== UTILITY FUNCTIONS ==========

    function extractPlainText(sections, faq) {
        let text = '';
        sections.forEach(s => {
            text += s.h2 + '. ';
            s.paragraphs.forEach(p => text += p + ' ');
            s.h3s.forEach(h3 => {
                text += h3.heading + '. ' + h3.text + ' ';
                if (h3.list) text += h3.list.join('. ') + ' ';
            });
            if (s.closer) text += s.closer + ' ';
        });
        if (faq) {
            faq.forEach(f => text += f.q + ' ' + f.a + ' ');
        }
        return text;
    }

    function countWords(text) {
        return text.split(/\s+/).filter(w => w.length > 0).length;
    }

    // ========== PUBLIC API ==========

    return {
        analyzeKeyword,
        classifyIntent,
        clusterKeywords,
        analyzeSERPGaps,
        generateBlog,
        analyzeSEO,
        analyzeAIDetection,
        projectTraffic,
        estimateSearchVolume,
        estimateDifficulty,
        countWords,
        CLUSTER_COLORS
    };
})();
