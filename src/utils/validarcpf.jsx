// utils/validarCPF.js
export function validarCPF(cpf, funcionarios) {
  const cpfJaExiste = funcionarios.some(func => func.cpf === cpf);
  // Remover caracteres não numéricos (como pontos e traços)
  cpf = cpf.replace(/[^\d]+/g, '');

  // Verificar se o CPF possui 11 dígitos
  if (cpf.length !== 11) {
    return false;
  }

  // Verificar se todos os dígitos são iguais (caso de CPFs inválidos como 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Validar o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpf.charAt(9))) {
    return false;
  }

  // Validar o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpf.charAt(10))) {
    return false;
  }

  if(cpfJaExiste){
    console.log('CPF JÁ EXISTE!')
    return false;
  }

  // CPF válido
  return true;
}
