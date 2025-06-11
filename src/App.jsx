import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Copy, Moon, Sun, RefreshCw, Trash2, Code, ArrowUpDown, Wand2, ArrowUpAZ, Download, Upload } from 'lucide-react'
import * as monaco from 'monaco-editor';

// // Mock Monaco Editor for demo (in real app, import from 'monaco-editor')
// const monaco = {
//   editor: {
//     createDiffEditor: (container, options) => ({
//       dispose: () => {},
//       updateOptions: () => {},
//       getModel: () => null,
//       setModel: () => {},
//       getOriginalEditor: () => ({
//         getValue: () => '',
//         onDidChangeModelContent: (cb) => ({ dispose: () => {} })
//       }),
//       getModifiedEditor: () => ({
//         getValue: () => '',
//         onDidChangeModelContent: (cb) => ({ dispose: () => {} })
//       })
//     }),
//     createModel: (value, language) => ({ dispose: () => {} }),
//     defineTheme: () => {}
//   }
// }

// Language options for Monaco
const languageOptions = [
    { value: 'bash', label: 'Bash' },
    { value: 'cpp', label: 'C++' },
    { value: 'css', label: 'CSS' },
    { value: 'dockerfile', label: 'Dockerfile' },
    { value: 'go', label: 'Go' },
    { value: 'html', label: 'HTML' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'json', label: 'JSON' },
    { value: 'makefile', label: 'Makefile' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'python', label: 'Python' },
    { value: 'sql', label: 'SQL' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'yaml', label: 'YAML' }
]

// Utility functions
const getMonacoLanguage = (lang) => (lang === 'bash' ? 'shell' : lang)

const isValidJSON = (str) => {
  try {
    JSON.parse(str.trim())
    return true
  } catch {
    return false
  }
}

const detectLanguage = (text) => {
  if (!text || text.trim().length === 0) return 'text'
  
  const trimmed = text.trim()
  
  // JSON detection
  if (isValidJSON(trimmed)) return 'json'
  
  // Simple heuristics for common languages
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return 'html'
  if (trimmed.startsWith('#!/bin/bash') || trimmed.includes('echo ') || trimmed.includes('export ')) return 'bash'
  if (trimmed.includes('function ') || trimmed.includes('const ') || trimmed.includes('let ')) return 'javascript'
  if (trimmed.includes('def ') || trimmed.includes('import ') || trimmed.includes('from ')) return 'python'
  if (trimmed.startsWith('FROM ') || trimmed.includes('RUN ') || trimmed.includes('COPY ')) return 'dockerfile'
  if (trimmed.includes('SELECT ') || trimmed.includes('INSERT ') || trimmed.includes('UPDATE ')) return 'sql'
  if (trimmed.includes('---') || trimmed.includes('apiVersion:')) return 'yaml'
  
  return 'text'
}

const beautifyJSON = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return jsonString
  }
}

const sortJSONKeys = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString)
    const sortObjectKeys = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys)
      }
      if (obj !== null && typeof obj === 'object') {
        const sorted = {}
        Object.keys(obj).sort().forEach(key => {
          sorted[key] = sortObjectKeys(obj[key])
        })
        return sorted
      }
      return obj
    }
    return JSON.stringify(sortObjectKeys(parsed), null, 2)
  } catch {
    return jsonString
  }
}

