import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScenarioInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ScenarioInput({ 
  value, 
  onChange, 
  placeholder = "Describe your test scenario...",
  className = ""
}: ScenarioInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(80);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${height}px`;
    }
  }, [height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = height;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = Math.max(60, Math.min(300, startHeight + e.clientY - startY));
      setHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setHeight(200);
    } else {
      setHeight(80);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-300">Scenario</label>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpand}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </div>
      </div>
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-all duration-200"
          style={{ height: `${height}px` }}
        />
        
        {/* Resize handle */}
        <div
          ref={resizeRef}
          className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center transition-opacity ${
            isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-0.5 bg-slate-500 rounded-full" />
        </div>
      </div>
      
      <div className="mt-1 text-xs text-slate-500">
        {value.length} characters
      </div>
    </div>
  );
}
