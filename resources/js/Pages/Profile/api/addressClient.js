import axios from 'axios';

const unwrapResponse = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    if (error.response?.status === 422) {
      throw {
        type: 'validation',
        message: error.response.data.message || null,
        errors: error.response.data.errors || {},
      };
    }

    throw {
      type: 'request',
      message: error.response?.data?.message || null,
      errors: {},
    };
  }
};

export const addressClient = {
  create(payload) {
    return unwrapResponse(axios.post(route('addresses.store'), payload));
  },

  update(addressId, payload) {
    return unwrapResponse(axios.patch(route('addresses.update', addressId), payload));
  },

  setDefault(addressId) {
    return unwrapResponse(axios.patch(route('addresses.default', addressId)));
  },

  destroy(addressId) {
    return unwrapResponse(axios.delete(route('addresses.destroy', addressId)));
  },
};
