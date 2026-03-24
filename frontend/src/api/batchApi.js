import { api } from './axiosConfig';

export const batchApi = {
  getByMedicine: (medicineId) =>
    api.get('/inventory/batches', { params: { medicineId } }).then((res) => res.data.data.batches),
};
