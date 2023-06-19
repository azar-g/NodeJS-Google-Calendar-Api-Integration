import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(19);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const comparePassword = async function (
  canditatePassword: string,
  savedPassword: string
) {
  const isMatch = await bcrypt.compare(canditatePassword, savedPassword);
  return isMatch;
};
