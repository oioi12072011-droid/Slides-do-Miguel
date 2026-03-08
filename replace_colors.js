const fs = require('fs');

const filePaths = [
    'c:/Users/Talita/Downloads/zip/src/pages/Editor.tsx',
    'c:/Users/Talita/Downloads/zip/src/contexts/PresentationContext.tsx',
    'c:/Users/Talita/Downloads/zip/src/pages/FullscreenPresentation.tsx'
];

const changes = [
    ['bg-[#0f2223]', 'bg-bg-secondary'],
    ['bg-[#163032]', 'bg-bg-tertiary'],
    ['text-[#00f6ff]', 'text-accent'],
    ['text-[#0f2223]', 'text-bg-primary'],
    ['bg-[#00f6ff]', 'bg-accent'],
    ['border-[#00f6ff]', 'border-accent'],
    ['border-[#163032]', 'border-border-color'],
    ['outline-[#00f6ff]', 'outline-accent'],
    ['shadow-[0_0_15px_rgba(0,246,255,0.2)]', 'shadow-lg shadow-accent/20'],
    ['shadow-[0_0_15px_rgba(0,246,255,0.1)]', 'shadow-md shadow-accent/10'],
    ['border-t-[#00f6ff]', 'border-t-accent'],
    ['border-r-[#00f6ff]', 'border-r-accent'],
    ['border-b-[#00f6ff]', 'border-b-accent'],
    ['border-l-[#00f6ff]', 'border-l-accent'],
    ['hover:bg-[#00f6ff]', 'hover:bg-accent'],
    ['hover:text-[#00f6ff]', 'hover:text-accent'],
    ['hover:border-[#00f6ff]', 'hover:border-accent'],
    ['hover:outline-[#00f6ff]', 'hover:outline-accent'],
    ['group-hover:text-[#00f6ff]', 'group-hover:text-accent'],
    ['focus:border-[#00f6ff]', 'focus:border-accent'],
    ['from-[#0D1117]', 'from-bg-primary'],
    ['via-[#0f2223]', 'via-bg-secondary'],
    ['to-[#00F5FF]', 'to-accent'],
    ["\\'#00f6ff\\'", "\"var(--accent)\""],
    ["\"#00f6ff\"", "\"var(--accent)\""],
    ["color: '#00f6ff'", "color: 'var(--accent)'"],
    ["color: #00f6ff", "color: var(--accent)"],
    ["background: #00f6ff", "background: var(--accent)"],
    ["outline: #00f6ff", "outline: var(--accent)"],
    ["border-color: #00f6ff", "border-color: var(--accent)"],
    ['bg-[#0d1c1d]', 'bg-bg-secondary'],
    ['text-[#0f2223]', 'text-bg-primary'],
    ['border-[#00f6ff]/30', 'border-accent/30'],
    ['border-[#00f6ff]/20', 'border-accent/20'],
    ['border-[#00f6ff]/50', 'border-accent/50'],
    ['bg-[#00f6ff]/10', 'bg-accent/10'],
    ['bg-[#00f6ff]/20', 'bg-accent/20'],
    ['hover:bg-[#00f6ff]/10', 'hover:bg-accent/10'],
    ['hover:bg-[#00f6ff]/20', 'hover:bg-accent/20'],
    ['bg-[#163032]/50', 'bg-bg-tertiary/50'],
    ['hover:bg-[#163032]/50', 'hover:bg-bg-tertiary/50'],
    ['hover:bg-[#163032]/80', 'hover:bg-bg-tertiary/80'],
    ['border-dashed border-[#00f6ff]/50', 'border-dashed border-accent/50'],
    ['bg-[#0f2223]/90', 'bg-bg-secondary/90']
];

for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        for (const [oldVal, newVal] of changes) {
            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            // use split and join instead of regex to avoid RegExp escape issues
            content = content.split(oldVal).join(newVal);
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Done ' + filePath);
    }
}
