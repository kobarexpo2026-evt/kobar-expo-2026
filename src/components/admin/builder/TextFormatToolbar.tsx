import React from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

interface TextFormatToolbarProps {
  textareaId: string;
  value: string;
  onChange: (newValue: string) => void;
}

export const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  textareaId,
  value,
  onChange,
}) => {
  const applyFormat = (tag: 'b' | 'i' | 'u') => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(value + `<${tag}>teks</${tag}>`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = '';
    if (selectedText.length > 0) {
      replacement = `<${tag}>${selectedText}</${tag}>`;
    } else {
      replacement = `<${tag}>teks penting</${tag}>`;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + replacement.length - (tag.length + 3));
    }, 50);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-850 rounded-lg border border-stone-200 dark:border-stone-800">
      <button
        type="button"
        onClick={() => applyFormat('b')}
        className="p-1.5 rounded-md hover:bg-white dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
        title="Tebal (Bold: <b>...</b>)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => applyFormat('i')}
        className="p-1.5 rounded-md hover:bg-white dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
        title="Miring (Italic: <i>...</i>)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => applyFormat('u')}
        className="p-1.5 rounded-md hover:bg-white dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
        title="Garis Bawah (Underline: <u>...</u>)"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <span className="text-[10px] text-stone-400 font-mono ml-1">
        HTML Formatter
      </span>
    </div>
  );
};
