import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { vim } from '@replit/codemirror-vim'

function getExtensions(language) {
    switch (language) {
        case 'javascript': return [vim(), javascript()]
        case 'typescript': return [vim(), javascript({ typescript: true })]
        case 'python':     return [vim(), python()]
        case 'sql':        return [vim(), sql()]
        case 'html':       return [vim(), html()]
        case 'css':        return [vim(), css()]
        case 'json':       return [vim(), json()]
        default:           return [vim()]
    }
}

export default function CodeEditor({ value, onChange, language = 'javascript', onEscape }) {
    return (
        <CodeMirror
            value={value}
            theme={oneDark}
            extensions={getExtensions(language)}
            onChange={onChange}
            onKeyDown={(e) => {
                // Escape from CodeMirror normal mode bubbles up to app
                if (e.key === 'Escape') {
                    // Let CodeMirror handle first Escape (insert → normal)
                    // Second Escape (or if already in normal mode) exits card
                    if (onEscape) onEscape()
                }
            }}
            basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                autocompletion: true,
                highlightActiveLine: true,
            }}
            style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
        />
    )
}