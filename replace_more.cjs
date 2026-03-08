const fs = require('fs');
const filePaths = [
    'c:/Users/Talita/Downloads/zip/src/components/Header.tsx',
    'c:/Users/Talita/Downloads/zip/src/pages/Editor.tsx',
    'c:/Users/Talita/Downloads/zip/src/pages/FullscreenPresentation.tsx',
    'c:/Users/Talita/Downloads/zip/src/contexts/PresentationContext.tsx'
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
    ['shadow-[0_0_15px_rgba(0,246,255,0.3)]', 'shadow-lg shadow-accent/30'],
    ['shadow-[0_0_8px_rgba(0,246,255,0.8)]', 'shadow-[0_0_8px_var(--accent)]'],
    ['border-t-[#00f6ff]', 'border-t-accent'],
    ['border-r-[#00f6ff]', 'border-r-accent'],
    ['border-b-[#00f6ff]', 'border-b-accent'],
    ['border-l-[#00f6ff]', 'border-l-accent'],
    ['hover:bg-[#00f6ff]', 'hover:bg-accent'],
    ['hover:text-[#00f6ff]', 'hover:text-accent'],
    ['hover:border-[#00f6ff]', 'hover:border-accent'],
    ['hover:outline-[#00f6ff]', 'hover:outline-accent'],
    ['group-hover:text-[#00f6ff]', 'group-hover:text-accent'],
    ['group-hover:border-[#00f6ff]', 'group-hover:border-accent'],
    ['focus-within:border-[#00f6ff]/30', 'focus-within:border-accent/30'],
    ['focus:border-[#00f6ff]', 'focus:border-accent'],
    ["'#00f6ff'", "'currentColor'"], // Safest fallback if we can't use var(--accent) directly in some style objects without breaking things, but let's use var(--accent)
    ["'#00f6ff'", "var(--accent)"], // Actually we should do this where applicable
    ["color: '#00f6ff'", "color: 'var(--accent)'"],
    ["color: #00f6ff", "color: var(--accent)"],
    ["background: #00f6ff", "background: var(--accent)"],
    ["outline: #00f6ff", "outline: var(--accent)"],
    ["border-color: #00f6ff", "border-color: var(--accent)"],
    ["backgroundColor: '#00f6ff'", "backgroundColor: 'var(--accent)'"],
    ['bg-[#0d1c1d]', 'bg-bg-secondary'],
    ['accent-[#00f6ff]', 'accent-accent'],
    ['text-[#0f2223]', 'text-bg-primary'],
    ['border-[#00f6ff]/30', 'border-accent/30'],
    ['border-[#00f6ff]/20', 'border-accent/20'],
    ['border-[#00f6ff]/50', 'border-accent/50'],
    ['bg-[#00f6ff]/10', 'bg-accent/10'],
    ['bg-[#00f6ff]/20', 'bg-accent/20'],
    ['hover:bg-[#00c2cc]', 'hover:bg-accent-hover'],
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
            content = content.split(oldVal).join(newVal);
        }
        // Additional cleanup for strict style strings:
        content = content.replace(/'#00f6ff'/g, "'var(--accent)'");
        content = content.replace(/#00f6ff/g, "var(--accent)");

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Done ' + filePath);
    }
}
