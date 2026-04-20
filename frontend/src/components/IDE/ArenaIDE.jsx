import { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout.jsx';
import Editor from '@monaco-editor/react';

const STARTER = `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Your solution here
    
    return 0;
}`;

const DIFF_COLORS = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' };

function ArenaIDE({ theme, toggleTheme, selected, setShowIDE }) {
  const isDark = theme === 'dark';
  const [code, setCode] = useState(STARTER);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');

  const surface  = isDark ? '#1b1c1e' : '#FFFFFF';
  const border   = isDark ? 'rgba(70,69,84,0.15)' : 'rgba(0,0,0,0.08)';
  const textPri  = isDark ? '#e3e2e5' : '#0F172A';
  const textSec  = isDark ? '#908fa0' : '#64748B';

  const runCode = async () => {
    setOutput('Running code...\nWait a moment please...');
    try {
      const response = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler: 'gcc-head',
          code: code,
          stdin: customInput,
          save: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === '0') {
        setOutput((data.program_message || data.program_output || 'Success (no output)').trim());
      } else {
        setOutput((data.compiler_error || data.program_error || data.compiler_message || 'Execution failed').trim());
      }
    } catch (error) {
      setOutput(`Error connecting to compiler service: ${error.message}`);
    }
  };

  return (
    <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
      <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setShowIDE(false)} className="text-xs flex items-center gap-1 mb-1 hover:opacity-70 transition-opacity" style={{ color: '#6366F1' }}>
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Arena
            </button>
            <h1 className="text-xl font-headline font-bold" style={{ color: textPri }}>{selected.title}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: `${DIFF_COLORS[selected.diff]}18`, color: DIFF_COLORS[selected.diff] }}>
              {selected.diff}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={runCode}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: '#22C55E', color: '#fff' }}>
              ▶ Run (C++)
            </button>
            {selected.lcId && (
              <a href={`https://leetcode.com/problems/${selected.lcId}`} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{ background: '#FFA116', color: '#fff' }}>
                LeetCode ↗
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-4 flex-grow min-h-0">
          {/* Editor */}
          <div className="flex-grow rounded-2xl overflow-hidden code-editor-container" style={{ border: `1px solid ${border}` }}>
            <Editor
              height="100%"
              defaultLanguage="cpp"
              theme={isDark ? 'vs-dark' : 'light'}
              value={code}
              onChange={v => setCode(v || '')}
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 16 } }}
            />
          </div>
          {/* Input & Output Panel */}
          <div className="w-80 flex flex-col gap-4">
            {/* Input */}
            <div className="flex-1 rounded-2xl p-4 flex flex-col min-h-0" style={{ background: surface, border: `1px solid ${border}` }}>
              <p className="text-[10px] uppercase font-bold mb-2" style={{ color: textSec }}>Input (stdin)</p>
              <textarea 
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter test inputs here..."
                className="w-full h-full text-xs font-mono outline-none resize-none bg-transparent"
                style={{ color: textPri }}
              />
            </div>
            
            {/* Output */}
            <div className="flex-1 rounded-2xl p-4 flex flex-col min-h-0" style={{ background: surface, border: `1px solid ${border}` }}>
              <p className="text-[10px] uppercase font-bold mb-2" style={{ color: textSec }}>Output</p>
              <pre className="text-xs font-mono leading-relaxed flex-grow overflow-auto" style={{ color: output ? '#22C55E' : textSec }}>
                {output || 'Run your code to see output...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ArenaIDE;
