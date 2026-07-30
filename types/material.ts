export interface SapMatlStkInAcctMod {
    Material: string;
    Plant: string;
    StorageLocation: string;
    MaterialBaseUnit: string;
    MatlWrhsStkQtyInMatlBaseUnit: string;
  }
  
export interface MaterialWithUI {
    id: string; 
    material: string;
    plant: string;
    storageLocation: string;
    quantity: number;
    unit: string;
    status: 'Low' | 'OK';
    favourite: boolean;
    memoCount: number;
  }