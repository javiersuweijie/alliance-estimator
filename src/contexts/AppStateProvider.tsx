import { type ReactNode, useState, useMemo } from "react";
import { createContext } from "utils";
import {
  type NativeInputValues,
  type AllianceInputValues,
  isInputField,
} from "data";

type AllianceAssets = Record<
  number,
  {
    name: string;
    inputValues: AllianceInputValues;
  }
>;

export interface IAppState {
  allianceAssets: AllianceAssets;
  addAllianceAsset: (asset: string) => void;
  removeAllianceAsset: (index: number) => void;
  poolTotalValue: number;
  demoNativeInputValues: NativeInputValues;
  handleNativeInputChange: (
    fieldName: keyof NativeInputValues,
    value: string | number
  ) => void;
  handleAllianceInputChange: (
    fieldId: number,
    fieldName: keyof AllianceInputValues,
    value: string | number
  ) => void;
  setAllianceAssets: (newAssets: AllianceAssets) => void;
  setDemoNativeInputValues: (newValues: NativeInputValues) => void;
}

export const [useAppState, AppStateProvider] =
  createContext<IAppState>("useAppState");

export function InitAppState({ children }: { children: ReactNode }) {
  // state
  const [demoNativeInputValues, setDemoNativeInputValues] = useState<NativeInputValues>(
    {
      columnName: "Native",
      inflationRate: NaN, // Chain Data - Annual Inflation Rate
      lsdAnnualEstimate: NaN, // Chain Data - Annual Estimated LSD Growth Rate
      totalTokenSupply: NaN, // Chain Data - Total Token Supply
      assetPrice: NaN, // Chain Data - Asset Price
      allianceRewardWeight: NaN, // Alliance Asset Parameters - Alliance Reward Weight
      assetStakedInAlliance: NaN, // Reward Pool - Asset Staked in Alliance
      denom: "LUNA",
    }
  );
  const [allianceAssets, setAllianceAssets] = useState<AllianceAssets>({});

  const poolTotalValue = useMemo(() => {
    let allianceAssetValue = 0;
    let nativeAssetValue = 0;
    Object.values(allianceAssets).forEach(
      (asset: { name: string; inputValues: AllianceInputValues }) => {
        const inputValues = asset.inputValues;
        allianceAssetValue +=
          inputValues.assetStakedInAlliance *
            (inputValues.annualizedTakeRate / 100) *
            inputValues.assetPrice +
          inputValues.assetStakedInAlliance *
            (inputValues.annualizedTakeRate / 100) *
            (inputValues.lsdAnnualEstimate / 100) *
            inputValues.assetPrice;
      }
    );

    nativeAssetValue =
      demoNativeInputValues.totalTokenSupply *
        (demoNativeInputValues.inflationRate / 100) *
        demoNativeInputValues.assetPrice +
      demoNativeInputValues.totalTokenSupply *
        (demoNativeInputValues.inflationRate / 100) *
        0 *
        demoNativeInputValues.assetPrice;

    return allianceAssetValue + nativeAssetValue;
  }, [
    allianceAssets,
    demoNativeInputValues.assetPrice,
    demoNativeInputValues.inflationRate,
    demoNativeInputValues.totalTokenSupply,
  ]);

  // handlers
  // native input update handler
  const handleNativeInputChange = (
    fieldName: keyof NativeInputValues,
    value: string | number
  ) => {
    if (isInputField(fieldName, demoNativeInputValues)) {
      setDemoNativeInputValues({
        ...demoNativeInputValues,
        [fieldName]: value,
      });
    }
  };

  // alliance input handler
  const handleAllianceInputChange = (
    fieldId: number,
    fieldName: keyof AllianceInputValues,
    value: string | number
  ) => {
    if (isInputField(fieldName, allianceAssets[fieldId].inputValues)) {
      setAllianceAssets({
        ...allianceAssets,
        [fieldId]: {
          ...allianceAssets[fieldId],
          inputValues: {
            ...allianceAssets[fieldId].inputValues,
            [fieldName]: value,
          },
        },
      });
    }
  };

  function addAllianceAsset(asset: string) {
    const newAsset: AllianceInputValues = {
      lsdAnnualEstimate: NaN,
      assetPrice: NaN,
      allianceRewardWeight: NaN,
      annualizedTakeRate: NaN,
      assetStakedInAlliance: NaN,
    };

    setAllianceAssets((cur) => {
      const newId = Date.now().valueOf();
      return {
        ...cur,
        [newId]: {
          name: asset,
          inputValues: newAsset,
        },
      };
    });
  }

  function removeAllianceAsset(id: number) {
    if (!allianceAssets[id]) return;
    const newState = { ...allianceAssets };
    delete newState[id];
    setAllianceAssets(newState);
  }

  // render
  return (
    <AppStateProvider
      value={{
        allianceAssets,
        addAllianceAsset,
        removeAllianceAsset,
        poolTotalValue,
        demoNativeInputValues,
        handleNativeInputChange,
        handleAllianceInputChange,
        setAllianceAssets,
        setDemoNativeInputValues,
      }}
    >
      {children}
    </AppStateProvider>
  );
}

export default InitAppState;
