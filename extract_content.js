const BlogEngine = (() => {
    // Paste the core of engine.js here or just require it if we modify it
    // For speed, let's just use the current engine.js and wrap it
    const fs = require('fs');
    const path = require('path');
    const engineContent = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
    
    // Evaluate the engine content to get the BlogEngine object
    // We need to remove the 'const BlogEngine = ' part if we want to eval it cleanly or just use it
    let BlogEngine;
    eval(engineContent + '\nBlogEngine = BlogEngine;');
    return BlogEngine;
})();

const blog1 = BlogEngine.generateBlog({
    primaryKeyword: 'Blogy – Best AI Blog Automation Tool in India',
    secondaryKeywords: ['AI blog automation India', 'best AI writing tool', 'organic traffic India'],
    targetCountry: 'India',
    wordCount: 'Medium (~1,500 words)',
    tone: 'professional'
});

const blog2 = BlogEngine.generateBlog({
    primaryKeyword: 'How Blogy is Disrupting Martech – Organic Traffic on Autopilot, Cheapest SEO',
    secondaryKeywords: ['Martech disruption', 'AI SEO automation', 'organic traffic autopilot'],
    targetCountry: 'India',
    wordCount: 'Medium (~1,500 words)',
    tone: 'professional'
});

console.log('---BLOG1---');
console.log(JSON.stringify(blog1, null, 2));
console.log('---BLOG2---');
console.log(JSON.stringify(blog2, null, 2));
