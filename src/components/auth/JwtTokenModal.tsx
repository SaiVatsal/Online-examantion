import React, { useState } from 'react';
import { KeyRound, Copy, Check, ShieldCheck, X } from 'lucide-react';
import { decodeAndVerifyJWT, getStoredToken } from '../../lib/jwt';
import { Button } from '../ui/Button';

interface JwtTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export const JwtTokenModal: React.FC<JwtTokenModalProps> = ({
  isOpen,
  onClose,
  token: propToken,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const currentToken = propToken || getStoredToken();
  const decoded = decodeAndVerifyJWT(currentToken);

  const handleCopy = () => {
    if (!currentToken) return;
    navigator.clipboard.writeText(currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">JWT Token Inspector</h3>
              <p className="text-xs text-muted-foreground">
                RFC 7519 HMAC-SHA256 Signed JSON Web Token
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Status badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold">Token Status:</span>
              <span>{decoded.isValid ? 'VALID & SIGNED (HS256)' : decoded.error || 'INVALID'}</span>
            </div>
            {decoded.payload?.role && (
              <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold uppercase">
                {decoded.payload.role}
              </span>
            )}
          </div>

          {/* Raw Encoded Token */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-muted-foreground font-sans">
              <span className="font-semibold text-foreground">Encoded JWT Token (Bearer)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy Token'}
              </Button>
            </div>
            <div className="p-2.5 rounded bg-slate-900 text-slate-200 text-[11px] break-all select-all font-mono">
              {currentToken || 'No active JWT token found. Sign in to generate one.'}
            </div>
          </div>

          {/* Decoded Header */}
          <div className="space-y-1">
            <span className="font-semibold text-foreground font-sans">Header (Algorithm & Token Type)</span>
            <pre className="p-2.5 rounded bg-muted text-foreground text-[11px] overflow-x-auto">
              {JSON.stringify(decoded.header || { alg: 'HS256', typ: 'JWT' }, null, 2)}
            </pre>
          </div>

          {/* Decoded Payload Claims */}
          <div className="space-y-1">
            <span className="font-semibold text-foreground font-sans">Payload Claims (User & Permissions)</span>
            <pre className="p-2.5 rounded bg-muted text-foreground text-[11px] overflow-x-auto">
              {JSON.stringify(
                decoded.payload || {
                  info: 'Sign in to populate claims (sub, email, role, regNo, exp)',
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
