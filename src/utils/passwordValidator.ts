export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
  rules: {
    minLength: boolean;
    firstCapital: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const pwd = password || '';
  const minLength = pwd.length >= 8;
  const firstCapital = /^[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

  const valid = minLength && firstCapital && hasLowerCase && hasNumber && hasSymbol;

  let message = '';
  if (!firstCapital) {
    message = 'First character must be an uppercase Capital letter (A-Z).';
  } else if (!minLength) {
    message = 'Password must contain at least 8 characters.';
  } else if (!hasLowerCase) {
    message = 'Password must contain lowercase letters (a-z).';
  } else if (!hasNumber) {
    message = 'Password must contain at least one number (0-9).';
  } else if (!hasSymbol) {
    message = 'Password must contain at least one symbol or special character (e.g. @, #, $, %, !).';
  }

  return {
    valid,
    message,
    rules: {
      minLength,
      firstCapital,
      hasLowerCase,
      hasNumber,
      hasSymbol
    }
  };
}
