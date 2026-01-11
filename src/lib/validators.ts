/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas)
 * @param cpf - The CPF string to validate (can include formatting)
 * @returns true if valid, false otherwise
 */
export function validateCPF(cpf: string): boolean {
    // Remove all non-digit characters
    const cleanCPF = cpf.replace(/\D/g, '');

    // Check if has 11 digits
    if (cleanCPF.length !== 11) return false;

    // Check for known invalid CPFs (all digits the same)
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit >= 10) firstDigit = 0;
    if (firstDigit !== parseInt(cleanCPF.charAt(9))) return false;

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit >= 10) secondDigit = 0;
    if (secondDigit !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
}

/**
 * Formats a CPF string with standard Brazilian formatting
 * @param cpf - The CPF string (digits only or with formatting)
 * @returns Formatted CPF (000.000.000-00) or original if invalid length
 */
export function formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) return cpf;

    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Validates CNPJ (for suppliers)
 */
export function validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    // Validate first check digit
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    let firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (firstDigit !== parseInt(cleanCNPJ.charAt(12))) return false;

    // Validate second check digit
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    let secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (secondDigit !== parseInt(cleanCNPJ.charAt(13))) return false;

    return true;
}

export function formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return cnpj;

    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
