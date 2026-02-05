import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@headlessui/react'
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalIsTextContentEmpty } from '@lexical/react/useLexicalIsTextContentEmpty';
import { $getRoot, COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND, $createParagraphNode, $createTextNode } from 'lexical';
import type { LexicalEditor } from 'lexical';

// Plugin to handle Enter key vs Shift+Enter
function EnterKeyPlugin({ onSubmit, disabled }: { onSubmit: () => void; disabled: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        if (disabled) {
          event.preventDefault();
          return true;
        }

        if (event.shiftKey) {
          // Shift+Enter: allow default behavior (newline)
          return false;
        } else {
          // Enter: submit the form
          event.preventDefault();
          onSubmit();
          return true;
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onSubmit, disabled]);

  return null;
}

// Plugin to set initial value
function InitialValuePlugin({ initQuery }: { initQuery?: string | null }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initQuery) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(initQuery));
        root.append(paragraph);
      });
    }
  }, [editor, initQuery]);

  return null;
}

// Plugin to handle focus state
function FocusPlugin({ onFocusChange }: { onFocusChange: (focused: boolean) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement !== null) {
        prevRootElement.removeEventListener('focus', () => onFocusChange(true));
        prevRootElement.removeEventListener('blur', () => onFocusChange(false));
      }
      if (rootElement !== null) {
        rootElement.addEventListener('focus', () => onFocusChange(true));
        rootElement.addEventListener('blur', () => onFocusChange(false));
      }
    });
  }, [editor, onFocusChange]);

  return null;
}

// Combined plugin to expose editor instance and track empty/multiline state
function EditorStatePlugin({
  editorRef,
  onEmptyChange,
  onMultilineChange
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
  onEmptyChange: (isEmpty: boolean) => void;
  onMultilineChange: (isMultiline: boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const isEmpty = useLexicalIsTextContentEmpty(editor);
  const initialHeightRef = useRef<number | null>(null);
  const isMultilineRef = useRef<boolean>(false);

  // Set editor ref
  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  // Track empty state
  useEffect(() => {
    onEmptyChange(isEmpty);

    // Reset multiline to false when editor becomes empty
    if (isEmpty && isMultilineRef.current) {
      isMultilineRef.current = false;
      onMultilineChange(false);
    }
  }, [isEmpty, onEmptyChange, onMultilineChange]);

  // Track height changes for multiline detection
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // Capture initial height
    if (initialHeightRef.current === null) {
      initialHeightRef.current = rootElement.offsetHeight;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const currentHeight = entry.contentRect.height;
        // Only set to true when height increases (text wraps)
        if (initialHeightRef.current !== null && currentHeight >= initialHeightRef.current) {
          if (!isMultilineRef.current) {
            isMultilineRef.current = true;
            onMultilineChange(true);
          }
        }
        // Don't set to false here - only reset when empty (handled above)
      }
    });

    resizeObserver.observe(rootElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [editor, onMultilineChange]);

  return null;
}

export function SearchQuery({initQuery, className, inputClassName, loading, handleSearch, placeholder="Ask anything..."} : {initQuery?: string | null; className?: string; inputClassName?: string; placeholder?: string; loading: boolean; handleSearch: (query: string) => Promise<void>}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const [hasText, setHasText] = useState(!!initQuery);
  const editorRef = useRef<LexicalEditor | null>(null);

  const initialConfig = {
    namespace: 'SearchQuery',
    theme: {
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
      },
    },
    onError: (error: Error) => {
      console.error(error);
    },
  };

  const handleSubmit = useCallback(async () => {
    if (!editorRef.current || loading) return;

    // Only serialize when submitting
    const query = editorRef.current.getEditorState().read(() => {
      const root = $getRoot();
      return root.getTextContent();
    });

    if (query.trim()) {
      await handleSearch(query);
    }
  }, [loading, handleSearch]);

  const handleEmptyChange = useCallback((isEmpty: boolean) => {
    setHasText(!isEmpty);
  }, []);

  const handleMultilineChange = useCallback((isMultiline: boolean) => {
    setIsMultiline(isMultiline);
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={clsx(`flex relative rounded-lg border transition-all duration-200`,
          isFocused
            ? 'border-gray-400 shadow-md ring-2 ring-gray-100'
            : 'border-gray-200 hover:border-gray-300',
          isMultiline ? 'flex-col items-stretch gap-0' : 'flex-row items-center gap-3',
          className || 'bg-white'
        )}
      >
        <div className={clsx(
          'absolute left-3.5 pointer-events-none z-10',
          isMultiline ? 'hidden' : ''
        )}>
          <MagnifyingGlassIcon className='size-4 text-gray-400'/>
        </div>
        <div className="flex-1 relative">
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className={clsx(
                  "outline-none flex-1 m-0 rounded-md text-base px-4 py-3 text-gray-900",
                  isMultiline ? "pl-4" : "pl-10 pr-12",
                  inputClassName,
                  loading && "opacity-50 cursor-not-allowed"
                )}
                aria-placeholder={placeholder}
                placeholder={
                  <div className={clsx("absolute top-3 text-base text-gray-400 pointer-events-none select-none",
                    isMultiline ? "left-4" : "left-10 truncate right-10"

                  )}>
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={() => null}
          />
          <HistoryPlugin />
          <EnterKeyPlugin onSubmit={handleSubmit} disabled={loading} />
          <InitialValuePlugin initQuery={initQuery} />
          <FocusPlugin onFocusChange={setIsFocused} />
          <EditorStatePlugin
            editorRef={editorRef}
            onEmptyChange={handleEmptyChange}
            onMultilineChange={handleMultilineChange}
          />
        </div>
        <div className={clsx(
          isMultiline ? 'relative flex justify-end p-2' : 'absolute right-2 '
        )}>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!hasText || loading}
            className={`p-2 rounded-md transition-all duration-200 ${
              hasText && !loading
                ? 'bg-black text-white hover:bg-gray-800 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Submit search"
          >
            {loading ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <ArrowRightIcon className='size-4'/>
            )}
          </Button>
        </div>
      </div>
    </LexicalComposer>
  );
}
