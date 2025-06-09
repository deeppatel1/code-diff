import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import './index.css'

function App() {
  const containerRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    monaco.editor.defineTheme('default', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        {
          token: "identifier",
          foreground: "9CDCFE"
        }
      ],
      colors: {}
    });
    monaco.editor.setTheme('default');

    editorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
        codeLens: false,
        hover: {
            enabled: false,
        },
        minimap: {
            enabled: false,
        },
        renderLineHighlight: "none",
        contextmenu: false,
        renderSideBySide: true,
        useInlineViewWhenSpaceIsLimited: false,
        readOnly: false,
        originalEditable: true,
        diffAlgorithm: "legacy",
        renderWhitespace: "all",
    });


    const originalModel = monaco.editor.createModel(
      `function sayHello() {\n  console.log("Hello, world!");\n}`,
      'javascript'
    )

    const modifiedModel = monaco.editor.createModel(
      `function sayHello(name) {\n  console.log("Hello, " + name);\n}`,
      'javascript'
    )

    editorRef.current.setModel({
      original: originalModel,
      modified: modifiedModel,
    })

    return () => {
      editorRef.current?.dispose()
    }
  }, [])

  return (
    <div className="w-screen h-screen">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

export default App
