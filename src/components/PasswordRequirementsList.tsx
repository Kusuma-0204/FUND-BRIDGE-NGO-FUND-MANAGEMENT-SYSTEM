import React from 'react';
import { Check, X } from 'lucide-react';
import { validatePasswordPolicy } from '../utils/passwordValidator';

interface PasswordRequirementsListProps {
  password: string;
  showAlways?: boolean;
}

export const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({
  password,
  showAlways = false
}) => {
  if (!password && !showAlways) return null;

  const { rules } = validatePasswordPolicy(password);

  const criteria = [
    { label: 'At least 8 characters', met: rules.minLength },
    { label: 'First letter must be a Capital letter (A-Z)', met: rules.firstCapital },
    { label: 'Contains lowercase letters (a-z)', met: rules.hasLowerCase },
    { label: 'Contains numbers (0-9)', met: rules.hasNumber },
    { label: 'Contains symbols or special characters (e.g. @, #, $, %, !)', met: rules.hasSymbol },
  ];

  return (
    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 mt-2 text-xs">
      <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
        <span>Password Requirements:</span>
        <span className={criteria.every(c => c.met) ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
          {criteria.filter(c => c.met).length} of 5 satisfied
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1 pt-1">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 text-[11px] transition-colors ${
              item.met ? 'text-emerald-400 font-medium' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.met
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {item.met ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
