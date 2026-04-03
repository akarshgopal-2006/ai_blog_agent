let code = require('fs').readFileSync('engine.js', 'utf8');
code = code.replace(/const BlogEngine = \(\(\) => {/, '');
code = code.substring(0, code.lastIndexOf('return {'));
eval(code);
const config = {
    primaryKeyword: 'The AI Blog Engine',
    secondaryKeywords: [],
    niche: 'general',
    geo: 'global',
    wordCount: 1500,
    tone: 'professional',
    cta: '',
    internalPages: [],
    includeSchema: true,
    includeFAQ: true,
    snippetOptimize: true,
    humanize: true
};
const blog = generateBlog(config);
console.log(JSON.stringify(blog, null, 2));
