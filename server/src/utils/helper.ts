export const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000);
};
