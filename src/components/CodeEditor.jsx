import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'

function getExtensions(language) {
  switch (language) {
    case 'javascript': return [javascript()]
    case 'typescript': return [javascript({ typescript: true })]
    case 'python':     return [python()]
    case 'sql':        return [sql()]
    case 'html':       return [html()]
    case 'css':        return [css()]
    case 'json':       return [json()]
    default:           return []
  }
}

export default function CodeEditor({ value, onChange, language = 'javascript' }) {
  return (
    <CodeMirror
      value={value}
      theme={oneDark}
      extensions={getExtensions(language)}
      onChange={onChange}
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