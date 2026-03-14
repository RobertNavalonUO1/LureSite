const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

export const validateProfileForm = (values, t) => {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = t('profile.validation.name_required');
  }

  if (!values.email?.trim()) {
    errors.email = t('profile.validation.email_required');
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = t('profile.validation.email_invalid');
  }

  if (values.phone?.trim() && !PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = t('profile.validation.phone_invalid');
  }

  return errors;
};

export const validateAddressForm = (values, t) => {
  const errors = {};

  if (!values.street?.trim()) errors.street = t('profile.validation.street_required');
  if (!values.city?.trim()) errors.city = t('profile.validation.city_required');
  if (!values.province?.trim()) errors.province = t('profile.validation.province_required');
  if (!values.zip_code?.trim()) errors.zip_code = t('profile.validation.zip_code_required');
  if (!values.country?.trim()) errors.country = t('profile.validation.country_required');

  return errors;
};
