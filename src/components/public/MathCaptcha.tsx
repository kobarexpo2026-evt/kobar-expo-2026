import React, { useState, useEffect } from 'react';
import { RotateCw, ShieldCheck } from 'lucide-react';

interface MathCaptchaProps {
  onValidated: (isValid: boolean) => void;
}

export const MathCaptcha: React.FC<MathCaptchaProps> = ({ onValidated }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1; // 1 - 9
    const b = Math.floor(Math.random() * 9) + 1; // 1 - 9
    setNum1(a);
    setNum2(b);
    setUserAnswer('');
    setIsAnswerCorrect(false);
    onValidated(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setUserAnswer(val);

    const expected = num1 + num2;
    if (parseInt(val, 10) === expected) {
      setIsAnswerCorrect(true);
      onValidated(true);
    } else {
      setIsAnswerCorrect(false);
      onValidated(false);
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-200/80 dark:border-amber-900/40 space-y-2 font-baloo">
      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
        <span className="font-semibold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          Verifikasi Keamanan (Anti-Spam Bot):
        </span>
        <button
          type="button"
          onClick={generateCaptcha}
          className="text-[11px] text-stone-500 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
          title="Ganti Soal"
        >
          <RotateCw className="w-3 h-3" />
          <span>Ganti Soal</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono font-bold text-sm tracking-wider text-amber-700 dark:text-amber-300 select-none">
          {num1} + {num2} = ?
        </div>

        <input
          type="number"
          placeholder="Jawaban angka..."
          value={userAnswer}
          onChange={handleChange}
          className={`flex-1 px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-stone-900 font-bold focus:outline-none ${
            isAnswerCorrect
              ? 'border-emerald-500 text-emerald-600 focus:ring-1 focus:ring-emerald-500'
              : 'border-stone-200 dark:border-stone-800 focus:border-amber-500'
          }`}
          required
        />

        {isAnswerCorrect && (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
            ✓ Cocok
          </span>
        )}
      </div>
    </div>
  );
};
