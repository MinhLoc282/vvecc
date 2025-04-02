import { ethers } from 'ethers';
import { LTV_DECIMALS, MAX_LTV_PERCENT } from '../constants';

export const formatLTV = (ltvRatio) => {
  return (ltvRatio / 100).toFixed(2) + '%';
};

export const stringToBytes32 = (str) => {
  return ethers.utils.formatBytes32String(str);
};

export const bytes32ToString = (bytes32) => {
  return ethers.utils.parseBytes32String(bytes32);
};

export const convertPythPriceToUint = (price) => {
  const base = BigInt(price.price);
  const exp = price.expo;
  
  if (exp < 0) {
    return base / (10n ** BigInt(-exp));
  } else {
    return base * (10n ** BigInt(exp));
  }
};
export const calculateLTV = (collateral, price) => {
  const currentValue = ethers.BigNumber.from(price).mul(ethers.BigNumber.from(collateral.quantity));
  const maxLoanAmount = currentValue.mul(MAX_LTV_PERCENT).div(10 ** LTV_DECIMALS);
  const ltvRatio = ethers.BigNumber.from(collateral.requestedAmount)
    .div(ethers.BigNumber.from(10).pow(18))
    .mul(10 ** LTV_DECIMALS)
    .div(currentValue);
  return {
    currentValue: currentValue.toString(),
    maxLoanAmount: maxLoanAmount.toString(),
    ltvRatio: ltvRatio.toString(),
    lastUpdateTime: collateral.lastUpdatedTimestamp
  };
};