export const generateRandomSixDigitsNumber = () => {
  const min = 100000;
  const max = 999999;

  return Math.floor(Math.random() * (max - min + 1) + min);
};

// +(Math.random()*100000000).toString().slice(1,7)

export const generateOTP = () => {
  const length = 6;
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits[randomIndex];
  }

  return Number(otp);
};
