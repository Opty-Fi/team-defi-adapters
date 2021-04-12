import { CodeProviderContract } from "./interfaces";
import CompoundCodeProvider from "../../build/CompoundAdapter.json";
import AaveV1CodeProvider from "../../build/AaveV1Adapter.json";
import AaveV2CodeProvider from "../../build/AaveV2Adapter.json";
import CurvePoolCodeProvider from "../../build/CurvePoolAdapter.json";
import CurveSwapCodeProvider from "../../build/CurveSwapAdapter.json";
import CreamCodeProvider from "../../build/CreamAdapter.json";
import DForceCodeProvider from "../../build/DForceAdapter.json";
import FulcrumCodeProvider from "../../build/FulcrumAdapter.json";
import HarvestCodeProvider from "../../build/HarvestAdapter.json";
import YVaultCodeProvider from "../../build/YVaultAdapter.json";
import YearnCodeProvider from "../../build/YearnAdapter.json";
import dYdXCodeProvider from "../../build/dYdXAdapter.json";

//  Json of CodeProviderContract for storing the Abi's of CodeProviderContracts
const codeProviderContract: CodeProviderContract = {
    CompoundCodeProvider: CompoundCodeProvider,
    AaveV1CodeProvider: AaveV1CodeProvider,
    FulcrumCodeProvider: FulcrumCodeProvider,
    DForceCodeProvider: DForceCodeProvider,
    HarvestCodeProvider: HarvestCodeProvider,
    YVaultCodeProvider: YVaultCodeProvider,
    CurvePoolCodeProvider: CurvePoolCodeProvider,
    CurveSwapCodeProvider: CurveSwapCodeProvider,
    dYdXCodeProvider: dYdXCodeProvider,
    CreamCodeProvider: CreamCodeProvider,
    AaveV2CodeProvider: AaveV2CodeProvider,
    YearnCodeProvider: YearnCodeProvider,
};

export { codeProviderContract };
