import { useErp } from '../store';

export const useMaterialesRedux = () => {
  const { materiales, addMaterial, updateMaterial, deleteMaterial } = useErp();

  return {
    materiales,
    status: 'succeeded' as const,
    error: null,
    load: () => {},
    create: addMaterial,
    update: (id: string, patch: any) => updateMaterial(id, patch),
    remove: deleteMaterial,
  };
};

export default useMaterialesRedux;