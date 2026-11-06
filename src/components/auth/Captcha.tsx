import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  userInput: string;
  onUserInputChange: (value: string) => void;
}

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(length = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export const Captcha: React.FC<CaptchaProps> = ({
  onVerify,
  userInput,
  onUserInputChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f1f5f9');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Random noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(
        Math.random() * 150
      )}, ${Math.floor(Math.random() * 200)}, 0.4)`;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(
        Math.random() * 200
      )}, ${Math.floor(Math.random() * 200)}, 0.5)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with rotation
    const charSpacing = width / (code.length + 1);
    ctx.font = 'bold 22px "JetBrains Mono", Courier, monospace';
    ctx.textBaseline = 'middle';

    const colors = ['#1e293b', '#0f766e', '#1d4ed8', '#7c2d12', '#4338ca'];

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = (i + 0.8) * charSpacing;
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(char, -8, 0);
      ctx.restore();
    }
  };

  const refreshCaptcha = () => {
    setIsRefreshing(true);
    const newCode = generateRandomCode();
    setCaptchaCode(newCode);
    setTimeout(() => {
      drawCaptcha(newCode);
      setIsRefreshing(false);
    }, 50);
  };

  useEffect(() => {
    const code = generateRandomCode();
    setCaptchaCode(code);
    drawCaptcha(code);
  }, []);

  // Check verification whenever user input or code changes
  useEffect(() => {
    const cleanInput = userInput.trim().toUpperCase();
    const isValid = cleanInput.length > 0 && cleanInput === captchaCode.toUpperCase();
    onVerify(isValid);
  }, [userInput, captchaCode, onVerify]);

  const handleQuickFill = () => {
    onUserInputChange(captchaCode);
  };

  const isMatched =
    userInput.trim().length > 0 &&
    userInput.trim().toUpperCase() === captchaCode.toUpperCase();

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border bg-slate-50/60 dark:bg-slate-900/40">
      <div className="flex items-center justify-between text-xs">
        <label className="font-semibold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" />
          Security Verification (CAPTCHA)
        </label>
        <span className="text-[11px] text-muted-foreground">Bot Protection Active</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Captcha Canvas */}
        <div className="relative border border-slate-300 dark:border-slate-700 rounded overflow-hidden shadow-2xs shrink-0">
          <canvas
            ref={canvasRef}
            width={140}
            height={42}
            className="block select-none"
            title="Security Captcha"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={refreshCaptcha}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
            title="Generate new CAPTCHA"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2 py-1 text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded flex items-center gap-1 transition-colors"
            title="Auto-fill CAPTCHA for fast testing"
          >
            <Zap className="h-3 w-3" />
            Auto-fill
          </button>
        </div>
      </div>

      {/* Input box */}
      <div className="relative">
        <input
          type="text"
          value={userInput}
          onChange={(e) => onUserInputChange(e.target.value.toUpperCase())}
          placeholder="Enter the 5 characters above"
          maxLength={6}
          className="w-full h-9 px-3 text-xs tracking-wider font-mono uppercase bg-background border border-input rounded-md focus:outline-hidden focus:ring-1 focus:ring-ring"
        />
        {userInput.trim().length > 0 && (
          <div className="absolute right-2.5 top-2.5">
            {isMatched ? (
              <span className="flex items-center text-emerald-600 text-[11px] font-medium gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Verified
              </span>
            ) : (
              <span className="text-red-500 text-[11px] font-medium">Incorrect code</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
