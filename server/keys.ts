const digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const length = 16;

export function generateKey() {
  let key = "";

  for (let i = 0; i < length; i++) {
    key += digits[Math.floor(Math.random() * digits.length)];
  }

  return key;
}