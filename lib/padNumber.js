module.exports = (input, length, pad = '0') => {
  let inputStr = String(input);
  while (inputStr.length < length) {
    inputStr = pad + inputStr;
  }
  return inputStr;
};