export default function EnhancedDiffEditor() {
  const containerRef = useRef(null)
  const diffEditor = useRef(null)
  const editorUpdateTimeoutRef = useRef(null)

  const [originalText, setOriginalText] = useState(
    `function sayHello() {\n  console.log("Hello, world!");\n}`
  )
  const [modifiedText, setModifiedText] = useState(
    `function sayHello(name) {\n  console.log("Hello, " + name + "!");\n  return "Hello, " + name;\n}`
  )
  const [originalLanguage, setOriginalLanguage] = useState('javascript')
  const [modifiedLanguage, setModifiedLanguage] = useState('javascript')
  const [darkMode, setDarkMode] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [diffMode, setDiffMode] = useState('split')

  // Theme management
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Debounced text update to prevent focus loss
  const updateTextDebounced = useCallback((newText, isOriginal) => {
    if (editorUpdateTimeoutRef.current) {
      clearTimeout(editorUpdateTimeoutRef.current)
    }
    
    editorUpdateTimeoutRef.current = setTimeout(() => {
      if (isOriginal) {
        setOriginalText(newText)
      } else {
        setModifiedText(newText)
      }
    }, 100)
  }, [])

  // Initialize Monaco editor
  useEffect(() => {
    if (!containerRef.current) return

    // Define custom themes
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' }
      ],
      colors: {
        'editor.background': '#0F172A',
        'editor.foreground': '#E2E8F0',
        'editorLineNumber.foreground': '#64748B'
      }
    })

    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' }
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#1E293B'
      }
    })

    if (!diffEditor.current) {
      diffEditor.current = monaco.editor.createDiffEditor(containerRef.current, {
        theme: darkMode ? 'custom-dark' : 'custom-light',
        automaticLayout: true,
        originalEditable: true,
        readOnly: false,
        renderSideBySide: diffMode === 'split',
        useInlineViewWhenSpaceIsLimited: diffMode !== 'split',
        fontSize: 14,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        renderWhitespace: 'boundary'
      })

      // Set up event listeners with debouncing
      const originalEditor = diffEditor.current.getOriginalEditor()
      const modifiedEditor = diffEditor.current.getModifiedEditor()
      
      originalEditor.onDidChangeModelContent(() => {
        updateTextDebounced(originalEditor.getValue(), true)
      })
      
      modifiedEditor.onDidChangeModelContent(() => {
        updateTextDebounced(modifiedEditor.getValue(), false)
      })
    } else {
      diffEditor.current.updateOptions({
        theme: darkMode ? 'custom-dark' : 'custom-light',
        renderSideBySide: diffMode === 'split',
        useInlineViewWhenSpaceIsLimited: diffMode !== 'split'
      })
    }

    return () => {
      if (editorUpdateTimeoutRef.current) {
        clearTimeout(editorUpdateTimeoutRef.current)
      }
    }
  }, [darkMode, diffMode, updateTextDebounced])

  // Update editor models when text or language changes
  useEffect(() => {
    if (!diffEditor.current) return

    const originalModel = monaco.editor.createModel(
      originalText,
      getMonacoLanguage(originalLanguage)
    )
    const modifiedModel = monaco.editor.createModel(
      modifiedText,
      getMonacoLanguage(modifiedLanguage)
    )

    // Dispose old models
    const oldModel = diffEditor.current.getModel()
    if (oldModel) {
      oldModel.original?.dispose()
      oldModel.modified?.dispose()
    }

    diffEditor.current.setModel({
      original: originalModel,
      modified: modifiedModel
    })
  }, [originalText, modifiedText, originalLanguage, modifiedLanguage])

  // Auto-detect language
  useEffect(() => {
    const detectedOriginal = detectLanguage(originalText)
    const detectedModified = detectLanguage(modifiedText)
    
    if (detectedOriginal !== originalLanguage) {
      setOriginalLanguage(detectedOriginal)
    }
    if (detectedModified !== modifiedLanguage) {
      setModifiedLanguage(detectedModified)
    }
  }, [originalText, modifiedText, originalLanguage, modifiedLanguage])

  const showToastMessage = (msg) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const swapContent = () => {
    const tempText = originalText
    const tempLang = originalLanguage
    setOriginalText(modifiedText)
    setOriginalLanguage(modifiedLanguage)
    setModifiedText(tempText)
    setModifiedLanguage(tempLang)
    showToastMessage('Content swapped!')
  }

  const clearAll = () => {
    setOriginalText('')
    setModifiedText('')
    setOriginalLanguage('text')
    setModifiedLanguage('text')
    showToastMessage('All content cleared!')
  }

  const beautifyOriginalJSON = () => {
    if (isValidJSON(originalText)) {
      setOriginalText(beautifyJSON(originalText))
      showToastMessage('Original JSON beautified!')
    }
  }

  const beautifyModifiedJSON = () => {
    if (isValidJSON(modifiedText)) {
      setModifiedText(beautifyJSON(modifiedText))
      showToastMessage('Modified JSON beautified!')
    }
  }

  const sortOriginalJSON = () => {
    if (isValidJSON(originalText)) {
      setOriginalText(sortJSONKeys(originalText))
      showToastMessage('Original JSON keys sorted!')
    }
  }

  const sortModifiedJSON = () => {
    if (isValidJSON(modifiedText)) {
      setModifiedText(sortJSONKeys(modifiedText))
      showToastMessage('Modified JSON keys sorted!')
    }
  }

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      showToastMessage(`${label} copied to clipboard!`)
    } catch (err) {
      showToastMessage('Failed to copy to clipboard')
    }
  }

  const originalIsJSON = isValidJSON(originalText)
  const modifiedIsJSON = isValidJSON(modifiedText)

  return (
    <div className={`flex flex-col h-screen bg-white dark:bg-slate-900 transition-colors duration-200`}>
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Code Diff Editor</h1>
            <p className="text-sm text-slate-300">Compare and analyze code differences</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={swapContent}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            title="Swap original and modified content"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Swap</span>
          </button>
          
          <button
            onClick={clearAll}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
            title="Clear all content"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors duration-200"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Control Panel */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View:</span>
            <button
              onClick={() => setDiffMode(prev => (prev === 'split' ? 'unified' : 'split'))}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                diffMode === 'split' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>{diffMode === 'split' ? 'Split' : 'Unified'}</span>
            </button>
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Lines: {originalText.split('\n').length} / {modifiedText.split('\n').length}
          </div>
        </div>

        {/* JSON Controls */}
        {(originalIsJSON || modifiedIsJSON) && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">JSON:</span>
            
            {originalIsJSON && (
              <>
                <button
                  onClick={beautifyOriginalJSON}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs transition-colors duration-200"
                  title="Beautify original JSON"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Beautify Orig</span>
                </button>
                
                <button
                  onClick={sortOriginalJSON}
                  className="flex items-center space-x-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs transition-colors duration-200"
                  title="Sort original JSON keys"
                >
                  <ArrowUpAZ className="w-3 h-3" />
                  <span>Sort Orig</span>
                </button>
              </>
            )}
            
            {modifiedIsJSON && (
              <>
                <button
                  onClick={beautifyModifiedJSON}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs transition-colors duration-200"
                  title="Beautify modified JSON"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Beautify Mod</span>
                </button>
                
                <button
                  onClick={sortModifiedJSON}
                  className="flex items-center space-x-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs transition-colors duration-200"
                  title="Sort modified JSON keys"
                >
                  <ArrowUpAZ className="w-3 h-3" />
                  <span>Sort Mod</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editor Container */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          
          {/* Editor Info Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Original</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                  {originalLanguage.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Modified</span>
                <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                  {modifiedLanguage.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(originalText, 'Original')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors duration-200"
                title="Copy original content"
              >
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={() => copyToClipboard(modifiedText, 'Modified')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors duration-200"
                title="Copy modified content"
              >
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <div 
              ref={containerRef} 
              className="w-full h-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  )
}